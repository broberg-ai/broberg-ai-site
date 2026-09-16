/**
 * F024.4 — «Blev det løst?»
 *
 * ── HVORFOR KNAPPEN IKKE MÅ LIGGE I MAILEN ───────────────────────────────
 * Outlook og andre scannere FORKLIKKER links for at tjekke dem. Lå «ja, det
 * blev løst» i mailen, ville HelpDesk registrere løsninger ingen bruger har
 * bekræftet — og tallet ville ligne succes mens det var forkert. Mailen bærer
 * kun et link hertil; trykket sker på vores domæne, af et menneske.
 *
 * ── AT SE SIDEN MÅ IKKE FORBRUGE TOKENET ─────────────────────────────────
 * Derfor to ruter hos dem, og vi holder dem skarpt adskilt: opslaget er et
 * GET, indløsningen et POST. Blandede vi dem, ville selve rendringen bruge
 * bekræftelsen op, og brugeren ville møde «linket er allerede brugt» på sit
 * FØRSTE klik. Scanner-problemet ville altså være tilbage ad bagdøren.
 *
 * ── RUTERNE ER ÅBNE, OG DET ER MED VILJE ─────────────────────────────────
 * Ingen nøgle. Tokenet ER adgangen — modtageren af mailen har den, ingen
 * andre. Vi går alligevel gennem vores egen server frem for at lade browseren
 * kalde dem direkte: så ejer vi fejlteksterne, og siden virker uden JS.
 */

const BASE = "https://api.helpdesk.broberg.ai";

/** Hvorfor et token ikke kan bruges. Hver er sin egen TILSTAND med sin egen
 *  tekst — «der skete en fejl» er ikke et svar et menneske kan handle på. */
export type Afvist = "unknown" | "used" | "expired" | "ukendt-grund";

export interface Bekraeftelse {
  brugbar: boolean;
  /** Sagens reference, når de oplyser den. «Blev det løst?» uden at nævne
   *  HVAD «det» er, er ubesvarligt. */
  ref?: string;
  emne?: string;
  grund?: Afvist;
}

/** De grunde vi kender. En ukendt grund må IKKE blive til «unknown» — så ville
 *  en bruger få at vide at hendes link ikke findes, fordi vi ikke forstod
 *  svaret. Den bliver til sin egen tilstand. */
const KENDTE: readonly string[] = ["unknown", "used", "expired"];

function somGrund(r: unknown): Afvist {
  const s = String(r ?? "");
  return (KENDTE.includes(s) ? s : "ukendt-grund") as Afvist;
}

/**
 * Slår tokenet op UDEN at bruge det.
 *
 * Kaster aldrig: en bekræftelsesside der fejler med en stakspor er værre end
 * en der siger «vi kunne ikke finde linket». Netværksfejl behandles som en
 * ukendt grund frem for som «findes ikke» — de to er ikke det samme, og kun
 * den ene er brugerens problem.
 */
export async function slaaOp(token: string): Promise<Bekraeftelse> {
  if (!token.trim()) return { brugbar: false, grund: "unknown" };
  try {
    const r = await fetch(`${BASE}/v1/resolutions/${encodeURIComponent(token)}`, {
      headers: { accept: "application/json" },
    });
    const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    if (!r.ok || j.redeemable === false) {
      return { brugbar: false, grund: somGrund(j.reason), ref: str(j.ref), emne: str(j.subject) };
    }
    return { brugbar: true, ref: str(j.ref), emne: str(j.subject) };
  } catch {
    return { brugbar: false, grund: "ukendt-grund" };
  }
}

/** Indløser. `svar` er brugerens, ikke vores — begge udfald er lige gyldige. */
export async function indloes(
  token: string,
  svar: "solved" | "not_solved",
): Promise<{ ok: boolean; grund?: Afvist }> {
  try {
    const r = await fetch(`${BASE}/v1/resolutions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, outcome: svar }),
    });
    if (r.ok) return { ok: true };
    const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: false, grund: somGrund(j.reason) };
  } catch {
    return { ok: false, grund: "ukendt-grund" };
  }
}

function str(v: unknown): string | undefined {
  const s = typeof v === "string" ? v.trim() : "";
  return s || undefined;
}
