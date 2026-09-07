/**
 * F008.7 — ★ skal virke på en SIDE, ikke kun på en artikel.
 *
 * loadFeatured læste kun `posts`, mens ★-knappen i redigerings-FAB'en tilbydes
 * på enhver side med et primært dokument. En stjerne på et flagskib blev gemt
 * og gjorde ingenting — og listesidens egen tekst lovede «artikler og sider».
 *
 * Prøven kører mod kilde-tabellen frem for mod et hentet CMS: de tre svar et
 * kort afhænger af (hvor peger det hen · hvad hedder det · hvad står der under)
 * er ren afbildning, og det er dér fejlene bor. At samlingerne læses bevises
 * runtime mod produktion.
 */
import { describe, it, expect } from "bun:test";

const src = await Bun.file("src/content/compose.ts").text();

/**
 * KUN kilde-tabellen. Målt: en assertion mod hele filen består af grunde der
 * intet har med tabellen at gøre — `collection: "platforms"` står også i
 * loadPlatform's cmsRef, så en mutation der fjernede flagskibe fra kilderne
 * blev GRØN. Et instrument der måler det forkerte sted svarer det samme som et
 * der måler det rigtige.
 */
const tabel = src.slice(
  src.indexOf("const FEATURED_KILDER"),
  src.indexOf("export async function loadFeatured"),
);

describe("kilde-tabellen", () => {
  it("dækker artikler, flagskibe OG løsninger", () => {
    expect(tabel.length).toBeGreaterThan(200); // udsnittet fandt faktisk tabellen
    for (const c of ["posts", "platforms", "solutions"]) {
      expect(tabel).toContain(`collection: "${c}"`);
    }
  });

  it("NEGATIV KONTROL: sections læses ALDRIG", () => {
    // sections/universet bærer featured:true, men en sektion har ingen side at
    // pege på. Kom den med, ville båndet vise et dødt link — værre end ingen
    // post. Flaget røres ikke; samlingen læses bare ikke.
    expect(tabel).not.toContain('"sections"');
  });

  it("bruger i18n'ens eget flagskib-segment, ikke en ny streng", () => {
    expect(tabel).toContain("flagshipsSegment(locale)");
    // En fjerde håndskrevet «flagskibe» ville være forkert den dag én rettes.
    expect(tabel).not.toContain("`/flagskibe/");
  });

  it("hver kilde har en manchet-reserve — kun posts har featuredText", () => {
    expect(tabel).toContain("str(d.tagline) ||");
    expect(tabel).toContain("str(d.blurb) ||");
  });

  it("elementet bærer sin EGEN samling videre", () => {
    expect(src).toContain("collection: kilde.collection");
  });
});

describe("kortene ankrer i den rigtige samling", () => {
  it("forsidens boks bruger elementets samling, ikke hardkodet posts", async () => {
    const f = await Bun.file("src/components/Featured.tsx").text();
    expect(f).toContain("collection: item.collection");
    expect(f).not.toContain('collection: "posts"');
  });

  it("/featured-listens kort ligeså", async () => {
    const r = await Bun.file("src/routes.tsx").text();
    const liste = r.slice(r.indexOf("renderFeaturedListe"), r.indexOf("renderFeaturedListe") + 3000);
    expect(liste).toContain("collection: it.collection");
    expect(liste).not.toContain('collection: "posts"');
  });
});

/**
 * F008.8 — mærket i båndet ligner en knap, så det skal være én.
 *
 * Den negative kontrol er den vigtige: to ANDRE steder bruger samme .f-maerke,
 * og det ene sidder INDE I <a class="f-lille">. Et <a> i et <a> er ugyldigt —
 * browseren reparerer det ved at bryde det ydre link op, så hele kortet ville
 * holde op med at virke. En senere «gennemfør det overalt» i god tro er præcis
 * det, denne prøve findes for at stoppe.
 */
/**
 * Kommentarer STRIPPES før nogen assertion. Målt 7/9-2026: den negative kontrol
 * nedenfor matchede `<a class="f-lille"` inde i den KOMMENTAR der forklarer
 * hvorfor kortet ikke må have et link — altså det stik modsatte af det den
 * skulle måle, og den bestod. Samme greb som repoets egen gate-cms-text bruger,
 * og af samme grund: filen der BEGRUNDER en regel er den der ellers vælter den.
 */
const udenKommentarer = (t: string) =>
  t.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const featuredTsx = udenKommentarer(await Bun.file("src/components/Featured.tsx").text());
const routesTsx = await Bun.file("src/routes.tsx").text();
const brandCss = await Bun.file("src/styles/brand.css").text();

describe("F008.8 — ★-mærket i båndet er et link", () => {
  const f = featuredTsx;
  const baand = f.slice(f.indexOf("export function FeaturedBaand"), f.indexOf("function refOf"));

  it("mærket i båndet er et <a>, ikke et <span>", () => {
    expect(baand).toMatch(/<a class="f-maerke[^"]*" href=\{alleHref\}/);
    expect(baand).toContain('data-testid="featured-baand-maerke"');
  });

  it("adressen kommer fra withLocale, ikke fra en skrevet /featured", () => {
    // En håndskrevet "/featured" ville føre til den DANSKE liste fra en engelsk
    // side — og gøre det i tavshed.
    expect(baand).not.toContain('href="/featured"');
    expect(routesTsx).toContain('alleHref={withLocale(meta.locale, "/featured")}');
  });

  it("NEGATIV KONTROL: forsidens små kort har intet <a> inde i deres <a>", () => {
    const start = f.indexOf('<a class="f-lille"');
    const lille = f.slice(start, f.indexOf("</a>", start));
    // Identitet, ikke længde: udsnittet skal indeholde kortets EGET indhold.
    // En længde-kontrol alene bestod på en kommentar der bare nævnte klassen.
    expect(lille).toContain("f-lille-laes");
    expect(lille.slice('<a class="f-lille"'.length)).not.toContain("<a ");
  });

  it("mærket giver feedback — hover og :active", () => {
    expect(brandCss).toContain(".f-maerke-link:hover");
    expect(brandCss).toContain(".f-maerke-link:active");
  });
});
