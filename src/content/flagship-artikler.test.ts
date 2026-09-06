import { describe, test as it, expect } from "bun:test";
import { slugifyTag } from "@/i18n.ts";

/**
 * Koblingen mellem en flagskibsside og dens artikler er TAGGET — og den matcher
 * på SLUG, ikke på visningsnavn.
 *
 * Det er hele holdbarheden i designet. Et flagskib kan omdøbes i CMS'et uden at
 * dets slug ændrer sig: dokumentet «hosting» hedder «drift», «pitch-vault»
 * hedder «pitch vault». En kobling på navnet ville briste ved den omdøbning og
 * gøre det TAVST — listen ville bare stå tom, og ingen ville få en fejl.
 */
describe("tag → flagskib", () => {
  it("visningsnavn og slug mødes gennem slugifyTag", () => {
    // par målt i CMS'et 6/9-2026: [tagget en redaktør skriver, dokumentets slug]
    const par: Array<[string, string]> = [
      ["Lens", "lens"],
      ["Trail", "trail"],
      ["CMS", "cms"],
      ["Pitch Vault", "pitch-vault"],
      ["ai-sdk", "ai-sdk"],
      ["cardmem", "cardmem"],
    ];
    for (const [tag, slug] of par) expect(slugifyTag(tag)).toBe(slug);
  });

  it("«drift» rammer IKKE hosting-siden — visningsnavnet er ikke slug'en", () => {
    // Dokumentet har slug "hosting" og hedder "drift". Tagget skal derfor være
    // det slug'en siger. Står det som "drift", er koblingen brudt — og det er
    // netop den brudte kobling der ikke fejler nogen steder.
    expect(slugifyTag("drift")).not.toBe("hosting");
  });

  it("store bogstaver og mellemrum må ikke skille tag fra flagskib", () => {
    for (const skrivemaade of ["Pitch Vault", "pitch vault", "PITCH VAULT", " Pitch  Vault "]) {
      expect(slugifyTag(skrivemaade)).toBe("pitch-vault");
    }
  });

  it("æøå overlever — et dansk tag må ikke blive til bindestreger", () => {
    expect(slugifyTag("Måling")).toBe("måling");
    expect(slugifyTag("Kvalitet")).toBe("kvalitet");
  });
});

/**
 * Link-signalet. Et LINK til /flagskibe/<slug> kobler artiklen til flagskibet
 * på lige fod med et tag.
 *
 * Målt 6/9-2026 på de 27 artikler: tags gav 21 koblinger, links gav 14, og de
 * overlapper ikke. Drift-siden (slug «hosting») havde NUL tags og to artikler
 * der linker til den — uden link-signalet stod den side tom for altid.
 *
 * Grunden til at links tør bruges hvor fritekst ikke gør: et link er en bevidst
 * handling. Ordet «drift» står i 11 af 27 artikler, næsten alle som vendingen
 * «i drift» — ingen af dem linker til siden.
 */
describe("link → flagskib", () => {
  // samme udtryk som loadFlagshipArtikler bygger
  const linkRe = (n: string) =>
    new RegExp(`\\]\\((?:/en)?/(?:flagskibe|flagships)/${n}(?:[)/#?]|$)`);

  it("fanger et markdown-link til flagskibssiden, på begge sprog", () => {
    for (const md of [
      "Vi har et værktøj, [Lens](/flagskibe/lens), der åbner sider.",
      "We have a tool, [Lens](/en/flagships/lens), that opens pages.",
      "se [her](/flagskibe/lens#hvordan) og [her](/flagskibe/lens/)",
    ]) {
      expect(linkRe("lens").test(md)).toBe(true);
    }
  });

  it("et link til et ANDET flagskib tæller ikke med", () => {
    expect(linkRe("lens").test("[cms](/flagskibe/cms)")).toBe(false);
    // og et længere slug der starter med det samme må ikke smitte
    expect(linkRe("cms").test("[x](/flagskibe/cms-noget-andet)")).toBe(false);
  });

  it("OMTALE uden link tæller ikke — det er hele forskellen", () => {
    for (const md of [
      "systemet er i drift hos tre kunder",
      "vi kalder det lens, men det er ikke et link",
      "en artikel om cms-motoren uden reference",
    ]) {
      expect(linkRe("hosting").test(md)).toBe(false);
      expect(linkRe("lens").test(md)).toBe(false);
      expect(linkRe("cms").test(md)).toBe(false);
    }
  });
});
