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
