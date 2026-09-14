import { describe, test as it, expect } from "bun:test";
import { talPaaDansk, talPoster } from "./tal-paa-dansk.ts";

/**
 * F019.8 — reglen der læser tal som danske ord.
 *
 * Prøverne er skrevet mod de tal der FAKTISK stod i de 59 artikler, ikke mod
 * en opdigtet talrække: 2026 tyve gange, 1.625, 4.841, 16.838, 195, 838.
 */
describe("talPaaDansk", () => {
  it("siger enerne først, som dansk gør", () => {
    expect(talPaaDansk(21)).toBe("enogtyve");
    expect(talPaaDansk(45)).toBe("femogfyrre");
    expect(talPaaDansk(38)).toBe("otteogtredive");
  });

  it("kender de runde tiere", () => {
    expect(talPaaDansk(20)).toBe("tyve");
    expect(talPaaDansk(40)).toBe("fyrre");
    expect(talPaaDansk(90)).toBe("halvfems");
  });

  it("læser hundreder med «et», ikke «en»", () => {
    expect(talPaaDansk(100)).toBe("et hundrede");
    expect(talPaaDansk(200)).toBe("to hundrede");
    expect(talPaaDansk(195)).toBe("et hundrede og femoghalvfems");
  });

  it("læser årstallet som et årstal, ikke som et antal", () => {
    // MÅLT med tvungen justering hos voice-engine: «hundrede» scorer -0,00 mod
    // klippet, og kontrollen knækker fra -0,02 til -11,54 på en lyd hvor ordet
    // ikke står. Varighed kan IKKE afgøre det — se advarslen i tal-paa-dansk.ts.
    //
    // «og» inde i tallet er STADIG uafklaret og står med vilje: sidder det i
    // aliasset uden at blive sagt, får justeringen et ord uden lyd; mangler
    // det, bliver ét lille ord ikke markeret — hvilket er dagens opførsel.
    expect(talPaaDansk(1995, "aarstal")).toBe("nitten hundrede og femoghalvfems");
    expect(talPaaDansk(1952, "aarstal")).toBe("nitten hundrede og tooghalvtreds");
    expect(talPaaDansk(2026, "aarstal")).toBe("to tusind og seksogtyve");
    expect(talPaaDansk(2007, "aarstal")).toBe("to tusind og syv");
    expect(talPaaDansk(2000, "aarstal")).toBe("to tusind");
  });

  it("er stadig et ANTAL når ingen beder om årstallet", () => {
    expect(talPaaDansk(1995)).toBe("et tusind ni hundrede og femoghalvfems");
  });

  it("binder «og» til det SIDSTE led, ikke til hundrederne", () => {
    // 1.625 stod i en artikel om automatiske tests.
    expect(talPaaDansk(1625)).toBe("et tusind seks hundrede og femogtyve");
    expect(talPaaDansk(4841)).toBe("fire tusind otte hundrede og enogfyrre");
    expect(talPaaDansk(16838)).toBe("seksten tusind otte hundrede og otteogtredive");
  });

  it("nægter det den ikke er målt på frem for at gætte", () => {
    expect(talPaaDansk(1_000_000)).toBeNull();
    expect(talPaaDansk(-5)).toBeNull();
    expect(talPaaDansk(3.14)).toBeNull();
  });
});

describe("talPoster", () => {
  it("skelner årstal fra antal på tusind-punktummet alene", () => {
    // Det er AFSENDEREN der afgør det, ikke et gæt på indholdet: dansk skriver
    // tusinder med punktum, så «1.995» er et antal og «1995» er et årstal.
    expect(talPoster("i 1995 blev det")).toEqual([
      { word: "1995", alias: "nitten hundrede og femoghalvfems" },
    ]);
    expect(talPoster("hele 1.995 gange")).toEqual([
      { word: "1.995", alias: "et tusind ni hundrede og femoghalvfems" },
    ]);
  });

  it("læser dansk tusind-punktum som tusinder, ikke som decimal", () => {
    // Fælden hele reglen findes for: 4.841 er fire tusind, ikke fire komma.
    expect(talPoster("en analyse af 4.841 artikler")).toEqual([
      { word: "4.841", alias: "fire tusind otte hundrede og enogfyrre" },
    ]);
  });

  it("tager hvert tal med én gang, uanset hvor tit det står", () => {
    const p = talPoster("I 2026 og igen i 2026 — og så 15 gange i 2026.");
    expect(p.map((x) => x.word).sort()).toEqual(["15", "2026"]);
  });

  it("lader ettallet være — det har to køn og tallet kan ikke vide hvilket", () => {
    // «median-deflektion på niveau 1» blev til «niveau en» i et prøveklip.
    // Dansk siger «niveau et». Teksten afgør kønnet, ikke tallet.
    expect(talPoster("på niveau 1 ligger den")).toEqual([]);
    expect(talPoster("niveau 1 og niveau 2").map((x) => x.word)).toEqual(["2"]);
  });

  it("holder fingrene fra et versionsnummer", () => {
    // «1.6.0» er ikke et tal reglen kan læse. Den skal lade den stå, ikke
    // hugge «1.6» ud af den og sige «et tusind seks hundrede».
    expect(talPoster("version 1.6.0 netop godkendt")).toEqual([]);
  });

  it("holder fingrene fra en engelsk decimal", () => {
    expect(talPoster("spent 38.6 hours running")).toEqual([]);
  });

  it("holder fingrene fra tal der sidder fast i et ord", () => {
    for (const t of ["en top-10-liste", "fts5 og nis2", "Sannes 2-årige uddannelse",
                     "de 30-41 %", "en 200-statuskode", "et 2024-studie"]) {
      expect(talPoster(t)).toEqual([]);
    }
  });

  it("finder tallet når det står for sig selv midt i en sætning", () => {
    expect(talPoster("havde 200 kunder i 2007.").map((x) => x.word)).toEqual(["200", "2007"]);
  });

  it("lader sætningens komma være, men ikke decimalkommaet", () => {
    // «grundlagt i 2007, omkring 15 aktive» stod i en artikel — kommaet efter
    // årstallet er tegnsætning. «3,14» er ét decimaltal og må ikke skæres over.
    expect(talPoster("grundlagt i 2007, omkring 15 aktive").map((x) => x.word)).toEqual(["2007", "15"]);
    expect(talPoster("cirka 3,14 gange")).toEqual([]);
  });
});
