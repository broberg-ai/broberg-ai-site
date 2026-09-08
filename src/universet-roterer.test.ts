/**
 * Universet holdt op med at rotere for ejeren 8/9-2026.
 *
 * Siden var rask: målt i en rigtig browser (Lens) roterer den både i Chromium
 * og WebKit når browseren IKKE beder om reduceret bevægelse — vinkel 7,79° →
 * 14,02° på 1,8 sekund. Det var vores egen reducedMotion() der satte den i stå,
 * fordi ejerens maskine rapporterer «Reducér bevægelse», og INTET på siden
 * røbede det.
 *
 * Prøven her holder to ting fast: at diagrammet er markeret som bevægelse der
 * skal blive, og at pausefunktionen respekterer markeringen. Begge dele ville
 * være GRØNNE på et diagram uden bevægelse overhovedet, så den tredje sikrer at
 * SMIL'en stadig er der.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";

const DIAGRAM = readFileSync("src/components/widgets/UniverseDiagram.tsx", "utf8");
const ENHANCE = readFileSync("src/client/enhance.ts", "utf8");

describe("universets kredsløb overlever «Reducér bevægelse»", () => {
  it("diagrammets svg er markeret som bevægelse der SKAL blive", () => {
    expect(DIAGRAM).toContain('data-motion="essential"');
    expect(DIAGRAM).toContain('data-testid="universe-diagram"');
  });

  it("pausefunktionen springer den markering over — ellers er markeringen pynt", () => {
    const i = ENHANCE.indexOf("function reducedMotion");
    expect(i).toBeGreaterThan(-1);
    const krop = ENHANCE.slice(i, ENHANCE.indexOf("\n}", i));
    const spring = krop.indexOf('data-motion") === "essential"');
    const pause = krop.indexOf("pauseAnimations()");
    expect(spring, "undtagelsen mangler i reducedMotion()").toBeGreaterThan(-1);
    // Rækkefølgen ER rettelsen: står undtagelsen efter pausen, er den uden virkning.
    expect(spring).toBeLessThan(pause);
  });

  it("der ER stadig et kredsløb at bevare", () => {
    // Uden denne ville de to ovenfor bestå på et diagram der slet ikke roterer.
    expect(DIAGRAM).toContain("<animateTransform");
    expect(DIAGRAM).toContain('repeatCount="indefinite"');
  });

  it("det HURTIGE adlyder stadig indstillingen", () => {
    const i = ENHANCE.indexOf("function reducedMotion");
    const krop = ENHANCE.slice(i, ENHANCE.indexOf("\n}", i));
    expect(krop).toContain("video[autoplay]");
  });
});
