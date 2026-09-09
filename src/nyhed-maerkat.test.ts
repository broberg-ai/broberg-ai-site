/* F013.3 — «Nyhed»-mærkatet i flagskibs-gitteret. */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const CSS = readFileSync(new URL("./styles/brand.css", import.meta.url), "utf8");
const TSX = readFileSync(new URL("./components/sections.tsx", import.meta.url), "utf8");

function luminans(hex: string): number {
  const h = hex.replace("#", "");
  const kanal = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = [0, 2, 4].map((i) => kanal(parseInt(h.slice(i, i + 2), 16)));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
function kontrast(a: string, b: string): number {
  const [x, y] = [luminans(a), luminans(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
function rodToken(navn: string): string {
  const m = CSS.match(new RegExp(`${navn}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`fandt ikke ${navn}`);
  return m[1]!;
}
const blok = (start: string): string => {
  const i = CSS.indexOf(start);
  return i < 0 ? "" : CSS.slice(i, CSS.indexOf("}", i));
};

describe("kontrasten er REGNET, ikke skønnet", () => {
  it("mærkatets tekst mod dets flade klarer 4,5:1", () => {
    // 9,5 px versaler er ALMINDELIG tekst efter WCAG (stor tekst begynder ved
    // 18,66 px fed), så kravet er 4,5:1 — ikke 3:1.
    const r = kontrast(rodToken("--nyhed-tekst"), rodToken("--nyhed-flade"));
    expect(r, `kontrasten er ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
  });

  it("hvid tekst på samme flade ville IKKE have klaret det", () => {
    // Kontrollen der gør prøven ovenfor diskriminerende: den oplagte,
    // forventede farve dumper. Består begge, måler prøven ingenting.
    expect(kontrast("#ffffff", rodToken("--nyhed-flade"))).toBeLessThan(4.5);
  });

  it("fladen er ét token, ikke en hardkodet farve i reglen", () => {
    const b = blok(".badge-nyhed {");
    expect(b, ".badge-nyhed findes ikke").not.toBe("");
    expect(b).toContain("background: var(--nyhed-flade)");
    expect(b).toContain("color: var(--nyhed-tekst)");
  });

  it("mærkatet står på skrå", () => {
    expect(blok(".badge-nyhed {")).toMatch(/transform:\s*rotate\(-?\d+deg\)/);
  });
});

describe("gitteret kender tre tilstande", () => {
  const gren = TSX.slice(TSX.indexOf('p.status === "live"'), TSX.indexOf("</a>", TSX.indexOf('p.status === "live"')));

  it("live giver stadig det grønne mærkat", () => {
    expect(gren).toContain('p.status === "live"');
    expect(gren).toMatch(/class="badge"/);
  });

  it("new giver det nye mærkat — og kun når teksten findes", () => {
    // Uden `&& p.badge` ville en tom CMS-værdi give et tomt orange mærkat.
    expect(gren).toContain('p.status === "new" && p.badge');
    expect(gren).toContain('class="badge badge-nyhed"');
  });

  it("alt ukendt giver stadig det dæmpede «Snart»", () => {
    expect(gren).toContain('class="badge badge-soon"');
    expect(gren).toContain("Snart");
  });

  it("teksten kommer fra dokumentet, ikke fra koden", () => {
    expect(gren).toContain("{p.badge}");
    expect(gren, "mærkatet skal kunne redigeres inline").toContain('cmsAttrs(p.cmsRef, "badge")');
  });

  it("alle tre grene bærer det samme anker", () => {
    const n = (gren.match(/flagship-badge-\$\{p\.logoKey\}/g) ?? []).length;
    expect(n, "Lens skal kunne finde mærkatet uanset tilstand").toBe(3);
  });
});
