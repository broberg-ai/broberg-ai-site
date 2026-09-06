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
