/**
 * F024.2 — supportformularens serverrute.
 *
 * ── HVORFOR DEN IKKE POSTER DIREKTE TIL HELPDESK ─────────────────────────
 * HelpDesks regel er utvetydig: server til server, aldrig fra en browser.
 * Vores side → vores backend → dem. Nøglen når aldrig et JS-bundt.
 *
 * ── DEN VIGTIGSTE BESLUTNING: HENVENDELSEN MÅ IKKE KUNNE FORSVINDE ───────
 * Fejler HelpDesk, står der et menneske i den anden ende som tror hun har
 * rakt ud. Så ruten falder tilbage til CMS'ets formular-motor — den samme
 * der allerede bærer kontaktformularen og allerede når et menneske.
 *
 * Reservevejen er ikke et plaster: det er dét der gør forskellen på en
 * fattigere oplevelse og et tabt menneske. Og svaret SIGER hvilken vej der
 * blev brugt, så «det virkede» ikke dækker over at HelpDesk var nede i en uge.
 *
 * ── MAILADRESSEN ER ET HINT, ALDRIG EN MODTAGER ──────────────────────────
 * HelpDesks afsnit 6: sender vi en adresse gennem VORES nøgle, stoler de på
 * den, og vi hæfter. En adresse en anonym besøgende har tastet, har vi ingen
 * grund til at tro på — den kan være en fremmeds. Den går derfor i sagens
 * KROP som en oplyst formodning, aldrig i requesterEmail.
 */
import type { Context } from "hono";
import { isHoneypotTriggered, hashIp, isRateLimited, validateTurnstile } from "@broberg/forms-turnstile/server";
import { opretSag, HelpDeskFejl } from "@/helpdesk.ts";

const CMS_FORMULAR = "https://webhouse.app/api/forms/contact?site=broberg-ai";

export interface SupportSvar {
  ok: boolean;
  /** Sagens reference — kun når HelpDesk tog imod. Kan læses op i telefonen. */
  ref?: string;
  /** Hvilken vej henvendelsen faktisk gik. Aldrig gættet af kalderen. */
  vej: "helpdesk" | "reserve" | "ingen";
  fejl?: string;
}

/** Emnet skal kunne stå på en mail. Er der intet, laves det af beskeden —
 *  frem for at sende en tom streng HelpDesk så afviser med 400. */
export function emneFor(emne: string, besked: string): string {
  const rent = emne.trim();
  if (rent) return rent.slice(0, 120);
  const foerste = besked.trim().split(/\r?\n/)[0] ?? "";
  return (foerste.slice(0, 80) || "Henvendelse fra broberg.ai").trim();
}

/**
 * Sagens krop. Navn og mail står HER som oplyste formodninger, ikke som
 * felter nogen kan handle på uden at læse dem.
 */
export function kropFor(besked: string, navn?: string, email?: string): string {
  const linjer = [besked.trim()];
  const oplyst: string[] = [];
  if (navn?.trim()) oplyst.push(`navn: ${navn.trim()}`);
  if (email?.trim()) oplyst.push(`mail: ${email.trim()}`);
  if (oplyst.length) {
    linjer.push(
      "",
      `— Oplyst af den besøgende, IKKE bekræftet: ${oplyst.join(" · ")}`,
      "  (skrevet i et felt på broberg.ai; ingen har bevist at adressen er deres)",
    );
  }
  return linjer.join("\n");
}

/** Reservevejen: CMS'ets formular-motor, som allerede når et menneske. */
async function tilReserve(navn: string, email: string, besked: string): Promise<boolean> {
  try {
    const r = await fetch(CMS_FORMULAR, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: navn || "(ikke oplyst)",
        email: email || "",
        message: `[SUPPORT — HelpDesk svarede ikke]\n\n${besked}`,
      }),
    });
    const j = (await r.json().catch(() => ({}))) as { ok?: boolean };
    return Boolean(r.ok && j.ok);
  } catch {
    return false;
  }
}

/**
 * Spam-porten. TRE værn, og det tredje er MØRKT indtil en hemmelighed er sat.
 *
 * honeypot + hastighedsgrænse kræver ingen tredjepart og sender ikke én
 * personoplysning ud af huset. De kører altid.
 *
 * TURNSTILE er en anden slags handel, og den er Christians at tage:
 * widgeten sender den besøgendes IP-ADRESSE, TLS-FINGERAFTRYK og USER-AGENT
 * til Cloudflare. Målt 15/9-2026 i Cloudflares eget Turnstile-tillæg: det
 * oplyser HVAD der indsamles og IKKE hvor behandlingen sker — hverken region,
 * land eller overførselsgrundlag. En IP-adresse er en personoplysning efter
 * GDPR uanset at Cloudflare skriver at de ikke selv kan sætte navn på den.
 *
 * Derfor er koden her og slukket: uden TURNSTILE_SECRET_KEY springes
 * verifikationen over, og de to andre værn bærer alene. Sættes nøglen, virker
 * det tredje fra samme sekund uden en udrulning.
 *
 * SHIP DARK ER RIGTIGT HER OG FORKERT FOR SAGSOPRETTELSEN. Forskellen er den
 * samme som mod Trail: et manglende værn gør formularen svagere, en tabt
 * henvendelse taber et menneske.
 */
const MAKS_PR_TIME = 10;

export function turnstileAktiv(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

async function spamBlokeret(c: Context, krop: Record<string, unknown>): Promise<boolean> {
  if (isHoneypotTriggered(krop)) return true;
  const ip = c.req.header("CF-Connecting-IP") ?? c.req.header("x-forwarded-for") ?? "";
  if (ip && isRateLimited(hashIp(ip), "support", MAKS_PR_TIME)) return true;
  if (!turnstileAktiv()) return false;
  // Er værnet TÆNDT, er en manglende bevis-streng et afslag — ikke en
  // undtagelse. Ellers ville enhver kunne slippe forbi ved at lade feltet tomt.
  const bevis = String(krop.turnstileToken ?? "");
  if (!bevis) return true;
  return !(await validateTurnstile(bevis, process.env.TURNSTILE_SECRET_KEY!, ip || undefined));
}

/** POST /api/support */
export async function handleSupport(c: Context): Promise<Response> {
  const krop = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  // Et blokeret forsøg får SAMME svar som et tomt felt. En bot skal ikke
  // kunne læse af svaret om den blev opdaget.
  if (await spamBlokeret(c, krop)) {
    return c.json<SupportSvar>({ ok: false, vej: "ingen", fejl: "skriv_en_besked" }, 400);
  }
  const besked = String(krop.besked ?? "").trim();
  const navn = String(krop.navn ?? "").trim();
  const email = String(krop.email ?? "").trim();
  const emne = emneFor(String(krop.emne ?? ""), besked);

  if (besked.length < 5) {
    return c.json<SupportSvar>({ ok: false, vej: "ingen", fejl: "skriv_en_besked" }, 400);
  }

  try {
    const sag = await opretSag({
      emne,
      krop: kropFor(besked, navn, email),
      // STABIL pr. henvendelse, ENS ved genforsøg: indholdets fingeraftryk.
      // Ikke et tidsstempel — så ville nøglen være værdiløs ved netop det
      // genforsøg den findes for.
      intakeKey: await fingeraftryk(`${emne}\n${besked}\n${email}`),
      // intent udelades: vi ved det ikke, og et forkert intent er værre end
      // intet, fordi det ser målt ud.
      // bekraeftetEmail udelades: se modulets hoved.
    });
    return c.json<SupportSvar>({ ok: true, ref: sag.ref, vej: "helpdesk" });
  } catch (e) {
    // HER er forskellen fra Trail. Vi svarer ikke bare «beklager».
    const reddet = await tilReserve(navn, email, besked);
    const grund = e instanceof HelpDeskFejl ? `${e.status}: ${e.message}` : String(e);
    console.error("[support] HelpDesk afviste — reservevej:", reddet ? "ok" : "FEJLEDE", grund);
    return c.json<SupportSvar>(
      reddet
        ? { ok: true, vej: "reserve" }
        : { ok: false, vej: "ingen", fejl: "ingen_vej_naaede_frem" },
      reddet ? 200 : 502,
    );
  }
}

async function fingeraftryk(s: string): Promise<string> {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return `bai-${[...new Uint8Array(b)].slice(0, 8).map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}
