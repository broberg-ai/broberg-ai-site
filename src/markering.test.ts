/**
 * F019.3 — markerings-motoren.
 *
 * Den kan prøves FULDT UD uden lyd og uden at vi har tidskoder endnu, og det er
 * hele grunden til at den er ren logik. Syntetiske tidskoder er her ikke en
 * nødløsning: de lader mig ramme grænserne præcist — nøjagtig på msFra, ét
 * millisekund før, midt i en pause — hvilket en rigtig lydfil ikke gør.
 */
import { describe, it, expect } from "bun:test";
import { findOrd, findSaetning, markeringVed, saetningerFra, type Ord } from "@/markering.ts";

/** «Hej med dig. Farvel.» — tre ord, en pause, og et fjerde. */
const ORD: Ord[] = [
  { fra: 0, laengde: 3, msFra: 0, msTil: 300 },     // Hej
  { fra: 4, laengde: 3, msFra: 300, msTil: 600 },   // med
  { fra: 8, laengde: 3, msFra: 600, msTil: 900 },   // dig
  // pause 900–1500 (punktum)
  { fra: 13, laengde: 6, msFra: 1500, msTil: 2100 }, // Farvel
];

describe("hvilket ord lyder nu", () => {
  it("FØR første ord lyder der intet", () => {
    // At tænde det første ord ville love at oplæsningen var i gang.
    expect(findOrd(ORD, -1)).toBeNull();
    expect(findOrd([{ fra: 0, laengde: 3, msFra: 500, msTil: 800 }], 499)).toBeNull();
  });

  it("præcis PÅ et ords starttidspunkt er det dét ord", () => {
    // Klassisk off-by-one i et binært opslag: grænsen hører til det NYE ord.
    expect(findOrd(ORD, 0)).toBe(0);
    expect(findOrd(ORD, 300)).toBe(1);
    expect(findOrd(ORD, 600)).toBe(2);
    expect(findOrd(ORD, 1500)).toBe(3);
  });

  it("ét millisekund før et skift er det stadig det forrige", () => {
    expect(findOrd(ORD, 299)).toBe(0);
    expect(findOrd(ORD, 599)).toBe(1);
    expect(findOrd(ORD, 1499)).toBe(2);
  });

  it("I EN PAUSE bliver det forrige ord liggende", () => {
    // Slukkede vi i stilheden, ville markeringen blinke ved hvert komma.
    expect(findOrd(ORD, 1000)).toBe(2);
    expect(findOrd(ORD, 1400)).toBe(2);
  });

  it("efter sidste ord bliver det sidste liggende", () => {
    expect(findOrd(ORD, 2100)).toBe(3);
    expect(findOrd(ORD, 99_999)).toBe(3);
  });

  it("OPSLAGET ER TILSTANDSLØST — at spole tilbage giver samme svar", () => {
    // Et lineært opslag der husker hvor det slap er forkert i samme sekund
    // nogen trækker i søgefeltet, og det er en fejl der kun opstår når
    // brugeren gør noget.
    const frem = [0, 300, 600, 1500].map((t) => findOrd(ORD, t));
    const tilbage = [1500, 600, 300, 0].map((t) => findOrd(ORD, t)).reverse();
    expect(tilbage).toEqual(frem);
  });

  it("KONTROL: ingen ord giver null, ikke et nedbrud", () => {
    expect(findOrd([], 500)).toBeNull();
  });
});

describe("hvilken sætning rummer ordet", () => {
  const S = [{ fra: 0, til: 13 }, { fra: 13, til: 20 }];

  it("finder den rigtige, også på grænsen", () => {
    expect(findSaetning(S, 0)).toBe(0);
    expect(findSaetning(S, 12)).toBe(0);
    expect(findSaetning(S, 13)).toBe(1); // halvåbent: til hører til den næste
    expect(findSaetning(S, 19)).toBe(1);
  });

  it("KONTROL: uden for alle sætninger giver null", () => {
    expect(findSaetning(S, 20)).toBeNull();
    expect(findSaetning(S, -1)).toBeNull();
    expect(findSaetning([], 5)).toBeNull();
  });
});

describe("markeringen samlet", () => {
  const S = saetningerFra("Hej med dig. Farvel.");

  it("giver både ordets og sætningens interval", () => {
    const m = markeringVed(ORD, S, 700);
    expect(m.ord).toEqual({ fra: 8, til: 11 });
    expect(m.saetning?.fra).toBe(0);
  });

  it("følger med over i næste sætning", () => {
    const m = markeringVed(ORD, S, 1600);
    expect(m.ord).toEqual({ fra: 13, til: 19 });
    expect(m.saetning?.fra).toBe(13);
  });

  it("KONTROL: før starten er BEGGE null", () => {
    // Halv markering ville tænde en sætning uden et ord i den.
    expect(markeringVed(ORD, S, -5)).toEqual({ ord: null, saetning: null });
  });

  it("et ord uden sætning giver stadig ordet", () => {
    // Får vi ikke sætninger fra Azure, skal oplæseren stadig virke.
    const m = markeringVed(ORD, [], 700);
    expect(m.ord).toEqual({ fra: 8, til: 11 });
    expect(m.saetning).toBeNull();
  });
});

describe("sætningsopdeling på dansk", () => {
  const tekster = (s: string) => saetningerFra(s).map((i) => s.slice(i.fra, i.til).trim());

  it("deler ved punktum, udråb og spørgsmål", () => {
    expect(tekster("Hej. Dav! Hvad så?")).toEqual(["Hej.", "Dav!", "Hvad så?"]);
  });

  it("«f.eks.» DELER IKKE en sætning", () => {
    // Den her er grunden til at funktionen findes. Et naivt split giver
    // sætninger midt i en sætning, og markeringen springer et sted hen hvor
    // ingen kan se hvorfor.
    expect(tekster("Vi bruger f.eks. agenter til det. Og det virker."))
      .toEqual(["Vi bruger f.eks. agenter til det.", "Og det virker."]);
  });

  it("flere forkortelser deler heller ikke", () => {
    for (const f of ["bl.a.", "dvs.", "ca.", "osv.", "pga.", "inkl."]) {
      const s = `Det gælder ${f} her i huset. Punktum.`;
      expect(tekster(s).length).toBe(2);
    }
  });

  it("et tal med punktum er ikke to sætninger", () => {
    expect(tekster("Det koster 3.000 kroner. Ikke mere.")).toEqual([
      "Det koster 3.000 kroner.",
      "Ikke mere.",
    ]);
  });

  it("linjeskift deler også — en overskrift er sin egen sætning", () => {
    expect(tekster("Overskriften\nFørste sætning.").length).toBe(2);
  });

  it("KONTROL: intervallerne dækker HELE talen uden huller og uden overlap", () => {
    // Et hul betyder at et ord kan falde imellem og aldrig få en sætning;
    // et overlap betyder at to sætninger lyser på én gang.
    const s = "Vi bruger f.eks. agenter. Det koster 3.000 kroner! Virker det?\nJa.";
    const iv = saetningerFra(s);
    expect(iv[0]!.fra).toBe(0);
    for (let i = 1; i < iv.length; i++) expect(iv[i]!.fra).toBe(iv[i - 1]!.til);
    expect(iv[iv.length - 1]!.til).toBe(s.length);
  });

  it("KONTROL: tom tekst giver ingen sætninger, ikke én tom", () => {
    expect(saetningerFra("")).toEqual([]);
    expect(saetningerFra("   \n  ")).toEqual([]);
  });
});
