import { describe, test as it, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { config } from "@/config.ts";

/**
 * F014 — /universet er en RUTE, ikke et dokument, og faldt derfor ud af både
 * tag-systemet og ⌘K.
 *
 * Målt på produktion 8/9 2026, før noget blev bygget:
 *   · /search-index.json  → 44 poster, ingen af dem /universet
 *   · /tags               → 102 tags, ingen «Agentic orkestration»
 *   · /tags/agentic-orkestration → 404
 *
 * Prøverne her holder de tre ting fast der hver især kan gå i stykker uden at
 * SE i stykker:
 *
 *  1. Søgeposten skal bære sidens tags som `keywords`. Titlen indeholder ikke
 *     ordet «agentic», så uden keywords findes siden ikke på præcis det man
 *     bad om — og ⌘K ville bare vise «ingen resultater», hvilket ligner et
 *     tomt site, ikke en fejl.
 *  2. Tag-siden skal tælle /universet med. Ellers peger hvert chip i bunden af
 *     siden på en 404, mens siden selv ser fuldstændig færdig ud.
 *  3. Uden felterne i CMS må der IKKE renderes en halv post. Det er den
 *     negative kontrol: en kode-reservetekst ville bestå prøve 1 og 2 uden at
 *     der stod noget i CMS'et overhovedet.
 */

// Prøven skriver ind i det RIGTIGE lager og lægger det tilbage bagefter.
//
// Første udgave satte i stedet CONTENT_DIR til en temp-mappe øverst i filen.
// Den bestod når filen kørte alene og fejlede 5 gange i den fulde kørsel:
// `store.ts` regner sin rod ud ÉN gang ved import (`resolve(config.contentDir)`),
// og `config.ts` læser env ÉN gang ved sin. Kørte en anden prøvefil først, var
// roden allerede låst til ./.content-store, og min env-tildeling kom for sent.
//
// Det er samme fejlform som flådens modul-mock-hændelse: et grønt resultat der
// udelukkende skyldtes rækkefølgen filerne tilfældigvis kørte i. At læse roden
// FRA config er derimod rigtigt i begge rækkefølger — det er per definition den
// rod store.ts selv bruger.
const ROD = resolve(config.contentDir);
const GLOBALS = join(ROD, "globals", "globals.json");
let original: string | null = null;

beforeAll(() => {
  original = existsSync(GLOBALS) ? readFileSync(GLOBALS, "utf8") : null;
});

afterAll(() => {
  // Læg dev-lageret tilbage som det var — også når det ikke fandtes før.
  if (original === null) rmSync(GLOBALS, { force: true });
  else writeFileSync(GLOBALS, original);
});

const TAGS = ["Agentic orkestration", "AI-native", "Metode"];

function seedGlobals(data: Record<string, unknown>) {
  mkdirSync(join(ROD, "globals"), { recursive: true });
  writeFileSync(
    GLOBALS,
    JSON.stringify({ slug: "globals", status: "published", locale: "da", data }),
  );
}

const compose = await import("@/content/compose.ts");

describe("søgeposten for /universet", () => {
  it("bærer sidens tags som keywords — så «Agentic orkestration» rammer", async () => {
    seedGlobals({
      universetTags: TAGS,
      universetCardTitle: "Universet — sådan bygger vi det",
      universetCardBlurb: "Motorerne bag broberg.ai.",
    });
    const idx = await compose.buildSearchIndex("da");
    const post = idx.find((e) => e.data === "/universet");
    expect(post, "ingen post peger på /universet").toBeTruthy();

    // Præcis den kontrol paletten selv laver: token-AND over hele høstakken.
    const hay = `${post!.title} ${post!.subtitle} ${post!.badge} ${post!.keywords ?? ""}`.toLowerCase();
    for (const ord of "agentic orkestration".split(" ")) {
      expect(hay, `«${ord}» er ikke i søge-høstakken`).toContain(ord);
    }
  });

  it("NEGATIV KONTROL: titlen alene kan IKKE bære søgningen", async () => {
    // Uden denne ville prøven ovenfor også bestå hvis keywords blev droppet og
    // ordet tilfældigvis stod i titlen. Det gør det ikke — og det er hele
    // grunden til at keywords-feltet findes.
    seedGlobals({
      universetTags: TAGS,
      universetCardTitle: "Universet — sådan bygger vi det",
      universetCardBlurb: "Motorerne bag broberg.ai.",
    });
    const post = (await compose.buildSearchIndex("da")).find((e) => e.data === "/universet")!;
    expect(`${post.title} ${post.subtitle}`.toLowerCase()).not.toContain("agentic");
  });

  it("uden felter i CMS er der INGEN post — ikke en tom en", async () => {
    seedGlobals({ noget: "andet" });
    const idx = await compose.buildSearchIndex("da");
    expect(idx.find((e) => e.data === "/universet")).toBeUndefined();
  });
});

describe("tag-siden må ikke give 404 på et chip siden selv viser", () => {
  it("/universet tælles med på en tag-side den bærer tagget for", async () => {
    seedGlobals({
      universetTags: TAGS,
      universetCardTitle: "Universet — sådan bygger vi det",
      universetCardBlurb: "Motorerne bag broberg.ai.",
    });
    const { hits, label } = await compose.loadPostsByTag("da", "agentic-orkestration");
    expect(hits.map((h) => h.href)).toContain("/universet");
    // Etiketten skal komme fra tagget som det er SKREVET, ikke fra slug'en.
    expect(label).toBe("Agentic orkestration");
  });

  it("et tag siden ikke bærer giver stadig nul hits", async () => {
    seedGlobals({
      universetTags: TAGS,
      universetCardTitle: "Universet — sådan bygger vi det",
      universetCardBlurb: "Motorerne bag broberg.ai.",
    });
    const { hits } = await compose.loadPostsByTag("da", "findes-ikke");
    expect(hits).toHaveLength(0);
  });

  it("uden titel i CMS tælles den ikke med — et kort uden overskrift er værre end intet", async () => {
    seedGlobals({ universetTags: TAGS });
    const { hits } = await compose.loadPostsByTag("da", "agentic-orkestration");
    expect(hits).toHaveLength(0);
  });

  it("tag-skyen viser tagget, så siden og skyen ikke drifter", async () => {
    seedGlobals({
      universetTags: TAGS,
      universetCardTitle: "Universet — sådan bygger vi det",
      universetCardBlurb: "Motorerne bag broberg.ai.",
    });
    const sky = await compose.buildTagCloud("da");
    expect(sky.map((t) => t.slug)).toContain("agentic-orkestration");
  });
});

describe("loadUniversetSurface læser kun fra CMS", () => {
  it("tomt dokument → tomme værdier, ingen reservetekst", async () => {
    seedGlobals({});
    const s = await compose.loadUniversetSurface("da");
    expect(s.tags).toEqual([]);
    expect(s.title).toBe("");
    expect(s.blurb).toBe("");
    // Adressen er den ENESTE ting der må komme fra koden — den er en rute, ikke
    // en tekst, og kan ikke redigeres i cms uden at ruten også ændres.
    expect(s.href).toBe("/universet");
  });

  it("kun strenge er tags — et null må ikke blive til et chip der hedder «null»", async () => {
    // Fanget af denne prøve på første kørsel: `.map(String)` gjorde null til
    // "null", som passerede .filter(Boolean) og ville have renderet et chip
    // med teksten «null» der linker til /tags/null. Et tal er heller ikke et
    // tag — det er data der er havnet i det forkerte felt.
    seedGlobals({ universetTags: ["Fint", "  Med mellemrum  ", "", null, 42] });
    const s = await compose.loadUniversetSurface("da");
    expect(s.tags).toEqual(["Fint", "Med mellemrum"]);
  });
});
