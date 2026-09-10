/* F008.10 — forsidens featured-sektion: 1 stor + 2 små, 3 kun ved lang titel. */
import { describe, expect, it } from "bun:test";
import { renderToString } from "preact-render-to-string";
import {
  FeaturedBoks,
  antalSmaa,
  FEATURED_SMAA_STANDARD,
  FEATURED_SMAA_LANG,
  FEATURED_LANG_TITEL_TEGN,
} from "./components/Featured.tsx";
import { roterFeatured, nulstilRotation } from "./content/featured-rotation.ts";
import type { FeaturedItem } from "./content/compose.ts";

// De MÅLTE titler fra produktion 10/9 med deres naturlige bokshøjde.
const BI = "Byg jeres BI-dashboard fra bunden — hurtigere end at tæmme Power BI"; // 67 tegn → 609px
const AIDAN = "Aidan — assistenten der voksede op her"; // 38 tegn → 418px
const KORT = "helpdesk"; // 8 tegn → 359px

const emne = (i: number, titel?: string): FeaturedItem => ({
  href: `/indsigter/emne-${i}`,
  title: titel ?? `Emne ${i}`,
  featuredText: `Manchet ${i}`,
  category: "indsigt",
  slug: `emne-${i}`,
  collection: "posts",
});

const html = (n: number, storTitel?: string) =>
  renderToString(
    FeaturedBoks({
      items: Array.from({ length: n }, (_v, i) => (i === 0 ? emne(i, storTitel) : emne(i))),
      eyebrow: "Fremhævet lige nu",
      laes: "Læs",
      maerke: "★ Featured",
      alle: "Se alle featured",
      alleHref: "/featured",
    }) as never,
  );

const smaa = (h: string) => (h.match(/data-testid="featured-lille"/g) ?? []).length;
const store = (h: string) => (h.match(/class="f-boks"/g) ?? []).length;

describe("antalSmaa — grænsen er målt, ikke valgt", () => {
  it("BI-titlen (67 tegn, boks 609px) giver 3", () => {
    expect(antalSmaa(BI)).toBe(3);
  });

  it("de øvrige målte titler giver 2", () => {
    // 418px og 359px — bokse der ikke selv bærer 677px stak.
    expect(antalSmaa(AIDAN)).toBe(2);
    expect(antalSmaa(KORT)).toBe(2);
    expect(antalSmaa("Otte uger til en hel sundhedsplatform")).toBe(2);
    expect(antalSmaa("Seletøjet, ikke agenten")).toBe(2);
  });

  it("grænsen ligger i det TOMME spænd mellem de to grupper", () => {
    // Nærmeste målinger er 38 og 67 tegn. En grænse på fx 38 ville vippe på
    // et enkelt ord i en titel der aldrig var tænkt som «stor».
    expect(FEATURED_LANG_TITEL_TEGN).toBeGreaterThan(AIDAN.length);
    expect(FEATURED_LANG_TITEL_TEGN).toBeLessThanOrEqual(BI.length);
  });

  it("HTML i titlen tæller ikke med", () => {
    // Titlen kan bære <em>. Prøven SKAL diskriminere: rå længde over grænsen,
    // synlig tekst under. «<em>helpdesk</em>» gjorde det ikke — 17 tegn er
    // under 55 begge veje, så den bestod uanset om strippet var der.
    const medTags = "<em>Seletøjet</em>, <strong>ikke</strong> <em>agenten</em>";
    expect(medTags.length, "prøven måler intet hvis rå længde er under grænsen")
      .toBeGreaterThanOrEqual(FEATURED_LANG_TITEL_TEGN);
    expect(medTags.replace(/<[^>]+>/g, "").length, "synlig tekst skal være UNDER grænsen")
      .toBeLessThan(FEATURED_LANG_TITEL_TEGN);
    expect(antalSmaa(medTags)).toBe(FEATURED_SMAA_STANDARD);
  });

  it("tom eller manglende titel giver standarden", () => {
    expect(antalSmaa("")).toBe(FEATURED_SMAA_STANDARD);
    expect(antalSmaa(undefined as unknown as string)).toBe(FEATURED_SMAA_STANDARD);
  });
});

describe("sektionen viser aldrig flere end reglen tillader", () => {
  it("seks taggede med en KORT stor titel giver 1 + 2", () => {
    // Det MÅLTE tilfælde: 6 featured, skærmbilledet viste 1 + 4 = 907px.
    const h = html(6, KORT);
    expect(store(h)).toBe(1);
    expect(smaa(h)).toBe(2);
  });

  it("seks taggede med BI-titlen øverst giver 1 + 3", () => {
    expect(smaa(html(6, BI))).toBe(3);
  });

  it("tyve taggede sprænger ikke loftet", () => {
    expect(smaa(html(20, KORT))).toBe(2);
    expect(smaa(html(20, BI))).toBe(3);
  });

  it("færre end loftet vises som de er", () => {
    expect(smaa(html(1, KORT))).toBe(0);
    expect(smaa(html(2, KORT))).toBe(1);
    expect(smaa(html(3, KORT))).toBe(2);
  });

  it("ingen taggede giver ingen sektion", () => {
    expect(html(0)).toBe("");
  });

  it("de to lofter er forskellige — ellers måler prøverne ovenfor ingenting", () => {
    expect(FEATURED_SMAA_LANG).toBeGreaterThan(FEATURED_SMAA_STANDARD);
  });
});

describe("de bortskrabede skal stadig kunne nås", () => {
  it("«Se alle featured» vises når der er flere end vi viser", () => {
    expect(html(5, KORT)).toContain('data-testid="featured-alle"');
  });

  it("og IKKE når alle er på skærmen", () => {
    expect(html(1 + FEATURED_SMAA_STANDARD, KORT)).not.toContain('data-testid="featured-alle"');
  });

  it("grænsen følger den STORE titel, ikke et fast tal", () => {
    // Fire elementer + BI-titel = alle vist (1+3) → intet link.
    // Fire elementer + kort titel = én skrabet af (1+2) → link.
    expect(html(4, BI)).not.toContain('data-testid="featured-alle"');
    expect(html(4, KORT)).toContain('data-testid="featured-alle"');
  });
});

describe("rotationen sker FØR loftet — ellers ses de øvrige aldrig", () => {
  it("alle seks kommer i den store plads over seks visninger", () => {
    nulstilRotation();
    const alle = Array.from({ length: 6 }, (_v, i) => emne(i));
    const sete = new Set<string>();
    for (let i = 0; i < 6; i++) sete.add(roterFeatured(alle, "da")[0]!.slug);
    expect(sete.size, `kun ${sete.size} af 6 nåede den store plads`).toBe(6);
  });

  it("NEGATIV KONTROL: roterer man en afkortet liste, ses kun de tre", () => {
    nulstilRotation();
    const afkortet = Array.from({ length: 6 }, (_v, i) => emne(i)).slice(0, 1 + FEATURED_SMAA_STANDARD);
    const sete = new Set<string>();
    for (let i = 0; i < 6; i++) sete.add(roterFeatured(afkortet, "da")[0]!.slug);
    expect(sete.size).toBe(3);
  });
});
