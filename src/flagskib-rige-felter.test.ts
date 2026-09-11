/**
 * F197.2 — flagskibenes brødtekst og overskrifter er RIGE felter.
 *
 * Christian, med to skærmbilleder: han markerede tekst i redigerings-tilstand
 * og fik ingen værktøjslinje. Målt bagefter i en rigtig browser med en ægte
 * redigerings-session: mekanismen fejler ikke — værktøjslinjen kommer på
 * x=484,y=14,473×44 px på et rigt felt. Begge felter han prøvede var FLADE.
 *
 * Værktøjslinjen — og dermed farvevælgeren — findes kun på data-cms-html="true".
 * Så «kan jeg farve denne tekst» er præcis det samme spørgsmål som «er feltet
 * rigt», og det er dét prøven her måler.
 *
 * Den anden halvdel er lige så vigtig: korte værdier skal IKKE være rige.
 * Markup i et øjenbryn, et tal eller en tabelcelle er en fejl, ikke en mulighed.
 */
import { describe, it, expect } from "bun:test";
import { renderToString } from "preact-render-to-string";
import { FlagshipSlides } from "@/components/FlagshipSlides.tsx";
import type { CmsRef } from "@/content/types.ts";

const REF: CmsRef = { collection: "platforms", slug: "helpdesk", locale: "da" };

/** Er det felt der bærer denne tekst et RIGT felt? */
function erRig(html: string, tekst: string): boolean | null {
  const i = html.indexOf(tekst);
  if (i === -1) return null;
  const start = html.lastIndexOf("<", i);
  const tag = html.slice(start, html.indexOf(">", start) + 1);
  return tag.includes('data-cms-html="true"');
}

function feltFor(html: string, tekst: string): string | null {
  const i = html.indexOf(tekst);
  if (i === -1) return null;
  const start = html.lastIndexOf("<", i);
  const tag = html.slice(start, html.indexOf(">", start) + 1);
  return tag.match(/data-cms-field="([^"]+)"/)?.[1] ?? null;
}

const SLIDES = [
  {
    eyebrow: "ØJENBRYN HER",
    heading: "OVERSKRIFT HER",
    blocks: [
      { k: "lead", text: "BRØDTEKST HER" },
      { k: "prose", text: "PROSA HER" },
      { k: "chips", items: ["CHIP HER"] },
      { k: "steps", items: [["TRINTITEL HER", "TRINTEKST HER"]] },
      { k: "cards", items: [["KORTTITEL HER", "KORTTEKST HER"]] },
      { k: "stats", items: [["42", "TALTEKST HER"]] },
    ],
  },
  { heading: "H2", headingHtml: "RIG OVERSKRIFT HER", blocks: [{ k: "lead", html: "RIG BRØDTEKST HER" }] },
] as never;

const html = renderToString(FlagshipSlides({ page: { slides: SLIDES } as never, cmsRef: REF }) as never);

describe("hvad der er rigt på et flagskib", () => {
  it("BRØDTEKSTEN er rig — det var feltet Christian ikke kunne farve", () => {
    expect(erRig(html, "BRØDTEKST HER")).toBe(true);
    expect(feltFor(html, "BRØDTEKST HER")).toBe("slides.0.blocks.0.text");
  });

  it("OVERSKRIFTEN er rig", () => {
    expect(erRig(html, "OVERSKRIFT HER")).toBe(true);
    expect(feltFor(html, "OVERSKRIFT HER")).toBe("slides.0.heading");
  });

  it("prosa, trin-beskrivelser og kort-beskrivelser er rige — det er også brødtekst", () => {
    for (const t of ["PROSA HER", "TRINTEKST HER", "KORTTEKST HER"]) {
      expect(erRig(html, t)).toBe(true);
    }
  });

  it("de html-bårne varianter er nu RIGTIGE felter — de var slet ikke bundet til cms", () => {
    // data-cms-html="heading" er ikke "true", og der var hverken collection,
    // slug eller field. Tre slides var dermed ikke redigerbare overhovedet,
    // mens attributten fik det til at ligne noget der var tænkt.
    expect(erRig(html, "RIG OVERSKRIFT HER")).toBe(true);
    expect(feltFor(html, "RIG OVERSKRIFT HER")).toBe("slides.1.headingHtml");
    expect(erRig(html, "RIG BRØDTEKST HER")).toBe(true);
    expect(feltFor(html, "RIG BRØDTEKST HER")).toBe("slides.1.blocks.0.html");
    // og den gamle, virkningsløse attribut må ikke findes nogen steder
    expect(html).not.toContain('data-cms-html="heading"');
    expect(html).not.toContain('data-cms-html="lead"');
  });

  it("KONTROL: korte værdier forbliver FLADE", () => {
    // Markup i et øjenbryn, et tal eller en chip er en fejl, ikke en mulighed.
    // Uden denne ville «gør alt rigt» bestå de fem prøver ovenfor lige så grønt.
    for (const t of ["ØJENBRYN HER", "CHIP HER", "42", "TALTEKST HER", "TRINTITEL HER", "KORTTITEL HER"]) {
      expect(erRig(html, t)).toBe(false);
    }
  });

  it("KONTROL: hvert rigt felt bærer stadig sin egen adresse", () => {
    // Et rigt felt uden collection/slug/field gemmer ingenting — præcis den
    // fejl html-grenene havde.
    const rige = html.match(/<[^>]*data-cms-html="true"[^>]*>/g) ?? [];
    expect(rige.length).toBeGreaterThan(4);
    for (const tag of rige) {
      expect(tag).toContain('data-cms-collection="platforms"');
      expect(tag).toContain('data-cms-slug="helpdesk"');
      expect(tag).toMatch(/data-cms-field="[^"]+"/);
    }
  });
});
