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
    // Måler at kaldet SKER, ikke hvilke argumenter det har. Første udgave
    // pinnede "(doc, locale)" ordret og gik rød da funktionen fik en tredje
    // parameter — altså på en ændring der GJORDE spærren bedre.
    expect(kode, "funktionen er erklæret men ikke brugt")
      .toMatch(/if\s*\(harSoeskendePaaPrimaersprog\(/);
  });
});

describe("hullet der blev målt 10/9", () => {
// ── Hullet der blev målt 10/9 ────────────────────────────────────────────────
//
// Første udgave spurgte kun om dokumentet HAR en translationGroup. Målt på alle
// 64 engelske dokumenter:
//     posts      27 af 27 har den   → virkede
//     platforms   0 af 14 har den   → spærrede INGEN
//
// At Trail målte NUL engelske siden filteret gik live betød ikke at det dækkede
// dem. Det betød at ingen af de 14 var blevet gemt siden.

it("platforms-mønstret: en- uden translationGroup spærres nu", () => {
  // Præcis de 14 der slap igennem. Ingen af dem har en gruppe.
  for (const slug of ["en-helpdesk", "en-cardmem", "en-trail", "en-ai-sdk", "en-lens"]) {
    expect(harSoeskendePaaPrimaersprog({ slug }, "en")).toBe(true);
  }
});

it("NEGATIV KONTROL: en engelsk-KUN side overlever stadig", () => {
  // Hele grunden til at reglen ikke er «spring alt engelsk over». Uden denne
  // ville en spærre der sagde ja til ALT bestå prøven ovenfor.
  expect(harSoeskendePaaPrimaersprog({ slug: "market-report-uk" }, "en")).toBe(false);
  expect(harSoeskendePaaPrimaersprog({ slug: "sanne-case-hero-en" }, "en")).toBe(false);
  expect(harSoeskendePaaPrimaersprog({}, "en")).toBe(false);
});

it("«en-» alene er ikke nok — der skal stå noget efter", () => {
  expect(harSoeskendePaaPrimaersprog({ slug: "en-" }, "en")).toBe(false);
});

it("dansk sendes altid, uanset hvad slug'en hedder", () => {
  expect(harSoeskendePaaPrimaersprog({ slug: "en-helpdesk" }, "da")).toBe(false);
  expect(harSoeskendePaaPrimaersprog({ translationGroup: "tg-x" }, "da")).toBe(false);
});

it("slug kan komme som argument — ruten har den, dokumentet ikke altid", () => {
  expect(harSoeskendePaaPrimaersprog({}, "en", "en-cms")).toBe(true);
  expect(harSoeskendePaaPrimaersprog({}, "en", "cms")).toBe(false);
});
});
