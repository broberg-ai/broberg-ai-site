/**
 * F019.6 — en artikel der FINDES blev meldt som ikke-eksisterende.
 *
 * Christian med skærmbillede: knappen stod på «Kunne ikke hente oplæsningen» på
 * «Design i højere luftlag». Målt mod produktionen, begge former:
 *
 *   {"sti":"/indsigter/design-i-højere-luftlag"}        → 200
 *   {"sti":"/indsigter/design-i-h%C3%B8jere-luftlag"}   → 404 ikke_en_indsigt
 *
 * Den anden er dén browseren sender: klienten bruger location.pathname, og den
 * er procent-kodet. Facitlisten på serveren er det ikke.
 *
 * Fejlen ramte kun artikler med æ, ø eller å i adressen — 1 af 59 i dag, og
 * dermed netop den slags der ser ud som et tilfælde frem for en fejlklasse.
 */
import { describe, test, expect } from "bun:test";
import { normaliserSti } from "./aidan-laes.ts";

describe("stien fra browseren skal ramme facitlisten", () => {
  test("det ø browseren koder om, kommer tilbage som et ø", () => {
    expect(normaliserSti("/indsigter/design-i-h%C3%B8jere-luftlag")).toBe(
      "/indsigter/design-i-højere-luftlag",
    );
  });

  test("alle tre danske bogstaver, ikke kun det ene vi så", () => {
    for (const [kodet, klar] of [
      ["%C3%A6", "æ"],
      ["%C3%B8", "ø"],
      ["%C3%A5", "å"],
      ["%C3%86", "Æ"],
    ] as const) {
      expect(normaliserSti(`/x/${kodet}`)).toBe(`/x/${klar}`);
    }
  });

  test("en sti UDEN kodning er uændret — de 58 andre artikler må ikke røres", () => {
    expect(normaliserSti("/platform/chat-med-dit-website")).toBe("/platform/chat-med-dit-website");
  });

  test("en ugyldig %-sekvens vælter ikke ruten, den giver strengen tilbage", () => {
    // decodeURIComponent kaster på «%zz». Uden fangsten ville et vilkårligt
    // kald kunne give en 500 i stedet for et pænt 404.
    expect(normaliserSti("/x/%zz")).toBe("/x/%zz");
    expect(normaliserSti("/x/%")).toBe("/x/%");
  });
});

/* ── og at den er KOBLET PÅ opslaget ─────────────────────────────────────────
 *
 * Prøverne ovenfor måler hjælperen. De blev ALLE FIRE grønne da jeg fjernede
 * kaldet til den inde i opslaget — altså beviste de intet om fejlen Christian
 * så. Denne måler ruten.
 *
 * Skellet er de to 404'er: rammer opslaget forbi, svarer ruten «ikke_en_indsigt»
 * (artiklen findes ikke). Rammer den rigtigt, når den videre og svarer
 * «ingen_tidskoder» (artiklen findes, tidskoderne gør ikke). Det ene ord er
 * hele forskellen på den fejl vi rettede og ingen fejl.
 */
import { Hono } from "hono";
import { handleAidanTidskoder } from "./aidan-laes.ts";

const app = new Hono();
app.get("/t", handleAidanTidskoder);
const svar = (sti: string) => app.request(`/t?sti=${sti}&persona=aidan`);

describe("ruten slår op på den DEKODEDE sti", () => {
  test("en procent-kodet artikel genkendes som en artikel", async () => {
    const r = await svar("%2Findsigter%2Fdesign-i-h%25C3%25B8jere-luftlag");
    const j = (await r.json()) as { error?: string };
    // Den må IKKE være «ikke_en_indsigt» — det var præcis fejlen.
    expect(j.error).not.toBe("ikke_en_indsigt");
  });

  test("KONTROL: en sti der VIRKELIG ikke findes, meldes stadig som ukendt", async () => {
    // Uden denne ville «svar aldrig ikke_en_indsigt» bestå prøven ovenfor — og
    // så ville enhver vilkårlig sti blive læst højt.
    const r = await svar("%2Ffindes-slet-ikke-xyz");
    expect(((await r.json()) as { error?: string }).error).toBe("ikke_en_indsigt");
  });
});
