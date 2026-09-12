/**
 * F019.7 — modtageren må ikke tage imod tidskoder der hører til en ANDEN tekst.
 *
 * Det er ikke en formalitet. Tidskoder er tegnpositioner i et bestemt
 * manuskript: passer de ikke, peger hver eneste af dem et forkert sted hen, og
 * resultatet er ikke en fejl på skærmen — det er en markering der roligt lyser
 * det forkerte ord mens lyden siger noget andet. Ingen ser det, fordi begge
 * dele ser rigtige ud hver for sig.
 *
 * Omsætningen prøves derfor DIREKTE, uden HTTP: det er dér dommen falder.
 */
import { describe, test, expect } from "bun:test";
import { omsaetTidskoder, type RaaTidskode } from "./aidan-laes.ts";

const TALE = "Chat med dit website. Vi bygger på broberg.ai i dag.";
/** Facit udledt AF strengen — aldrig talt i hånden. */
const kode = (ord: string, sek: number): RaaTidskode => ({
  word: ord,
  offset: TALE.indexOf(ord),
  start: sek,
  end: sek + 0.2,
  spoken: 1,
});

describe("tidskoder der passer", () => {
  test("bliver til vores eget format, med tegn og millisekunder", () => {
    const ud = omsaetTidskoder(TALE, [kode("Chat", 0.22), kode("bygger", 1.5)]);
    expect(ud).toEqual({
      ord: [
        { fra: 0, laengde: 4, msFra: 220, msTil: 420 },
        { fra: TALE.indexOf("bygger"), laengde: 6, msFra: 1500, msTil: 1700 },
      ],
    });
  });
});

describe("tidskoder der IKKE passer bliver afvist — med en sætning man kan handle på", () => {
  test("et ord der ikke står på sin påståede plads", () => {
    const forkert: RaaTidskode = { word: "bygger", offset: 0, start: 1, end: 1.2 };
    const ud = omsaetTidskoder(TALE, [forkert]) as { fejl: string };
    expect(ud.fejl).toContain("«bygger»");
    expect(ud.fejl).toContain("ANDEN tekst");
  });

  test("tiden går baglæns — to spænd der overlapper bagud", () => {
    const ud = omsaetTidskoder(TALE, [kode("bygger", 2), kode("Chat", 1)]) as { fejl: string };
    expect(ud.fejl).toContain("BAGLÆNS");
  });

  test("et spænd der slutter før det begynder", () => {
    const ud = omsaetTidskoder(TALE, [{ word: "Chat", offset: 0, start: 2, end: 1 }]) as { fejl: string };
    expect(ud.fejl).toContain("ugyldigt tidsspænd");
  });

  test("en tom liste er ikke et gyldigt svar", () => {
    expect(omsaetTidskoder(TALE, [])).toEqual({ fejl: "tom liste" });
  });

  test("KONTROL: en liste hvor ALT passer bliver ikke afvist", () => {
    // Uden denne ville «afvis altid» bestå de fire prøver ovenfor.
    const ud = omsaetTidskoder(TALE, [kode("Chat", 0), kode("med", 0.5), kode("website", 1)]);
    expect("fejl" in ud).toBe(false);
  });
});

describe("det lange alias — hele det SKREVNE ord markeres", () => {
  test("«broberg.ai» siges som fire ord, men lyser som ét", () => {
    // spoken: 4 betyder at spændet dækker fire talte ord. Markeringen skal
    // stadig dække hele det skrevne ord, ikke et bogstav af det.
    const ud = omsaetTidskoder(TALE, [
      { word: "broberg.ai", offset: TALE.indexOf("broberg.ai"), start: 3, end: 4.4, spoken: 4 },
    ]) as { ord: { fra: number; laengde: number }[] };
    expect(ud.ord[0]!.laengde).toBe("broberg.ai".length);
  });
});
