import { describe, test as it, expect } from "bun:test";
import { pickNewsIllustration, hasIllustration } from "./Illustrations.tsx";

/**
 * To artikler må ikke ende med den samme tegning når de handler om vidt
 * forskellige ting.
 *
 * Uden en bespoke tegning hash-vælger pickNewsIllustration() ét af de 12
 * flagskibe som staffage. Det er med vilje — men to slugs KAN ramme samme tal,
 * og 6/9-2026 gjorde præcis disse to det: «Grøn, og alligevel i stykker» og
 * «Tre arkitekturer for agent-hukommelse» fik begge buddys radar-motiv. Den
 * passer på den første (den handler om at SE efter noget der ser grønt ud) og
 * på ingen måde på den anden.
 *
 * Kollisioner kan ikke undgås generelt — 12 tegninger skal dække alle artikler.
 * Det der kan sikres er at en artikel VI har tegnet til, beholder sin egen.
 */
describe("valg af artikel-illustration", () => {
  it("hukommelses-artiklen har sin egen tegning, på begge sprog", () => {
    for (const slug of ["tre-arkitekturer-agent-hukommelse", "three-architectures-of-agent-memory"]) {
      expect(hasIllustration(slug)).toBe(true);
      expect(pickNewsIllustration(slug)).toBe(slug);
    }
  });

  it("de to artikler der kolliderede deler den ikke længere", () => {
    expect(pickNewsIllustration("tre-arkitekturer-agent-hukommelse"))
      .not.toBe(pickNewsIllustration("groen-og-alligevel-i-stykker"));
  });

  it("en bespoke tegning bliver ALDRIG staffage for en fremmed artikel", () => {
    // 400 opdigtede slugs må aldrig hash-ramme en artikel-specifik tegning
    for (let i = 0; i < 400; i++) {
      const valgt = pickNewsIllustration(`en-tilfaeldig-artikel-nr-${i}`);
      expect(valgt).not.toBe("tre-arkitekturer-agent-hukommelse");
      expect(valgt).not.toBe("bi-dashboards-fra-bunden");
      expect(valgt).not.toBe("chatgpt-annoncer");
    }
  });

  it("en artikel uden egen tegning får stadig én — aldrig ingenting", () => {
    for (const s of ["", "x", "en-helt-ny-artikel-vi-ikke-har-tegnet-til"]) {
      expect(hasIllustration(pickNewsIllustration(s))).toBe(true);
    }
  });
});
