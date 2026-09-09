import { describe, test as it, expect } from "bun:test";
import { harSoeskendePaaPrimaersprog } from "@/trail-push.ts";

/**
 * F018.6 — oversættelser sendes ikke til Trail (PAUSE, Christian 9/9-2026).
 *
 * Hans begrundelse er vidensbasens egen: «desto mere tekst der er i hjernen,
 * desto mere diluted bliver sandheden». Målt af Trail: 139 råkilder, 70 med en
 * engelsk tvilling — halvdelen af korpusset er den samme sandhed sagt to gange,
 * og et opslag på «helpdesk» brugte to af seks pladser på det ene svar.
 *
 * FORMEN ER TRAILS OG ER BEDRE END DEN FLADE REGEL. «Spring alt engelsk over»
 * ville en dag slette en engelsk-KUN side til et andet marked ud af
 * vidensbasen, og INGEN ville opdage det — siden ville bare aldrig kunne findes.
 * Derfor: spring over hvis der findes en søskende på primærsproget.
 *
 * Den skelnen er hele prøvens formål. Uden den sidste prøve herunder ville en
 * flad sprogregel bestå.
 */
describe("oversættelser med dansk søskende springes over", () => {
  it("engelsk dokument MED translationGroup springes over", () => {
    expect(harSoeskendePaaPrimaersprog({ translationGroup: "abc-123" }, "en")).toBe(true);
  });

  it("gruppen findes også når den ligger i data", () => {
    expect(harSoeskendePaaPrimaersprog({ data: { translationGroup: "abc-123" } }, "en")).toBe(true);
  });

  it("DEN BÆRENDE: en engelsk-KUN side sendes stadig", () => {
    // Uden translationGroup er dokumentet enestående — der findes ingen dansk
    // udgave af det. En flad «spring engelsk over»-regel ville tabe den, og
    // tabet ville være usynligt: siden ville bare aldrig kunne findes.
    expect(harSoeskendePaaPrimaersprog({ title: "Only in English" }, "en")).toBe(false);
    expect(harSoeskendePaaPrimaersprog({ translationGroup: "" }, "en")).toBe(false);
    expect(harSoeskendePaaPrimaersprog({ translationGroup: "   " }, "en")).toBe(false);
  });

  it("POSITIV KONTROL: dansk sendes ALTID, også med en gruppe", () => {
    // Uden denne ville «returnér altid true» bestå de to første prøver og
    // standse hele synkroniseringen.
    expect(harSoeskendePaaPrimaersprog({ translationGroup: "abc-123" }, "da")).toBe(false);
  });

  it("tåler tomt og skrald uden at kaste", () => {
    for (const x of [null, {}, { translationGroup: 42 }, { data: null }]) {
      expect(harSoeskendePaaPrimaersprog(x as Record<string, unknown> | null, "en")).toBe(false);
    }
  });

  it("pausen er kaldt fra planlægningen, ikke blot defineret", () => {
    const kode = require("node:fs").readFileSync(
      require("node:path").join(import.meta.dir, "trail-push.ts"), "utf8",
    ).split("\n").filter((l: string) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
    expect(kode, "funktionen er erklæret men ikke brugt")
      .toContain("if (harSoeskendePaaPrimaersprog(doc, locale))");
  });
});
