/**
 * Gate D må gerne blive mildere — men KUN på de to ting der beviseligt var
 * blinde vinkler, og ikke på det den findes for.
 *
 * Porten stod rød 8/9 på fire felter der alle fandtes i CMS'et:
 *   · femten `podcastTrin{n}*` meldt som ÉT opdigtet navn `podcastTrin${n}…`
 *   · `aidanHilsenSide` hvis reservetekst i koden er den TOMME streng
 *
 * Hver lempelse har sin negative kontrol lige nedenunder. Uden dem ville en
 * port der altid siger grønt bestå prøven.
 */
import { describe, it, expect } from "bun:test";
// @ts-expect-error — ren .mjs uden typer, med vilje: porten skal kunne køres af node alene
import { scanKilde, manglendeFelter, tomReserve } from "../scripts/gate-cms-text.lib.mjs";

const kort = (navne: string[]) => new Map(navne.map((n) => [n, "src/prøve.tsx"]));

describe("Gate D fanger stadig det den findes for", () => {
  it("et felt med rigtig reservetekst der IKKE er i CMS meldes", () => {
    expect(manglendeFelter(kort(["findesIkke"]), { andet: "x" }).map((r: any) => r[0])).toEqual([
      "findesIkke",
    ]);
  });

  it("et felt der står TOMT i CMS meldes — en tom værdi er ikke en tekst", () => {
    expect(manglendeFelter(kort(["tomt"]), { tomt: "   " }).map((r: any) => r[0])).toEqual(["tomt"]);
  });

  it("et felt med værdi i CMS meldes ikke", () => {
    expect(manglendeFelter(kort(["fint"]), { fint: "en tekst" })).toEqual([]);
  });
});

describe("blind vinkel 1 — et skabelon-navn kan ikke slås op", () => {
  it("familien findes i CMS → ikke et fund", () => {
    const data = { podcastTrin1Titel: "Artiklen vælges", podcastTrin2Titel: "Manuskriptet skrives" };
    expect(manglendeFelter(kort(["podcastTrin${n}Titel"]), data)).toEqual([]);
  });

  it("NEGATIV KONTROL: familien findes IKKE → stadig et fund", () => {
    // Uden denne ville «spring alle skabeloner over» bestå prøven ovenfor.
    expect(
      manglendeFelter(kort(["podcastTrin${n}Titel"]), { heltAndet: "x" }).map((r: any) => r[0]),
    ).toEqual(["podcastTrin${n}Titel"]);
  });

  it("NEGATIV KONTROL: familien findes, men TOM → stadig et fund", () => {
    expect(manglendeFelter(kort(["podcastTrin${n}Titel"]), { podcastTrin1Titel: "" }).length).toBe(1);
  });

  it("et skabelon-navn matcher ikke en tilfældig anden nøgle", () => {
    // «podcastTrin.+Titel» må ikke reddes af podcastTrinTitel (uden tal).
    expect(manglendeFelter(kort(["podcastTrin${n}Titel"]), { podcastTrinTitel: "x" }).length).toBe(1);
  });
});

describe("blind vinkel 2 — en TOM reservetekst er ikke et hjem for tekst", () => {
  it("g(felt, \"\") scannes ikke ind", () => {
    expect(scanKilde('const a = g("aidanHilsenSide", "");')).toEqual([]);
    expect(scanKilde("const a = g('x', '');")).toEqual([]);
  });

  it("NEGATIV KONTROL: g(felt, \"noget\") scannes ind", () => {
    expect(scanKilde('const a = g("harTekst", "en reservetekst");')).toEqual(["harTekst"]);
  });

  it("NEGATIV KONTROL: et mellemrum er ikke tomt — det er tekst i koden", () => {
    expect(tomReserve('" "')).toBe(false);
    expect(scanKilde('const a = g("etMellemrum", " ");')).toEqual(["etMellemrum"]);
  });

  it("et sammensat udtryk som reservetekst scannes ind", () => {
    expect(scanKilde('const a = g("toSprog", isEn ? "Five steps" : "Fem trin");')).toEqual([
      "toSprog",
    ]);
  });
});
