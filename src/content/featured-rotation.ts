// F008.3 — hvilken featured-historie får den STORE plads på forsiden.
//
// Ejerens valg 5/9-2026 (mockup C, note): «skifter ved reload» — rullende, ikke
// tilfældigt, så ALLE featured-historier kommer i den store plads over tid.
// Ikke en timer: båndet under menuen roterer allerede, og en stor blok der
// skifter mens man læser den ville både forstyrre og kunne rive inline-edit-
// ankrene væk under en igangværende rettelse.
//
// Tælleren lever i hukommelsen og nulstilles ved deploy. Det er med vilje: den
// skal kun sikre at NÆSTE sidevisning viser den næste historie — ikke huske en
// position på tværs af udgivelser. Én tæller pr. nøgle (locale), så de to sprog
// ruller uafhængigt af hinanden.
const taellere = new Map<string, number>();

/** Roterer listen ét hak pr. kald: [A,B,C] → [A,B,C], [B,C,A], [C,A,B], … */
export function roterFeatured<T>(items: T[], noegle: string): T[] {
  if (items.length < 2) return items;
  const n = taellere.get(noegle) ?? 0;
  taellere.set(noegle, (n + 1) % items.length);
  return [...items.slice(n % items.length), ...items.slice(0, n % items.length)];
}

/** Kun til prøver — nulstiller tællerne så en test ikke arver en anden tests stand. */
export function nulstilRotation(): void {
  taellere.clear();
}
