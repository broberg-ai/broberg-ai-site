/* F007.17 — de fire nej'er er lige så meget feature som ja'et.
 *
 * Faldgruben planen navngiver: en prøve på «kortet vises efter 10 sekunder»
 * består ALTID hvis kortet vises altid. Hver betingelse har derfor sin egen
 * prøve, og der er en kontrol på at ja'et stadig er et ja.
 */
import { describe, it, expect } from "bun:test";
import { skalVises, VENTETID_MS, type HilsenTilstand } from "./aidan-hilsen.ts";

/** En bruger der HAR fortjent hilsenen. Hver prøve bryder én ting. */
const klar: HilsenTilstand = {
  synligMs: VENTETID_MS,
  panelHarVaeretAabent: false,
  harTidligereSamtaler: false,
  afvistFoer: false,
  vistIDetteBesoeg: false,
};

describe("hilsenen vises når betingelserne er opfyldt", () => {
  it("KONTROL: ja er stadig et ja", () => {
    // Uden denne ville en skalVises der ALTID svarer nej bestå alle prøver
    // nedenfor — og den fejl ville se ud som «hilsenen virker bare ikke».
    expect(skalVises(klar)).toBe(true);
  });

  it("præcis 10 sekunder er nok — ikke 10 sekunder og lidt til", () => {
    expect(skalVises({ ...klar, synligMs: VENTETID_MS })).toBe(true);
  });
});

describe("de fire nej'er", () => {
  it("ikke før tiden er gået", () => {
    expect(skalVises({ ...klar, synligMs: VENTETID_MS - 1 })).toBe(false);
    expect(skalVises({ ...klar, synligMs: 0 })).toBe(false);
  });

  it("ikke hvis brugeren SELV har åbnet chatten", () => {
    // Kortets bærende betingelse, ordret fra meldingen: «IKKE selv har
    // aktiveret Aidan». Et kort der siger «hej, hvordan kan jeg hjælpe» til en
    // der allerede sidder i chatten er ikke en hilsen, det er støj.
    expect(skalVises({ ...klar, panelHarVaeretAabent: true })).toBe(false);
  });

  it("ikke hvis brugeren har skrevet til Aidan før", () => {
    expect(skalVises({ ...klar, harTidligereSamtaler: true })).toBe(false);
  });

  it("ÉN AFVISNING HOLDER", () => {
    // Den vigtigste og den nemmeste at glemme. Uden den er kortet en nag på
    // hver eneste side.
    expect(skalVises({ ...klar, afvistFoer: true })).toBe(false);
  });

  it("ikke to gange i samme besøg", () => {
    expect(skalVises({ ...klar, vistIDetteBesoeg: true })).toBe(false);
  });
});

describe("et nej vinder over rigelig tid", () => {
  it("en time på siden gør ikke en afvisning ugyldig", () => {
    // Rækkefølgen i skalVises er bevidst: nej'ene før tiden. Læste den tiden
    // først og returnerede true, ville en lang seance omgå alle fire.
    const laenge = { ...klar, synligMs: 3_600_000 };
    expect(skalVises({ ...laenge, afvistFoer: true })).toBe(false);
    expect(skalVises({ ...laenge, panelHarVaeretAabent: true })).toBe(false);
    expect(skalVises({ ...laenge, harTidligereSamtaler: true })).toBe(false);
    expect(skalVises({ ...laenge, vistIDetteBesoeg: true })).toBe(false);
  });
});
