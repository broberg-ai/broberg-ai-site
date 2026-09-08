/* F007.18 — udvælgelsen er funktionen, ikke visningen.
 *
 * En prøve på «der vises tre pills» består også hvis det er de samme tre på
 * hver eneste side. Derfor måler alt herunder FORSKELLEN: at en anden side
 * giver et andet sæt, og at en side man forlod stadig tæller.
 */
import { describe, it, expect, beforeEach } from "bun:test";
import {
  normaliser, rammer, laesRegler, vaelgPills, noterSide, laesSpor, SPOR_NOEGLE, SPOR_LOFT,
} from "./aidan-spor.ts";

/* Bun kører ikke i en browser, så lageret stilles op her. Stubben er IKKE det
   der prøves — det er vores egen håndtering ovenpå den: at samme side to gange
   i træk tælles én gang, at loftet beholder de nyeste, og at et ødelagt indhold
   giver «ingen rute» frem for at kaste. */
const lager = new Map<string, string>();
(globalThis as unknown as { sessionStorage: Storage }).sessionStorage = {
  getItem: (k: string) => lager.get(k) ?? null,
  setItem: (k: string, v: string) => void lager.set(k, v),
  removeItem: (k: string) => void lager.delete(k),
  clear: () => lager.clear(),
  key: (i: number) => [...lager.keys()][i] ?? null,
  get length() { return lager.size; },
} as Storage;

const R = laesRegler(`
/flagskibe/consulting, /flagskibe | Hvad koster et rådgivningsforløb?
/podcast | Hvornår kommer næste afsnit?
/kontakt | Book et møde
* | Hvad kan I bygge for mig?
* | Hvem står bag broberg.ai?
`);

describe("stier sammenlignes ens uanset sprog og skråstreg", () => {
  it("sprogpræfiks og efterstillet skråstreg er samme side", () => {
    expect(normaliser("/da/podcast/")).toBe("/podcast");
    expect(normaliser("/en/podcast")).toBe("/podcast");
    expect(normaliser("/podcast?utm=x#top")).toBe("/podcast");
    expect(normaliser("/")).toBe("/");
    expect(normaliser("/da")).toBe("/");
  });

  it("præfiks rammer kun på et helt segment", () => {
    expect(rammer("/flagskibe", "/flagskibe/consulting")).toBe(true);
    // Uden segment-kravet ville en regel om /flagskibe også ramme /flagskibet.
    expect(rammer("/flagskibe", "/flagskibet")).toBe(false);
  });

  it("en regel på forsiden er forsiden ALENE", () => {
    // Ellers ville «/» ramme hver eneste side og æde alle tre pladser.
    expect(rammer("/", "/")).toBe(true);
    expect(rammer("/", "/podcast")).toBe(false);
  });
});

describe("CMS-formatet", () => {
  it("ruter til venstre, tekst til højre", () => {
    expect(R[0]).toEqual({ ruter: ["/flagskibe/consulting", "/flagskibe"], tekst: "Hvad koster et rådgivningsforløb?" });
  });

  it("«*» betyder generel", () => {
    expect(R[3]).toEqual({ ruter: [], tekst: "Hvad kan I bygge for mig?" });
  });

  it("en bar sætning uden «|» er også en generel regel", () => {
    // En redaktør der bare skriver tre spørgsmål skal få noget der virker.
    expect(laesRegler("Hvad koster det?")).toEqual([{ ruter: [], tekst: "Hvad koster det?" }]);
  });

  it("en linje uden tekst kastes væk frem for at give en tom pill", () => {
    expect(laesRegler("/podcast |")).toEqual([]);
  });
});

describe("udvælgelsen — det er HER adaptiviteten enten findes eller ikke", () => {
  it("siden man er på kommer først", () => {
    expect(vaelgPills(R, "/podcast", ["/podcast"])[0]).toBe("Hvornår kommer næste afsnit?");
  });

  it("TO FORSKELLIGE sider giver TO FORSKELLIGE sæt", () => {
    // Kontrolprøven mod hele fejlformen: en implementering der bare returnerer
    // de tre første regler består alt det ovenstående og fejler her.
    const a = vaelgPills(R, "/podcast", ["/podcast"]);
    const b = vaelgPills(R, "/kontakt", ["/kontakt"]);
    expect(a).not.toEqual(b);
    expect(a[0]).not.toBe(b[0]);
  });

  it("en side man BESØGTE tidligere tæller stadig på en senere side", () => {
    // Christians egentlige krav: «samlet set ALLE de sider de har besøgt».
    const p = vaelgPills(R, "/kontakt", ["/flagskibe/consulting", "/kontakt"]);
    expect(p[0]).toBe("Book et møde");
    expect(p).toContain("Hvad koster et rådgivningsforløb?");
  });

  it("… og den rute-baserede slår de generelle", () => {
    const p = vaelgPills(R, "/kontakt", ["/podcast", "/kontakt"]);
    expect(p.slice(0, 2)).toEqual(["Book et møde", "Hvornår kommer næste afsnit?"]);
  });

  it("uden rute og uden match: kun de generelle", () => {
    expect(vaelgPills(R, "/ukendt-side", [])).toEqual([
      "Hvad kan I bygge for mig?",
      "Hvem står bag broberg.ai?",
    ]);
  });

  it("ingen regler → ingen pills (ship-dark, ikke en tom stribe)", () => {
    expect(vaelgPills([], "/podcast", ["/podcast"])).toEqual([]);
  });

  it("aldrig samme tekst to gange, og aldrig flere end der er bedt om", () => {
    const dubl = laesRegler("/a | Ens\n/b | Ens\n* | Ens\n* | Anden\n* | Tredje\n* | Fjerde");
    const p = vaelgPills(dubl, "/a", ["/b", "/a"]);
    expect(new Set(p).size).toBe(p.length);
    expect(p.length).toBe(3);
  });
});

describe("F007.19 — kortets krop vælges af de samme regler", () => {
  // Kortet tager ÉT svar, ikke tre. Prøven måler at det er det RIGTIGE ene.
  const H = laesRegler(`
/podcast | Du er ved podcasten — spørg mig om afsnittene.
/flagskibe | Du kigger på flagskibene. Skal jeg fortælle hvad de koster?
* | Jeg er Aidan. Hvordan kan jeg hjælpe dig?
`);

  it("siden man er på vinder", () => {
    expect(vaelgPills(H, "/podcast", ["/podcast"], 1)).toEqual([
      "Du er ved podcasten — spørg mig om afsnittene.",
    ]);
  });

  it("en anden side giver en ANDEN sætning", () => {
    // Kontrolprøven mod hele meldingen: «den skriver stadig kun Hej - jeg er Aidan».
    const a = vaelgPills(H, "/podcast", ["/podcast"], 1)[0];
    const b = vaelgPills(H, "/flagskibe", ["/flagskibe"], 1)[0];
    expect(a).not.toBe(b);
  });

  it("en side uden regel falder til den generelle — aldrig til ingenting", () => {
    expect(vaelgPills(H, "/en-side-uden-regel", [], 1)).toEqual([
      "Jeg er Aidan. Hvordan kan jeg hjælpe dig?",
    ]);
  });

  it("ingen regler → intet valgt, så den hidtidige tekst bliver stående", () => {
    expect(vaelgPills([], "/podcast", ["/podcast"], 1)).toEqual([]);
  });
});

describe("ruten gemmes", () => {
  beforeEach(() => sessionStorage.clear());

  it("noterer i rækkefølge", () => {
    noterSide("/");
    noterSide("/podcast");
    expect(laesSpor()).toEqual(["/", "/podcast"]);
  });

  it("en genindlæsning er ikke et nyt sidebesøg", () => {
    noterSide("/podcast");
    noterSide("/da/podcast/");
    expect(laesSpor()).toEqual(["/podcast"]);
  });

  it("loftet holder, og det er de NYESTE der overlever", () => {
    for (let i = 0; i < SPOR_LOFT + 5; i++) noterSide(`/s${i}`);
    const s = laesSpor();
    expect(s.length).toBe(SPOR_LOFT);
    expect(s[s.length - 1]).toBe(`/s${SPOR_LOFT + 4}`);
  });

  it("et ødelagt lager giver ingen rute frem for at kaste", () => {
    sessionStorage.setItem(SPOR_NOEGLE, "{ikke json");
    expect(laesSpor()).toEqual([]);
  });

  it("KONTROL: reglerne findes overhovedet, så prøverne ovenfor ikke måler på nul", () => {
    expect(R.length).toBe(5);
  });
});
