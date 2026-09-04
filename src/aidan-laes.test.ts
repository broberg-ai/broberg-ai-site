/* Segl for oplæsningen (F007.7) — den rene logik: tale-rensning + cache-nøgle. */
import { describe, test, expect } from "bun:test";
import { tilTale, laesCacheNoegle, udtaleFor, ordbogNoegle } from "./aidan-laes.ts";

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

describe("udtale-ordbogen (ai-sdk 0.39.0 pronunciations — Christians formål 5/9)", () => {
  test("teksten forvanskes IKKE længere — udtalen bor i pronunciations-feltet", () => {
    expect(tilTale("vores AI-assistent på broberg.ai")).toBe("vores AI-assistent på broberg.ai");
    expect(tilTale("en ai-native webhook")).toBe("en ai-native webhook");
  });
  test("udtaleFor: dansk får lydreglerne, engelsk får kun de fælles", () => {
    const da = udtaleFor("da");
    expect(da).toContainEqual({ word: "native", ipa: "ˈneɪtɪv" });
    expect(da).toContainEqual({ word: "AI", alias: "A I" });
    // Engelsk virker out-of-the-box (Christian 5/9): domæner, AI og webhook
    // er KUN danske regler — Andrew/Ava siger dem rigtigt selv.
    const en = udtaleFor("en");
    expect(en.find((r) => r.word === "native")).toBeUndefined();
    expect(en.find((r) => r.word === "broberg.ai")).toBeUndefined();
    expect(en.find((r) => r.word === "AI")).toBeUndefined();
    expect(en.find((r) => r.word === "webhook")).toBeUndefined();
  });
  test("en ændret udtale giver en NY lyd-nøgle (ellers serverer lageret den gamle lyd for evigt)", () => {
    expect(ordbogNoegle("da")).toMatch(/^[0-9a-f]{8}$/);
    expect(ordbogNoegle("da")).not.toBe(ordbogNoegle("en")); // forskellige ordbøger → forskellige nøgler
  });
  test("bruttolisten (5/9): domæner som navne, bøjede låneord, www. siges aldrig", () => {
    expect(tilTale("Se www.trailmem.com her")).toBe("Se trailmem.com her");
    const da = udtaleFor("da");
    expect(da).toContainEqual({ word: "trailmem.com", alias: "trail mem punktum com" });
    expect(da).toContainEqual({ word: "stylet", alias: "stajlet" });
    expect(da).toContainEqual({ word: "workflow", ipa: "ˈwɜːkfloʊ" });
    expect(da).toContainEqual({ word: "lens", ipa: "lɛnz" });
    // engelsk får domænerne men IKKE de danske bøjnings-lydord
    const en = udtaleFor("en");
    expect(en.find((r) => r.word === "stylet")).toBeUndefined();
    expect(en).toContainEqual({ word: "trailmem", alias: "trail mem" });
  });
  test("HTML-tags når ALDRIG stemmen — bæltet mod rå markup i felter (Christians fund 5/9)", () => {
    expect(tilTale("Grøn, <em>og alligevel i stykker</em>")).toBe("Grøn, og alligevel i stykker");
    expect(tilTale("tekst med <br> og <a href=\"/x\">link</a>")).toBe("tekst med og link");
  });
  test("[block:]-figurer og skillelinjer siges ikke", () => {
    const t = tilTale("Før.\n\n[block:min-figur]\n\n---\n\nEfter.");
    expect(t).not.toContain("block");
    expect(t).not.toContain("---");
    expect(t).toContain("Før.");
    expect(t).toContain("Efter.");
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
