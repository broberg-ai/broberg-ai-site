/**
 * F024.10 — SSE-prøveserveren. Beviser TRANSPORTEN, ikke produktet.
 *
 * Christian: «en meget simpel SSE test server uden UI men bare et sted hvor jeg
 * kan skrive fra og se at det havner op i Aidan chatten.»
 *
 * ── KANALEN ER SAGENS REFERENCE ──────────────────────────────────────────
 * Ikke det interne samtale-id. Chatten viser allerede hende «BR-XXXXX», så det
 * er den streng han skriver — intet at slå op. Og det er også sådan det RIGTIGE
 * flow bliver: et menneske arbejder på en SAG, ikke på en browser-session.
 *
 * ── MØRKT BETYDER LUKKET ─────────────────────────────────────────────────
 * Uden LIVE_TEST_TOKEN tager skrive-enden intet imod. En åben skrivedør lader
 * enhver der kender en sags-ref skrive ind i et fremmed menneskes chat.
 *
 * ── HVAD DEN IKKE ER ─────────────────────────────────────────────────────
 * Bussen lever i HUKOMMELSEN og dør med processen. Ingen historik, ingen
 * genoptagelse, ingen persistens. En udrulning midt i en samtale afbryder den.
 * Det er acceptabelt for en prøve og ville ikke være det for et produkt.
 */

export interface LiveBesked {
  fra: string;
  tekst: string;
  tid: number;
}

type Lytter = (b: LiveBesked) => void;

/** Nøgle: sagens reference. Værdi: de browsere der lytter på netop den. */
const kanaler = new Map<string, Set<Lytter>>();

export const liveTaeller = { lyttere: 0, sendt: 0, afvistToken: 0 };

export function liveKonfigureret(): boolean {
  return Boolean(process.env.LIVE_TEST_TOKEN);
}

/** Tilmelder en lytter. Returnerer afmeldingen — kaldes når fanen lukkes, så
 *  lyttere ikke hober sig op i hukommelsen. */
export function lyt(ref: string, f: Lytter): () => void {
  let s = kanaler.get(ref);
  if (!s) { s = new Set(); kanaler.set(ref, s); }
  s.add(f);
  liveTaeller.lyttere++;
  return () => {
    s!.delete(f);
    liveTaeller.lyttere--;
    // Tom kanal fjernes helt. Ellers vokser kortet med én tom mængde pr. sag
    // der nogensinde har haft en lytter.
    if (s!.size === 0) kanaler.delete(ref);
  };
}

/** Sender til ÉN kanal. Returnerer hvor mange der fik den. */
export function udsend(ref: string, b: LiveBesked): number {
  const s = kanaler.get(ref);
  if (!s) return 0;
  for (const f of s) f(b);
  liveTaeller.sendt++;
  return s.size;
}

export function antalLyttere(ref: string): number {
  return kanaler.get(ref)?.size ?? 0;
}

/** Kun til prøver — nulstiller hele bussen. */
export function _ryd(): void {
  kanaler.clear();
  liveTaeller.lyttere = 0;
  liveTaeller.sendt = 0;
  liveTaeller.afvistToken = 0;
}
