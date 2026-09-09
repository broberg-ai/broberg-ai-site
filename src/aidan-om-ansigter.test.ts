/* F007.21 — info-panelet viser de to ansigter det handler om. */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const TSX = readFileSync(new URL("./components/AidanWidget.tsx", import.meta.url), "utf8");
const CSS = readFileSync(new URL("./styles/brand.css", import.meta.url), "utf8");
const raekke = (() => {
  const i = TSX.indexOf('data-testid="aidan-om-ansigter"');
  return i < 0 ? "" : TSX.slice(i, TSX.indexOf("</div>", i));
})();

describe("begge ansigter står i panelet", () => {
  it("rækken findes og har sit anker", () => {
    expect(raekke, "ansigts-rækken findes ikke").not.toBe("");
  });

  it("BEGGE værter vises — ikke kun den valgte persona", () => {
    // Chattens egen Figur lægger begge i DOM'en og lader CSS vise ÉN efter
    // valgt persona. Her skal begge stå samtidig; det er hele pointen med et
    // panel der forklarer at Airina er «et andet ansigt».
    expect(raekke).toContain('vaert="aidan"');
    expect(raekke).toContain('vaert="airina"');
    expect((raekke.match(/<VaertFigur/g) ?? []).length).toBe(2);
  });

  it("bruger den DELTE figur-komponent, ikke en kopi", () => {
    expect(TSX).toMatch(/import \{[^}]*VaertFigur[^}]*\} from "@\/components\/Figur\.tsx"/);
    expect(raekke, "en egen <img> ville kunne drive fra chat og podcast").not.toContain("<img");
  });

  it("navnene læses fra CMS, ikke skrevet i koden", () => {
    expect(raekke).toContain("{t.navn}");
    expect(raekke).toContain("{t.airinaNavn}");
    expect(raekke).toContain('cmsAttrs(globalsRef, "aidanNavn")');
    expect(raekke).toContain('cmsAttrs(globalsRef, "airinaNavn")');
    // NEGATIV KONTROL: et hardkodet navn ville bestå prøverne ovenfor.
    expect(raekke).not.toMatch(/>\s*Aidan\s*</);
    expect(raekke).not.toMatch(/>\s*Airina\s*</);
  });

  it("genbruger podcast-sidens ring frem for en ny", () => {
    expect(raekke).toContain("pod-avatar pod-avatar-figur");
    expect(raekke).toContain("pod-avatar-krop");
  });
});

describe("ringen er tilpasset panelets bredde", () => {
  const blok = (start: string) => {
    const i = CSS.indexOf(start);
    return i < 0 ? "" : CSS.slice(i, CSS.indexOf("}", i));
  };

  it("mindre end podcast-sidens 4,75rem", () => {
    const b = blok(".aidan-om-ring {");
    expect(b, ".aidan-om-ring findes ikke").not.toBe("");
    const m = b.match(/width:\s*([\d.]+)rem/);
    expect(m, "ingen bredde på ringen").not.toBeNull();
    expect(Number(m![1])).toBeLessThan(4.75);
  });

  it("figurens luft skaleres med — ellers klippes armene", () => {
    // .pod-avatar-krop har inset: 11px målt ved 76px. Ved ~50px klipper den.
    expect(blok(".aidan-om-ring .pod-avatar-krop {")).toMatch(/inset:\s*\d+px/);
  });
});
