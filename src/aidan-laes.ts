/* Oplæsning af indsigter (F007.7 + F007.8) — «Skal jeg læse artiklen højt?»
 *
 * Christians bestilling 4/9: tilbuddet må KUN gælde news posts (indsigter),
 * aldrig almindelige sider. Derfor er facitlisten server-autoritativ: klienten
 * spørger /api/aidan/indsigter om hvilke stier der ER indsigter, og /laes
 * afviser alt der ikke står på samme liste — uanset hvad klienten sender.
 *
 * TTS går gennem @broberg/ai-sdk (ai.tts, F020.4) med Azure-adapteren —
 * Christian valgte stemmerne 4/9: Aidan = «jeppe» (ung mandlig, native dansk),
 * Airina = «christel». Engelske artikler læses af de multilinguale Andrew/Ava.
 * voiceFallback er BEVIDST udeladt: stemmen er en identitet, og forsvinder
 * den skal det larme — ikke tale videre med en fremmeds stemme (F037).
 *
 * TTS koster pr. tegn, så lyden caches på disk pr. indholds-hash: samme
 * artikelversion koster præcis ét kald. Cachen er ephemeral (nulstilles ved
 * deploy) — det er den billige og rigtige afvejning her.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Context } from "hono";
import { createAI, type AiClient } from "@broberg/ai-sdk";
import { config, type Locale } from "@/config.ts";
import { buildSearchIndex } from "@/content/compose.ts";
import { tilTekst } from "@/trail-clip.ts";

/** Persona → stemme pr. sprog (Azure-rosteret i ai-sdk). */
const STEMMER = {
  aidan: { da: "jeppe", en: "andrew" },
  airina: { da: "christel", en: "ava" },
} as const;
export type Persona = keyof typeof STEMMER;
const TEKST_LOFT = 12_000;
const CACHE_DIR = process.env.AIDAN_LAES_CACHE ?? ".cache/aidan-laes";

export function laesKonfigureret(): boolean {
  return !!process.env.AZURE_SPEECH_KEY;
}

let _ai: AiClient | null = null;
const ai = () => (_ai ??= createAI());
export function resetLaesForTest(client?: AiClient): void {
  _ai = client ?? null;
  _stier = null;
  hits.clear();
}

/** Markdown-agtig sidetekst → noget et menneske gider HØRE. Links læses som
 *  deres tekst (aldrig URL'en), markører (#, -) siges ikke højt. */
export function tilTale(md: string): string {
  return md
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,4}\s+/gm, "")
    .replace(/^-\s+/gm, "")
    .replace(/[*_`]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n\n")
    .trim()
    .slice(0, TEKST_LOFT);
}

export function laesCacheNoegle(tale: string, stemme: string): string {
  return createHash("sha256").update(`${stemme}\n${tale}`).digest("hex").slice(0, 32);
}

// ── Indsigts-stierne — KUN posts-samlingen, fra sitets kanoniske søgeindeks.
// Cache 5 min: listen ændrer sig ved udgivelser, ikke pr. request.
let _stier: { sæt: Set<string>; hentet: number } | null = null;
async function indsigtsStier(): Promise<Set<string>> {
  if (_stier && Date.now() - _stier.hentet < 300_000) return _stier.sæt;
  const sæt = new Set<string>();
  for (const locale of ["da", "en"] as Locale[]) {
    for (const e of await buildSearchIndex(locale)) {
      if (e.id.startsWith("post:") && typeof e.data === "string") sæt.add(e.data);
    }
  }
  _stier = { sæt, hentet: Date.now() };
  return sæt;
}

// Egen, strammere spærre end chatten: TTS er dyr pr. kald.
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

export async function handleAidanIndsigter(c: Context): Promise<Response> {
  if (!laesKonfigureret()) return c.json({ stier: [] });
  return c.json({ stier: [...(await indsigtsStier())] });
}

export async function handleAidanLaes(c: Context): Promise<Response> {
  if (!laesKonfigureret()) return c.json({ error: "ikke_konfigureret" }, 503);
  if (rateLimited(c)) return c.json({ error: "rate_limited" }, 429);

  let sti = "";
  let persona: Persona = "aidan";
  try {
    const krop = await c.req.json();
    sti = String(krop?.sti ?? "");
    if (krop?.persona === "airina") persona = "airina";
  } catch {
    return c.json({ error: "ugyldig_krop" }, 400);
  }
  if (!(await indsigtsStier()).has(sti)) return c.json({ error: "ikke_en_indsigt" }, 404);

  const res = await fetch(`http://127.0.0.1:${config.port}${sti}`);
  if (!res.ok) return c.json({ error: "side_utilgaengelig" }, 502);
  const tale = tilTale(tilTekst(await res.text()));
  if (tale.length < 200) return c.json({ error: "for_tynd" }, 422);

  const locale: Locale = sti === "/en" || sti.startsWith("/en/") ? "en" : "da";
  const stemme = STEMMER[persona][locale];
  await mkdir(CACHE_DIR, { recursive: true });
  const fil = path.join(CACHE_DIR, `${laesCacheNoegle(tale, stemme)}.mp3`);
  try {
    const cached = await readFile(fil);
    return new Response(new Uint8Array(cached), {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=86400" },
    });
  } catch {
    /* ikke i cache endnu */
  }

  const { audio, mimeType } = await ai().tts({
    text: tale,
    voice: stemme,
    lang: locale === "en" ? "en-US" : "da-DK",
    override: { provider: "azure" },
  });
  await writeFile(fil, audio).catch(() => {}); // en fejlet cache-skrivning må aldrig koste svaret
  console.log(`[aidan-laes] genereret ${audio.byteLength} bytes (${stemme}) for ${sti}`);
  return new Response(new Uint8Array(audio), {
    headers: { "Content-Type": mimeType || "audio/mpeg", "Cache-Control": "private, max-age=86400" },
  });
}
