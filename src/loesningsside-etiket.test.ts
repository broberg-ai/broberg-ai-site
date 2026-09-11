/**
 * En etiket skal REDIGERES dér hvor den blev LÆST.
 *
 * F022 gav løsningssiderne mulighed for at overskrive de fælles overskrifter
 * («Kernefunktioner» passer ikke over seks principper). Værdien blev hentet fra
 * sidens eget dokument — men redigerings-bindingen blev stående på globals.
 *
 * Konsekvensen er den dyreste slags fejl: Christian markerer overskriften,
 * retter den, får «gemt», og INTET ændrer sig på siden — fordi dokumentets egen
 * værdi stadig vinder. Imens er alle FIRE andre løsningssider blevet ændret.
 * Hvert led melder succes.
 *
 * Prøven her måler den egenskab direkte: tekst og binding kommer fra samme
 * sted. Den kan ikke bestå ved at de tilfældigvis er ens.
 */
import { describe, it, expect } from "bun:test";
import { renderToString } from "preact-render-to-string";
import { SolutionPage, type SolutionData, type SolutionLabels } from "@/components/SolutionPage.tsx";
import type { CmsRef } from "@/content/types.ts";

const SIDE: CmsRef = { collection: "solutions", slug: "agentic-engineering", locale: "da" };
const GLOBALS: CmsRef = { collection: "globals", slug: "globals", locale: "da" };

const DATA: SolutionData = {
  name: "Test", headingHtml: "H", lead: "L",
  problemHeading: "P", problemP: ["a"],
  steps: [["T", "B"]], features: [["F", "B", "Sparkles"]],
  proofHeading: "Beviset her", proof: [{ kicker: "K", title: "T", body: "B" }],
  ctaHeadingHtml: "C", ctaLead: "CL",
};

const render = (labels: SolutionLabels) =>
  renderToString(
    SolutionPage({
      data: DATA, locale: "da",
      secondaryCta: { label: "Se", href: "#" },
      bookLabel: "Book", cmsRef: SIDE, globalsRef: GLOBALS, labels,
    }) as never,
  );

/** Hvilken collection+felt bærer denne tekst i markup? */
function bindingFor(html: string, tekst: string): { collection: string; felt: string } | null {
  // Tag'et der HOLDER teksten — enten som barn eller via dangerouslySetInnerHTML.
  const i = html.indexOf(tekst);
  if (i === -1) return null;
  const start = html.lastIndexOf("<", i);
  const tag = html.slice(start, html.indexOf(">", start) + 1);
  const c = tag.match(/data-cms-collection="([^"]+)"/);
  const f = tag.match(/data-cms-field="([^"]+)"/);
  return c && f ? { collection: c[1]!, felt: f[1]! } : null;
}

const globalLabels: SolutionLabels = {
  losningerPrefix: { tekst: "Løsninger", ref: GLOBALS, felt: "solLosningerPrefix" },
  howEyebrow: { tekst: "Sådan virker det", ref: GLOBALS, felt: "solHowEyebrow" },
  howHeading: { tekst: "Fra møde til live", ref: GLOBALS, felt: "solHowHeading" },
  featuresEyebrow: { tekst: "Kernefunktioner", ref: GLOBALS, felt: "solFeaturesEyebrow" },
  featuresHeading: { tekst: "Bygget ind i platformen.", ref: GLOBALS, felt: "solFeaturesHeading" },
  proofEyebrow: { tekst: "Beviset", ref: GLOBALS, felt: "solProofEyebrow" },
};

describe("etiketten redigeres dér hvor den blev læst", () => {
  it("en FÆLLES overskrift bindes til globals", () => {
    const b = bindingFor(render(globalLabels), "Bygget ind i platformen.");
    expect(b).toEqual({ collection: "globals", felt: "solFeaturesHeading" });
  });

  it("en OVERSKREVET overskrift bindes til SIDENS eget dokument", () => {
    // Dette er fejlen der blev fundet i produktionen 11/9: teksten kom herfra,
    // bindingen pegede på globals.
    const html = render({
      ...globalLabels,
      featuresHeading: { tekst: "Seks ting der gør forskellen.", ref: SIDE, felt: "featuresHeading" },
    });
    expect(bindingFor(html, "Seks ting der gør forskellen.")).toEqual({
      collection: "solutions",
      felt: "featuresHeading",
    });
    // og globals-feltet må så IKKE optræde på siden — ellers er der to steder
    // at rette den samme synlige tekst.
    expect(html).not.toContain('data-cms-field="solFeaturesHeading"');
  });

  it("gælder alle tre overskrifter og begge de overskrivbare øjenbryn", () => {
    const egne: SolutionLabels = {
      losningerPrefix: { tekst: "Vores ting", ref: SIDE, felt: "losningerPrefix" },
      howEyebrow: { tekst: "Løkken", ref: SIDE, felt: "howEyebrow" },
      howHeading: { tekst: "Fra idé til live.", ref: SIDE, felt: "howHeading" },
      featuresEyebrow: { tekst: "Principperne", ref: SIDE, felt: "featuresEyebrow" },
      featuresHeading: { tekst: "Seks ting.", ref: SIDE, felt: "featuresHeading" },
      proofEyebrow: { tekst: "Vores bevis", ref: SIDE, felt: "proofEyebrow" },
    };
    const html = render(egne);
    for (const [tekst, felt] of [
      ["Vores ting", "losningerPrefix"],
      ["Løkken", "howEyebrow"],
      ["Fra idé til live.", "howHeading"],
      ["Principperne", "featuresEyebrow"],
      ["Seks ting.", "featuresHeading"],
      ["Vores bevis", "proofEyebrow"],
    ] as const) {
      expect(bindingFor(html, tekst)).toEqual({ collection: "solutions", felt });
    }
  });

  it("OVERSKRIFTERNE ER RIGE — ellers findes værktøjslinjen ikke på dem", () => {
    // Christian 11/9, med skærmbillede: han markerede «Seks ting der gør
    // forskellen» og der kom ingen værktøjslinje. Farvevælgeren bor i den
    // værktøjslinje, så et fladt felt kan ikke farves overhovedet.
    const html = render(globalLabels);
    for (const felt of ["solHowHeading", "solFeaturesHeading", "proofHeading"]) {
      const tag = html.slice(
        html.lastIndexOf("<", html.indexOf(`data-cms-field="${felt}"`)),
      );
      expect(tag.slice(0, tag.indexOf(">") + 1)).toContain("data-cms-html");
    }
  });

  it("KONTROL: øjenbrynene er stadig FLADE", () => {
    // Et øjenbryn er tre ord i versaler. Rig redigering dér ville invitere til
    // markup i noget der aldrig skal bære markup.
    const html = render(globalLabels);
    const tag = html.slice(html.lastIndexOf("<", html.indexOf('data-cms-field="solFeaturesEyebrow"')));
    expect(tag.slice(0, tag.indexOf(">") + 1)).not.toContain("data-cms-html");
  });
});
