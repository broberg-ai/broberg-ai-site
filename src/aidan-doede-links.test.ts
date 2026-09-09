/* F018.13 — Aidan uddelte døde links: en Trail-titel var en filsti. */
import { describe, expect, it } from "bun:test";
import { renTrailTitel } from "./aidan.ts";
import { aidanTilHtml } from "./client/aidan-md.ts";

// Sitets egen sideliste — samme form som /api/aidan/indsigter leverer.
const SIDER = new Set(["/", "/cases", "/flagskibe/trail", "/universet"]);

describe("renTrailTitel — en filsti er ikke en titel", () => {
  it("rydder den MÅLTE streng fra Trail 9/9-2026", () => {
    // Det øverste træf på «metode» havde bogstaveligt denne title-værdi.
    expect(renTrailTitel("/neurons/concepts/metodiske-tilgange.md")).toBe("Metodiske tilgange");
  });

  it("lader en rigtig titel stå urørt", () => {
    expect(renTrailTitel("Metodiske tilgange")).toBe("Metodiske tilgange");
    expect(renTrailTitel("Design-principper")).toBe("Design-principper");
    expect(renTrailTitel("Aidan: hvorfor 3 lag?")).toBe("Aidan: hvorfor 3 lag?");
  });

  it("rydder også et bart filnavn", () => {
    expect(renTrailTitel("design-principper.md")).toBe("Design principper");
  });

  it("tåler tomt input", () => {
    expect(renTrailTitel("")).toBe("");
    expect(renTrailTitel(undefined as unknown as string)).toBe("");
  });
});

describe("spærren mod links der ikke findes på sitet", () => {
  it("den MÅLTE døde knap bliver ren tekst", () => {
    const h = aidanTilHtml(
      "[knap:Læs mere om metodiske tilgange](/neurons/concepts/metodiske-tilgange)",
      SIDER,
    );
    expect(h).not.toContain("href=");
    expect(h).toContain("Læs mere om metodiske tilgange");
  });

  it("en gyldig og en ugyldig sti i SAMME svar: kun den gyldige bliver knap", () => {
    const h = aidanTilHtml("[knap:Trail](/flagskibe/trail) [knap:Spøgelse](/findes-ikke)", SIDER);
    expect(h).toContain('href="/flagskibe/trail"');
    expect(h).not.toContain("/findes-ikke");
    expect(h).toContain("Spøgelse");
  });

  it("almindelige links spærres på samme måde", () => {
    expect(aidanTilHtml("Se [casen](/findes-ikke).", SIDER)).not.toContain("<a");
    expect(aidanTilHtml("Se [casen](/cases).", SIDER)).toContain('href="/cases"');
  });

  it("eksterne links og ankre går FRI — spærren er snæver med vilje", () => {
    expect(aidanTilHtml("[knap:Kontakt](/#kontakt)", SIDER)).toContain('href="/#kontakt"');
    expect(aidanTilHtml("[Broberg](https://broberg.ai/hvad-som-helst)", SIDER)).toContain("<a");
  });

  it("uden en sideliste spærres INTET — fail-open", () => {
    // En langsom fetch må aldrig kunne slå de rigtige links ihjel.
    expect(aidanTilHtml("[knap:Trail](/flagskibe/trail)")).toContain('href="/flagskibe/trail"');
    expect(aidanTilHtml("[knap:X](/findes-ikke)", new Set())).toContain('href="/findes-ikke"');
  });

  it("en efterhængt skråstreg er den samme side", () => {
    expect(aidanTilHtml("[knap:Cases](/cases/)", SIDER)).toContain("<a");
  });
});
