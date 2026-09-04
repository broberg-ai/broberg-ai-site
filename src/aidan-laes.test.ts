/* Segl for oplæsningen (F007.7) — den rene logik: tale-rensning + cache-nøgle. */
import { describe, test, expect } from "bun:test";
import { tilTale, laesCacheNoegle } from "./aidan-laes.ts";

describe("tilTale — det man gider høre", () => {
  test("links læses som deres tekst, aldrig URL'en", () => {
    const t = tilTale("Læs [hele casen](/cases/sanne) her.");
    expect(t).toBe("Læs hele casen her.");
    expect(t).not.toContain("/cases");
  });
  test("markdown-markører siges ikke højt", () => {
    const t = tilTale("# Overskrift\n\n- punkt et\n- punkt to\n\n**fed** og `kode`");
    expect(t).not.toContain("#");
    expect(t).not.toContain("- ");
    expect(t).not.toContain("*");
    expect(t).not.toContain("`");
    expect(t).toContain("Overskrift");
    expect(t).toContain("punkt et");
    expect(t).toContain("fed og kode");
  });
  test("loftet klipper meget lange artikler", () => {
    expect(tilTale("x".repeat(20_000)).length).toBe(12_000);
  });
});

describe("cache-nøglen", () => {
  test("samme tale+stemme = samme nøgle; ændret tale ELLER stemme = ny nøgle", () => {
    expect(laesCacheNoegle("abc", "jeppe")).toBe(laesCacheNoegle("abc", "jeppe"));
    expect(laesCacheNoegle("abc", "jeppe")).not.toBe(laesCacheNoegle("abd", "jeppe"));
    expect(laesCacheNoegle("abc", "jeppe")).not.toBe(laesCacheNoegle("abc", "christel"));
    expect(laesCacheNoegle("abc", "jeppe")).toMatch(/^[0-9a-f]{32}$/);
  });
});
