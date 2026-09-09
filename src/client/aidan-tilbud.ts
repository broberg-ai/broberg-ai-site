/* F018.12 — hvilke artikler tilbyder vi at læse højt, og hvad hedder de?
 *
 * Udskilt fra enhance.ts fordi det er DEN logik der gik galt, og fordi den
 * kan prøves uden en browser. Begge funktioner er rene: ind med hvad svaret
 * indeholdt, ud med hvad brugeren skal se.
 */

/** Ét tilbud pr. distinkt artikel i svaret — aldrig et tavst valg mellem dem.
 *
 * `links` er svarets links i den rækkefølge de står, hver med sin sti og sin
 * egen tekst. `artikler` er sti → titel fra sitets indeks. Reserven er linkets
 * egen tekst: en artikel uden titel i indekset skal stadig kunne navngives,
 * ellers er vi tilbage ved det ubestemte «artiklen». */
export function vaelgArtikler(
  links: { sti: string; tekst?: string }[],
  artikler: Map<string, string>,
  maks = 3,
): { sti: string; titel: string }[] {
  const ud: { sti: string; titel: string }[] = [];
  for (const l of links) {
    if (!artikler.has(l.sti) || ud.some((f) => f.sti === l.sti)) continue;
    ud.push({ sti: l.sti, titel: artikler.get(l.sti) || (l.tekst ?? "").trim() });
    if (ud.length >= maks) break;
  }
  return ud;
}

/** «Læs «Agentic orkestration» højt» — skabelonen kommer fra CMS og bærer
 *  {titel}. Uden en titel falder vi tilbage på det generiske spørgsmål, for et
 *  tilbud der siger «Læs «» højt» er værre end et der ikke navngiver. */
export function laesEtiket(skabelon: string | undefined, reserve: string | undefined, titel: string): string {
  const t = (titel ?? "").trim();
  if (!t) return reserve ?? "";
  const s = (skabelon ?? "").trim();
  if (!s || !s.includes("{titel}")) return `${reserve ?? ""}${reserve ? " — " : ""}${t}`.trim();
  return s.replace("{titel}", t);
}
