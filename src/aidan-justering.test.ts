import { describe, test as it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { udtaleFor, ordbogNoegle, justeringsFor, justeringsNoegle } from "./aidan-laes.ts";

/**
 * F019.8 — vagten om den ene ting der kan gå galt uden at nogen ser det.
 *
 * Justerings-posterne BESKRIVER lyden; de ændrer den ikke. Slipper én af dem
 * ind i ai.tts, får stemmen et alias for et tal den allerede sagde rigtigt —
 * lyden bliver en anden, alle 59 tidskoder bliver ugyldige, og INTET i
 * brugerfladen vil vise det. Markeringen ville bare holde op med at passe.
 */
describe("justeringsordbogen må aldrig nå stemmen", () => {
  it("udtale-ordbogen indeholder ikke ét eneste tal", () => {
    for (const locale of ["da", "en"] as const) {
      const tal = udtaleFor(locale).filter((r) => /\d/.test(r.word) && !/[a-zA-ZæøåÆØÅ]/.test(r.word));
      expect(tal).toEqual([]);
    }
  });

  it("kun ÉT sted i koden sender pronunciations til stemmen, og det er udtaleFor", () => {
    // Vagten er kildeteksten selv: dukker der et andet kald op, skal nogen
    // forholde sig til om DET kald må bære justerings-poster.
    const kilde = readFileSync(new URL("./aidan-laes.ts", import.meta.url), "utf-8");
    const kald = [...kilde.matchAll(/pronunciations:\s*([A-Za-z_][\w.]*)/g)].map((m) => m[1]);
    expect(kald.length).toBeGreaterThan(0);
    for (const k of kald) expect(k).toMatch(/^(udtale|pron)/);
  });
});

describe("justeringsFor", () => {
  it("giver danske tal-ord på dansk", () => {
    expect(justeringsFor("grundlagt i 1995 med 200 kunder", "da")).toEqual([
      { word: "1995", alias: "nitten hundrede og femoghalvfems" },
      { word: "200", alias: "to hundrede" },
    ]);
  });

  it("giver INTET på engelsk — en engelsk stemme må ikke få danske ord", () => {
    expect(justeringsFor("founded in 1995 with 200 customers", "en")).toEqual([]);
  });
});

describe("de to nøgler svarer på hver sit spørgsmål", () => {
  it("lyd-nøglen er den samme uanset hvilken tekst der læses op", () => {
    // Den beskriver ordbogen bag LYDEN, ikke artiklen.
    expect(ordbogNoegle("da")).toBe(ordbogNoegle("da"));
    expect(ordbogNoegle("da")).toMatch(/^[0-9a-f]{8}$/);
  });

  it("justerings-nøglen følger teksten, for posterne gør", () => {
    const a = justeringsNoegle("i 1995", "da");
    const b = justeringsNoegle("i 2026", "da");
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[0-9a-f]{8}$/);
  });

  it("en tekst uden tal giver ikke samme nøgle som lydens", () => {
    expect(justeringsNoegle("ingen tal her", "da")).not.toBe(ordbogNoegle("da"));
  });
});
