/**
 * F022 — de tre nye blokke på løsningssiden er VALGFRIE.
 *
 * Den bærende egenskab er ikke at Agentic Engineering-siden kan vise tal, et
 * workshop-tilbud og en FAQ. Det er at de FIRE eksisterende løsningssider —
 * websites, webshops, platforme, ai-integration — renderer nøjagtig som før.
 * Ingen af dem har felterne, og en tom sektion, en tom overskrift eller et
 * ekstra bånd på dem ville være en regression jeg havde indført for at bygge
 * en femte side.
 *
 * Derfor er den NEGATIVE prøve den vigtige her. En blok der altid vises ser
 * rigtig ud på præcis den side man bygger, og forkert på alle de andre.
 */
import { describe, it, expect } from "bun:test";
import { renderToString } from "preact-render-to-string";
import { SolutionPage, type SolutionData } from "@/components/SolutionPage.tsx";

/** Et dokument i den form de fire eksisterende sider har — uden nye felter. */
const GRUNDDATA: SolutionData = {
  name: "Testløsning",
  headingHtml: "En overskrift",
  lead: "En manchet.",
  problemHeading: "Problemet",
  problemP: ["Et afsnit."],
  steps: [["Trin", "Beskrivelse"]],
  features: [["Funktion", "Beskrivelse", "Sparkles"]],
  proofHeading: "Beviset",
  proof: [{ kicker: "K", title: "T", body: "B" }],
  ctaHeadingHtml: "Skal vi bygge?",
  ctaLead: "15 minutter.",
};

const render = (data: SolutionData) =>
  renderToString(
    SolutionPage({
      data,
      locale: "da",
      secondaryCta: { label: "Se mere", href: "#" },
      bookLabel: "Book et møde",
      labels: {
        losningerPrefix: "Løsninger",
        howEyebrow: "Sådan virker det",
        howHeading: "Fra møde til live",
        featuresEyebrow: "Kernefunktioner",
        featuresHeading: "Bygget ind.",
        proofEyebrow: "Beviset",
      },
    }) as never,
  );

const NYE_MARKØRER = [
  'data-testid="solution-stats"',
  'data-testid="solution-workshop"',
  'data-testid="solution-workshop-cta"',
  'data-testid="faq-item-0"',
  'id="workshop"',
  'id="faq"',
];

describe("løsningssidens nye blokke er valgfrie", () => {
  it("KONTROL: en side uden de nye felter får ingen af dem", () => {
    const h = render(GRUNDDATA);
    for (const m of NYE_MARKØRER) expect(h).not.toContain(m);
    // og den gamle side er der stadig i sin helhed
    expect(h).toContain('data-testid="solution-cta-primary"');
    expect(h).toContain('data-testid="solution-cta-final"');
    expect(h).toContain("Problemet");
    expect(h).toContain("Beviset");
  });

  it("KONTROL: tomme lister tæller som fravær, ikke som en tom sektion", () => {
    // `stats: []` er hvad et CMS-felt giver når nogen rydder det. En sektion
    // med nul kort ville efterlade et bånd med luft i og se ud som en fejl.
    const h = render({ ...GRUNDDATA, stats: [], faq: [] });
    expect(h).not.toContain('data-testid="solution-stats"');
    expect(h).not.toContain('id="faq"');
  });

  it("tallene vises når de findes, og bærer deres egen tekst", () => {
    const h = render({ ...GRUNDDATA, stats: [["34", "repoer"], ["1995", "startår"]] });
    expect(h).toContain('data-testid="solution-stats"');
    expect(h).toContain(">34<");
    expect(h).toContain(">repoer<");
  });

  it("et ORD får den mindre skriftstørrelse, et TAL den store", () => {
    // Uden den skelnen løber en frase ud over kortet. Samme regel som
    // flagskibenes Stats — prøvet her fordi den er kopieret og ellers kan
    // drifte fra originalen uden at nogen opdager det.
    const h = render({ ...GRUNDDATA, stats: [["34", "tal"], ["Otte uger", "frase"]] });
    expect(h).toContain('class="stat-num"');
    expect(h).toContain('class="stat-num stat-num-word"');
  });

  it("workshop-blokken vises med sit eget link og sine egne punkter", () => {
    const h = render({
      ...GRUNDDATA,
      workshop: {
        eyebrow: "Workshop",
        heading: "Lær det selv",
        lead: "To dage.",
        bullets: ["Hos jer", "2 dage"],
        ctaLabel: "Book en workshop",
        ctaHref: "/#kontakt",
      },
    });
    expect(h).toContain('data-testid="solution-workshop"');
    expect(h).toContain('data-testid="solution-workshop-cta"');
    expect(h).toContain("Book en workshop");
    expect(h).toContain("Hos jer");
    expect(h).toContain('href="/#kontakt"');
  });

  it("FAQ'en vises når der er spørgsmål", () => {
    const h = render({ ...GRUNDDATA, faq: [["Spørgsmål?", "Svar."]], faqHeading: "Ofte spurgt" });
    expect(h).toContain('data-testid="faq-item-0"');
    expect(h).toContain("Spørgsmål?");
    expect(h).toContain("Ofte spurgt");
  });

  it("hver ny blok er UAFHÆNGIG af de to andre", () => {
    // Ellers ville en side der kun vil have en FAQ få et tomt workshop-bånd med.
    const kun = render({ ...GRUNDDATA, faq: [["Q", "A"]] });
    expect(kun).toContain('data-testid="faq-item-0"');
    expect(kun).not.toContain('data-testid="solution-workshop"');
    expect(kun).not.toContain('data-testid="solution-stats"');
  });
});
