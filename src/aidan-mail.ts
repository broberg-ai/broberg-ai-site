/* «Få oplæsningen tilsendt på mail» (F007.9) — lead-indsamling via lydfilen.
 *
 * Christians idé 4/9, GO samme aften: lydfilen ligger allerede på serveren
 * (hentLyd cacher pr. indhold+stemme), så mailen er ren levering + lead.
 *
 * Afsendelse via @broberg/mail (aldrig rå Resend): ship-dark uden nøgle, og
 * pakkens fail-safe (live=false → kun allowlist) gælder indtil MAIL_LIVE=true.
 * Hver mail bcc'er cb@webhouse.dk — det ER lead-opsamlingen OG kopireglen —
 * og leadet appendes desuden som JSONL på den varige disk, så listen kan
 * læses samlet uden at grave i en indbakke.
 *
 * SAMTYKKET HÅNDHÆVES PÅ SERVEREN: uden samtykke === true sendes intet,
 * uanset hvad UI'et viste. Et flueben i browseren er en høflighed.
 */
import { createHash } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { Context } from "hono";
import { createMailerFromEnv, type Mailer } from "@broberg/mail";
import { hentLyd, laesKonfigureret, LydFejl, type Persona } from "@/aidan-laes.ts";

const LEADS_FIL = process.env.AIDAN_LEADS ?? "/data/aidan-leads.jsonl";

let _mailer: Mailer | null = null;
const mailer = () => (_mailer ??= createMailerFromEnv());
export function resetMailForTest(m?: Mailer): void {
  _mailer = m ?? null;
  hits.clear();
}

export function mailKonfigureret(): boolean {
  return !!process.env.RESEND_API_KEY;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Samme forsigtige spærre som /laes — en mail-rute er et spam-mål.
const VINDUE_MS = 60_000;
const MAX_PR_VINDUE = 3;
const hits = new Map<string, number[]>();
function rateLimited(c: Context): boolean {
  const ip = c.req.header("fly-client-ip") || c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "ukendt";
  const key = createHash("sha256").update(ip).digest("hex").slice(0, 16);
  const nu = Date.now();
  const liste = (hits.get(key) ?? []).filter((t) => nu - t < VINDUE_MS);
  if (liste.length >= MAX_PR_VINDUE) return true;
  liste.push(nu);
  hits.set(key, liste);
  if (hits.size > 5000) hits.clear();
  return false;
}

async function gemLead(lead: Record<string, unknown>): Promise<void> {
  try {
    await mkdir(path.dirname(LEADS_FIL), { recursive: true });
    await appendFile(LEADS_FIL, JSON.stringify(lead) + "\n");
  } catch (e) {
    // Leadet står stadig i bcc-kopien — men sig det i loggen frem for at tie.
    console.error("[aidan-mail] kunne ikke gemme lead:", e);
  }
}

export async function handleAidanSendLyd(c: Context): Promise<Response> {
  if (!laesKonfigureret() || !mailKonfigureret()) return c.json({ error: "ikke_konfigureret" }, 503);
  if (rateLimited(c)) return c.json({ error: "rate_limited" }, 429);

  let sti = "";
  let persona: Persona = "aidan";
  let email = "";
  let samtykke = false;
  try {
    const krop = await c.req.json();
    sti = String(krop?.sti ?? "");
    email = String(krop?.email ?? "").trim();
    samtykke = krop?.samtykke === true;
    if (krop?.persona === "airina") persona = "airina";
  } catch {
    return c.json({ error: "ugyldig_krop" }, 400);
  }
  if (!EMAIL_RE.test(email)) return c.json({ error: "ugyldig_email" }, 400);
  if (!samtykke) return c.json({ error: "samtykke_kraevet" }, 400);

  try {
    const { audio, mimeType, titel } = await hentLyd(sti, persona);
    const en = sti === "/en" || sti.startsWith("/en/");
    const url = `https://broberg.ai${sti}`;
    const resultat = await mailer().send({
      to: email,
      bcc: "cb@webhouse.dk",
      subject: en ? `Your reading: ${titel}` : `Din oplæsning: ${titel}`,
      text: en
        ? `Hi!\n\nHere is the reading you asked for on broberg.ai: "${titel}".\nThe audio file is attached — the article itself lives at ${url}\n\n— Aidan, AI guide at broberg.ai`
        : `Hej!\n\nHer er oplæsningen du bad om på broberg.ai: «${titel}».\nLydfilen er vedhæftet — selve artiklen bor på ${url}\n\n— Aidan, AI-guide på broberg.ai`,
      attachments: [
        {
          filename: `${sti.split("/").filter(Boolean).pop() ?? "oplaesning"}.mp3`,
          content: audio,
          contentType: mimeType,
        },
      ],
      tags: [{ name: "kilde", value: "aidan-oplaesning" }],
    });
    if (!resultat.ok) {
      console.error("[aidan-mail] send fejlede:", resultat.error);
      return c.json({ error: "send_fejlede" }, 502);
    }
    await gemLead({
      email,
      sti,
      titel,
      persona,
      samtykke: true,
      tidspunkt: new Date().toISOString(),
      leveret: !resultat.skipped,
    });
    console.log(`[aidan-mail] ${resultat.skipped ? "gated (ikke-live)" : "sendt"} til lead for ${sti}`);
    return c.json({ ok: true, gated: !!resultat.skipped });
  } catch (e) {
    if (e instanceof LydFejl) return c.json({ error: e.message }, e.status);
    throw e;
  }
}
