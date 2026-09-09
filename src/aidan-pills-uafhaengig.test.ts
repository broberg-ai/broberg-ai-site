import { describe, test as it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { skalVises } from "@/client/aidan-hilsen.ts";

/**
 * F007.20 — de adaptive forslag må ALDRIG hænge på hilsen-kortets gate igen.
 *
 * Christian meldte det to gange: «Aidan er slet ikke adaptiv» og derefter
 * «Aidan er SLET ikke adaptiv - hvorfor ikke». Anden gang var berettiget,
 * fordi min rettelse efter første melding ikke rørte årsagen.
 *
 * ÅRSAGEN: visPills() blev kun kaldt inde i `if (skalVises(...))`. Den gate er
 * et engangs-vink til en FØRSTEGANGSBESØGENDE og siger nej på fire måder — har
 * chattet før, har lukket kortet, har allerede set det i besøget, har været på
 * siden under 10 sekunder. En der har brugt Aidan én gang, kan derfor ikke
 * fremkalde forslagene med nogen rækkefølge af klik.
 *
 * MÅLT PÅ PRODUKTION (iPhone/WebKit, en tidligere samtale i localStorage):
 * efter 16 sekunder på /universet stod pills-hidden=true, antal=0.
 *
 * Og hvorfor det ikke blev fanget: en frisk Lens-browser har tom hukommelse og
 * bestod gaten. Målingen svarede rigtigt på «kan de renderes» og aldrig på
 * «vil en tilbagevendende besøgende se dem».
 *
 * Prøverne her holder begge halvdele fast: at gaten stadig afviser en
 * tilbagevendende bruger (den skal blive ved med det — for KORTET), og at
 * forslagene ikke længere spørger den om lov.
 */
const enhance = readFileSync(join(import.meta.dir, "client/enhance.ts"), "utf8");

/** Kildens KROP: kommentarlinjer væk, så en forklaring ikke tælles som kode.
 *  Samme fælde som repoets øvrige kilde-vagter er faldet i. */
const kode = enhance
  .split("\n")
  .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
  .join("\n");

describe("hilsen-gaten afviser stadig en tilbagevendende bruger", () => {
  const grund = {
    synligMs: 60_000,
    panelHarVaeretAabent: false,
    harTidligereSamtaler: false,
    afvistFoer: false,
    vistIDetteBesoeg: false,
  };

  it("en der har chattet før får ikke kortet — det er Christians egen tilstand", () => {
    expect(skalVises({ ...grund, harTidligereSamtaler: true })).toBe(false);
  });

  it("POSITIV KONTROL: en frisk besøgende efter 10 sekunder får det", () => {
    // Uden denne ville «gaten siger altid nej» bestå prøven ovenfor.
    expect(skalVises(grund)).toBe(true);
  });
});

describe("forslagene spørger ikke hilsen-gaten om lov", () => {
  it("visPills kaldes fra sin EGEN udløser, ikke kun inde i gaten", () => {
    // maaskeVisPills er den uafhængige vej ind. Findes den ikke, er forslagene
    // igen afhængige af kortet.
    expect(kode, "maaskeVisPills findes ikke — forslagene har ingen egen udløser")
      .toContain("maaskeVisPills");
    expect(kode).toMatch(/setTimeout\(maaskeVisPills/);
  });

  it("den egne udløser gates på CHAT-KNAPPEN, ikke på hilsen-kortet", () => {
    const i = kode.indexOf("const maaskeVisPills");
    expect(i, "maaskeVisPills findes ikke").toBeGreaterThan(-1);
    const krop = kode.slice(i, i + 400);
    expect(krop, "forslagene skal følge knappen — ellers svæver de over ingenting")
      .toContain('fab.classList.contains("vis")');
    expect(krop, "hilsen-gaten må ikke afgøre om forslagene vises")
      .not.toContain("hilsenSkalVises");
  });

  it("en åben chat skjuler forslagene — de er en vej IND, ikke pynt ved siden af", () => {
    const i = kode.indexOf("const aabn = () =>");
    expect(i).toBeGreaterThan(-1);
    expect(kode.slice(i, i + 500)).toContain("skjulPills()");
  });
});
