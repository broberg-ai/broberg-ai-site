/**
 * F008.6 — «denne side er featured».
 *
 * Den bærende egenskab er ikke at emblemet KAN vises, men at det er BUNDET til
 * dokumentets eget `featured`. Et emblem der altid vises ser rigtigt ud på
 * præcis de sider man tjekker først — derfor er den negative kontrol her lige
 * så vigtig som den positive.
 *
 * Og emblemet læser sidens EGET dokument, ikke loadFeatured(): ★-knappen i
 * redigerings-FAB'en tilbydes på enhver side med et primært dokument, mens
 * loadFeatured kun kender `posts`. Målt 7/9-2026 — uden denne binding ville en
 * stjerne på et flagskib blive ved med at være virkningsløs.
 */
import { describe, it, expect } from "bun:test";
import { renderToString } from "preact-render-to-string";
import { FeaturedEmblem } from "@/components/Featured.tsx";

const html = (featured: boolean, tekst = "★ Featured") =>
  renderToString(FeaturedEmblem({ featured, tekst }) as never);

describe("FeaturedEmblem", () => {
  it("viser emblemet når dokumentet er featured", () => {
    const h = html(true);
    expect(h).toContain('data-testid="featured-emblem"');
    expect(h).toContain("★ Featured");
  });

  it("NEGATIV KONTROL: viser INTET når dokumentet ikke er featured", () => {
    // Uden denne består et emblem der er hardcodet ind i sidehovedet.
    expect(html(false)).toBe("");
  });

  it("bruger CMS-teksten, ikke en streng fra koden", () => {
    // Teksten bor i globals.featuredEmblem (da+en). Reserveteksten i koden er en
    // nødbremse, ikke tekstens hjem — så komponenten må ikke kunne overstyre den.
    expect(html(true, "★ Fremhævet")).toContain("★ Fremhævet");
    expect(html(true, "★ Fremhævet")).not.toContain("★ Featured");
  });

  it("genbruger husets .f-maerke frem for en fjerde variant af samme mærke", () => {
    expect(html(true)).toContain("f-maerke");
  });
});

/**
 * Alle fire sidetyper skal faktisk RENDERE emblemet. En komponent der virker og
 * ikke er sat ind noget sted består hver eneste prøve ovenfor.
 *
 * Kilde-niveau med vilje: de fire renderere kræver CMS-indhold for at køre, og
 * en prøve der mocker hele indholdslaget ville bevise mocken. Runtime-beviset er
 * målingen på den serverede HTML efter udrulning.
 */
describe("emblemet er sat ind i alle fire sidehoveder", () => {
  const routes = Bun.file("src/routes.tsx");
  const slides = Bun.file("src/components/FlagshipSlides.tsx");
  const solution = Bun.file("src/components/SolutionPage.tsx");

  it("artikel + klassisk flagskib (routes.tsx)", async () => {
    const s = await routes.text();
    expect(s.match(/<FeaturedEmblem/g)?.length ?? 0).toBe(2);
  });

  it("flagskib med slides — den vej /flagskibe/trail faktisk går", async () => {
    const s = await slides.text();
    expect(s).toContain("<FeaturedEmblem");
    // Kun hero-sliden: emblemet hører i TOPPEN af siden, ikke på hver slide.
    expect(s.match(/<FeaturedEmblem/g)?.length ?? 0).toBe(1);
  });

  it("løsningsside", async () => {
    expect(await solution.text()).toContain("<FeaturedEmblem");
  });

  it("flagskib-slides læser dokumentets featured, ikke loadFeatured()", async () => {
    const s = await routes.text();
    expect(s).toContain("fsFeatured");
    expect(s).toContain('.featured === true');
  });
});
