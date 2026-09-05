/* Aidans samtale-lager (F007.4) — ren logik, så den kan forsegles med tests.
 *
 * localStorage, ikke server: en besøgs-chat har intet login at hænge samtaler
 * på, og historikken er en bekvemmelighed for DENNE browser — ikke data vi
 * skal eje. Loft på 20 samtaler; den ældste ryger først. Alle læsninger og
 * skrivninger er try/catch'et: privat tilstand/fuldt lager må aldrig vælte
 * chatten, så falder vi bare tilbage til «ingen historik».
 */

export type Tur = { role: "user" | "assistant"; content: string; t?: number };
export interface Samtale {
  id: string;
  titel: string;
  opdateret: number;
  beskeder: Tur[];
}

const NOEGLE = "aidan-samtaler-v1";
const AKTIV = "aidan-aktiv-v1";
const LOFT = 20;

function laes(): Samtale[] {
  try {
    const raa = JSON.parse(localStorage.getItem(NOEGLE) || "[]");
    return Array.isArray(raa) ? raa.filter((s) => s && s.id && Array.isArray(s.beskeder)) : [];
  } catch {
    return [];
  }
}
function skriv(liste: Samtale[]): void {
  try {
    localStorage.setItem(NOEGLE, JSON.stringify(liste.slice(0, LOFT)));
  } catch {}
}

/** Titlen er den første brugerbesked, klippet — som Eirs auto-titel, bare uden
 *  et modelkald: den første besked ER hvad samtalen handler om. */
export function titelFra(beskeder: Tur[]): string {
  const foerste = beskeder.find((b) => b.role === "user")?.content?.trim() ?? "";
  return foerste.length > 60 ? foerste.slice(0, 57) + "…" : foerste;
}

export function listSamtaler(): Samtale[] {
  return laes().sort((a, b) => b.opdateret - a.opdateret);
}

export function hentSamtale(id: string): Samtale | null {
  return laes().find((s) => s.id === id) ?? null;
}

/** Gem (opret/opdatér) den aktive samtale ud fra dens beskeder. Tom samtale
 *  gemmes aldrig — en åbnet-og-lukket chat er ikke en samtale. */
export function gemAktiv(beskeder: Tur[]): string | null {
  if (!beskeder.some((b) => b.role === "user")) return null;
  let id = aktivId();
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    saetAktiv(id);
  }
  const liste = laes().filter((s) => s.id !== id);
  liste.unshift({ id, titel: titelFra(beskeder), opdateret: Date.now(), beskeder: beskeder.slice(-40) });
  skriv(liste);
  return id;
}

export function sletSamtale(id: string): void {
  skriv(laes().filter((s) => s.id !== id));
  if (aktivId() === id) saetAktiv(null);
}

export function aktivId(): string | null {
  try {
    return localStorage.getItem(AKTIV);
  } catch {
    return null;
  }
}
export function saetAktiv(id: string | null): void {
  try {
    if (id) localStorage.setItem(AKTIV, id);
    else localStorage.removeItem(AKTIV);
  } catch {}
}

/** F007.5: står brugeren (nær) bunden af scroll-området? Chatten må KUN
 *  auto-scrolle når svaret er ja — ellers kæmper den mod brugerens egen
 *  opadgående scroll under streaming (Christians «blinker»-rapport 4/9).
 *  Marginen tilgiver sub-pixel-afrunding og et par linjers afdrift. */
export function erNaerBunden(scrollTop: number, clientHeight: number, scrollHeight: number, margin = 48): boolean {
  return scrollTop + clientHeight >= scrollHeight - margin;
}

/** «for 2 timer siden» — spejler sitets egen relative-tid-form. */
export function relativTid(epokeMs: number, en: boolean): string {
  const s = Math.max(0, (Date.now() - epokeMs) / 1000);
  if (s < 60) return en ? "just now" : "lige nu";
  const m = Math.floor(s / 60);
  if (m < 60) return en ? `${m} min ago` : `for ${m} min siden`;
  const t = Math.floor(m / 60);
  if (t < 24) return en ? `${t}h ago` : `for ${t} time${t === 1 ? "" : "r"} siden`;
  const d = Math.floor(t / 24);
  if (d === 1) return en ? "yesterday" : "i går";
  if (d < 7) return en ? `${d}d ago` : `for ${d} dage siden`;
  return new Date(epokeMs).toLocaleDateString(en ? "en-GB" : "da-DK", { day: "numeric", month: "short" });
}
