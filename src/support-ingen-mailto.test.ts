import { describe, test as it, expect } from "bun:test";
import { renderToString } from "preact-render-to-string";
import { Support } from "@/components/Support.tsx";

/**
 * F024.2 / AC#2 — INGEN mailto-links i supportfladen.
 *
 * HVORFOR DET ER ET KRAV OG IKKE EN SMAGSSAG: en mailto er en blindgyde. Der
 * oprettes ingen sag, der kommer ingen reference, brevet lander i en indbakke
 * ingen holder øje med, og den besøgende tror hun har rakt ud. Det er præcis
 * det udfald hele F024 findes for at fjerne — og det ser ud som en hjælpsom
 * genvej lige indtil nogen bruger den.
 *
 * VAGTEN MÅLER DEN RENDEREDE FLADE, ikke kildeteksten. En mailto kan snige sig
 * ind gennem en CMS-værdi eller et mellemled som en tekstsøgning i denne mappe
 * aldrig ser. Målt på produktionen samme dag: /support havde 0.
 */
const render = (felter: Record<string, string> = {}) =>
  renderToString(Support({ data: { felter }, locale: "da" }) as never);

describe("supportfladen er ikke en blindgyde", () => {
  it("renderer uden et eneste mailto-link", () => {
    expect(render()).not.toContain("mailto:");
  });

  it("heller ikke når teksterne kommer fra CMS", () => {
    // En redaktør kan skrive hvad som helst i et felt. Vagten skal se DET
    // resultat, ikke den kode vi selv har skrevet.
    const h = render({ lead: "Skriv til os", emailNote: "Vi vender tilbage" });
    expect(h).not.toContain("mailto:");
  });

  it("VAGTEN KAN FEJLE: en mailto i en CMS-værdi fanges", () => {
    // Uden denne kontrol ville de to ovenfor bestå på en vagt der ikke kunne
    // se noget som helst — en søgning der aldrig finder er ikke en vagt.
    const h = render({ lead: '<a href="mailto:hej@broberg.ai">skriv</a>' });
    expect(h).toContain("mailto:");
  });

  it("formularen sender til VORES rute, så en henvendelse bliver til en sag", () => {
    const h = render();
    expect(h).toContain('data-testid="support-submit"');
    expect(h).toContain('id="support-form"');
  });
});
