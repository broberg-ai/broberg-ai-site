import { describe, test as it, expect } from "bun:test";
import { aidanTilHtml } from "@/client/aidan-md.ts";

/**
 * F024.3 / AC#2 — «Aidan triagerer IKKE på et tilfældigt ord. Bevist i BEGGE
 * retninger — og det er den negative halvdel der er let at glemme.»
 *
 * Den var glemt. Der fandtes ingen prøve på markørens rendring overhovedet, så
 * hele triage-tilbuddet hvilede på at jeg havde set det virke én gang.
 *
 * HVORFOR DEN NEGATIVE RETNING ER DEN VIGTIGE: en boks der udebliver opdages
 * med det samme — brugeren får ikke sin sag. En boks der dukker op på et
 * almindeligt svar opdages aldrig af os; den lander som støj hos HelpDesk og
 * som forvirring hos et menneske der bare spurgte om en pris.
 */
const box = (s: string) => aidanTilHtml(s).includes('data-testid="aidan-sag"');

describe("triage-boksen kommer KUN på markøren", () => {
  it("markøren alene på sin linje giver boksen", () => {
    expect(box("Det kan jeg ikke hjælpe med.\n\n[sag]")).toBe(true);
  });

  it("boksen beder om NAVN og begge kontaktveje — ikke en bar knap", () => {
    const h = aidanTilHtml("[sag]");
    expect(h).toContain('data-testid="aidan-sag-navn"');
    expect(h).toContain('data-testid="aidan-sag-email"');
    expect(h).toContain('data-testid="aidan-sag-telefon"');
    expect(h).toContain('data-testid="aidan-sag-knap"');
  });

  it("«Opret uden mail» findes IKKE mere", () => {
    // Christian 17/9: samme krav som formularen. Knappen var rigtig dengang
    // alternativet var en TABT henvendelse — men en sag der ikke kan besvares
    // forstyrrer et menneske uden at kunne hjælpe nogen.
    expect(aidanTilHtml("[sag]")).not.toContain("aidan-sag-uden");
  });

  it("boksen SIGER hvorfor den spørger", () => {
    // Felterne alene er et krav uden en grund. Teksten er det der gør
    // forskellen på en formular og en forklaring.
    const h = aidanTilHtml("[sag]");
    expect(h).toContain("navn");
    expect(h).toContain("ellers kan vi ikke svare dig");
  });

  // ── den negative halvdel ────────────────────────────────────────────────
  it("et almindeligt svar giver INGEN boks", () => {
    expect(box("Vi bygger AI-native platforme. Hvad kan jeg ellers hjælpe med?")).toBe(false);
  });

  it("ordet nævnt MIDT i en sætning giver ingen boks", () => {
    expect(box("Du kan oprette en [sag] hvis du vil tale med et menneske.")).toBe(false);
  });

  it("et svar der HANDLER om support giver ingen boks af sig selv", () => {
    // Det farligste falske positive: Aidan forklarer supportprocessen, og
    // ordene omkring den udløser en boks.
    expect(box("Du kan skrive til support, så opretter vi en sag og vender tilbage.")).toBe(false);
  });

  it("markøren i en kodeblok giver ingen boks", () => {
    expect(box("Sådan ser markøren ud:\n\n```\n[sag]\n```")).toBe(false);
  });

  it("et link der ligner markøren giver ingen boks", () => {
    expect(box("[sag](https://broberg.ai/support)")).toBe(false);
  });
});
