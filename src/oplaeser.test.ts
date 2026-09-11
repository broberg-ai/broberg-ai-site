/**
 * F019.6 — limen prøvet på en rigtig DOM med SYNTETISKE tidskoder.
 *
 * Tidskoderne er opdigtede med vilje: de lader mig ramme grænserne præcist —
 * nøjagtig på et ords start, midt inde i det, før det første — hvilket en
 * rigtig lydfil aldrig gør. Og de findes: Azures ord-tidskoder er blokeret på
 * en infrastruktur-beslutning, så en prøve der ventede på dem ville betyde at
 * limen først blev bevist efter den var rullet ud.
 *
 * INTET INDEKS ER TALT I HÅNDEN. Hvert forventet ord udledes af selve talen,
 * så prøven måler koden og ikke min hovedregning.
 */
import { describe, it, expect } from "bun:test";
// DOM'EN HOLDES INDE I FILEN, ikke sat på globalThis.
//
// Første udgave brugte @happy-dom/global-registrator, og den VÆLTEDE TO ANDRE
// PRØVEFILER: bun kører alle filer i én proces, så happy-doms `localStorage` og
// `sessionStorage` blev skrivebeskyttede egenskaber — og aidan-samtaler og
// aidan-spor, som stiller deres eget lager op, kastede «Attempted to assign to
// readonly property». Et vindue pr. fil rører ingen andres tilstand, og
// oplæseren tager alligevel sin rod som argument frem for at slå den op globalt.
import { Window } from "happy-dom";
import { lavMarkoer, lavRulning, tekststykker, tid, type Tegner, type Tidskoder } from "@/client/oplaeser.ts";
import type { Ord } from "@/markering.ts";

/** Artiklen som den STÅR PÅ SKÆRMEN — med markup, som en rigtig artikel. */
const ARTIKEL =
  '<p>Vi bygger <strong>AI-agenter</strong> der virker.</p>' +
  '<p>Det andet afsnit står her.</p>';

/** Talen som tilTale() ville lave den: markup væk, bindestreg væk. */
const TALE = "Vi bygger AI agenter der virker. Det andet afsnit står her.";

/** Ordene i talen med deres indeks — facit, udledt af strengen. */
function taleOrd(tale: string): { ord: string; fra: number }[] {
  const ud: { ord: string; fra: number }[] = [];
  for (const m of tale.matchAll(/\S+/g)) ud.push({ ord: m[0], fra: m.index! });
  return ud;
}

/** Ét ord pr. 500 ms, i talens egen rækkefølge. */
function syntetiske(tale: string, pr = 500): Ord[] {
  return taleOrd(tale).map((o, i) => ({
    fra: o.fra,
    laengde: o.ord.length,
    msFra: i * pr,
    msTil: i * pr + pr,
  }));
}

const vindue = new Window();
const dok = vindue.document as unknown as Document;

function artikel(html = ARTIKEL): HTMLElement {
  dok.body.innerHTML = `<div class="post-body">${html}</div>`;
  return dok.querySelector(".post-body") as HTMLElement;
}

const koder = (tale = TALE): Tidskoder => ({ tale, ord: syntetiske(tale) });

/** En tegner der husker hvad den blev bedt om — så prøven kan måle malingen
 *  uden en browser der har CSS Custom Highlight API. */
function optager(): Tegner & { kald: [string, string | null][] } {
  const kald: [string, string | null][] = [];
  return {
    kald,
    mal(navn, omr) {
      kald.push([navn, omr ? omr.toString() : null]);
    },
    ryd() {
      kald.push(["ryd", null]);
    },
  };
}

describe("det rigtige ord lyser", () => {
  it("hvert ord i talen peger på sit eget ord i artiklen", () => {
    const rod = artikel();
    const m = lavMarkoer(rod, koder(), null);
    const ord = taleOrd(TALE);
    for (let i = 0; i < ord.length; i++) {
      const r = m.ved(i * 500 + 10).ord;
      const forventet = ord[i]!.ord;
      // «AI agenter» i talen er «AI-agenter» på skærmen: bindestregen er
      // tilTale's, ikke artiklens. Sammenligningen sker derfor uden den.
      const set = (r?.toString() ?? "").replace(/[-‐-―]/g, "");
      expect(set).toBe(forventet.replace(/[-‐-―]/g, ""));
    }
  });

  it("FØR første ord lyser ingenting — oplæsningen er ikke begyndt", () => {
    const rod = artikel();
    const m = lavMarkoer(rod, koder(), null);
    expect(m.ved(0 - 1)).toEqual({ ord: null, saetning: null });
  });

  it("et ord i ANDET afsnit findes — ellers var afsnittene limet sammen", () => {
    // Uden separatoren mellem to tekstknuder bliver «virker.» og «Det» ét ord,
    // og alt efter det punkt skrider. Derfor måles netop det første ord efter
    // afsnitsskiftet.
    const rod = artikel();
    const m = lavMarkoer(rod, koder(), null);
    const i = taleOrd(TALE).findIndex((o) => o.ord === "Det");
    expect(i).toBeGreaterThan(0);
    expect(m.ved(i * 500 + 10).ord?.toString()).toBe("Det");
  });

  it("et ord der IKKE står i artiklen lyser ikke et vilkårligt sted", () => {
    const rod = artikel("<p>Noget helt andet.</p>");
    const m = lavMarkoer(rod, koder(), null);
    // Hele talen er fremmed for artiklen: intet må males frem for at male forkert.
    const fundne = taleOrd(TALE).map((_, i) => m.ved(i * 500 + 10).ord?.toString() ?? null);
    expect(fundne.filter((f) => f !== null && /^(bygger|agenter|afsnit)$/.test(f))).toEqual([]);
  });
});

describe("sætningen lyser som en hel sætning", () => {
  it("første sætning dækker sin egen linje og ikke den næste", () => {
    const rod = artikel();
    const m = lavMarkoer(rod, koder(), null);
    const s = m.ved(10).saetning?.toString() ?? "";
    expect(s.startsWith("Vi bygger")).toBe(true);
    expect(s.trimEnd().endsWith("virker.")).toBe(true);
    expect(s).not.toContain("andet");
  });

  it("sidste sætning er den ANDEN sætning, ikke den første", () => {
    const rod = artikel();
    const m = lavMarkoer(rod, koder(), null);
    const sidst = taleOrd(TALE).length - 1;
    const s = m.ved(sidst * 500 + 10).saetning?.toString() ?? "";
    expect(s).toContain("andet afsnit");
    expect(s).not.toContain("Vi bygger");
  });
});

describe("markeringen skriver ALDRIG i artiklen", () => {
  it("innerHTML er tegn-for-tegn den samme bagefter", () => {
    const rod = artikel();
    const foer = rod.innerHTML;
    const m = lavMarkoer(rod, koder(), optager());
    for (const [i] of taleOrd(TALE).entries()) m.ved(i * 500 + 10);
    m.ryd();
    expect(rod.innerHTML).toBe(foer);
  });
});

describe("tegneren får det den skal male", () => {
  it("begge lag males, sætningen før ordet", () => {
    const t = optager();
    const m = lavMarkoer(artikel(), koder(), t);
    m.ved(10);
    expect(t.kald.map(([n]) => n)).toEqual(["saetning", "ord"]);
    expect(t.kald[1]![1]).toBe("Vi");
  });

  it("der males IKKE igen midt inde i det samme ord", () => {
    const t = optager();
    const m = lavMarkoer(artikel(), koder(), t);
    m.ved(10);
    const efterFoerste = t.kald.length;
    m.ved(60);
    m.ved(120);
    expect(t.kald.length).toBe(efterFoerste);
    m.ved(510); // næste ord
    expect(t.kald.length).toBeGreaterThan(efterFoerste);
  });

  it("ryd rydder begge lag", () => {
    const t = optager();
    lavMarkoer(artikel(), koder(), t).ryd();
    expect(t.kald.at(-1)).toEqual(["ryd", null]);
  });
});

describe("tekststykker", () => {
  it("sætter et mellemrum ind mellem to knuder der ellers ville blive limet", () => {
    const rod = artikel();
    const flad = tekststykker(rod).map((s) => s.tekst).join("");
    expect(flad).not.toContain("virker.Det");
  });

  it("KONTROL: der sættes IKKE et mellemrum ind hvor der allerede er et", () => {
    // Uden denne ville «sæt altid et mellemrum ind» bestå prøven ovenfor — og
    // hvert eneste ordmellemrum i artiklen ville blive fordoblet.
    dok.body.innerHTML = "<div><p>Hej <b>du</b></p></div>";
    const flad = tekststykker(dok.querySelector("div")!).map((s) => s.tekst).join("");
    expect(flad).toBe("Hej du");
  });
});

describe("rulningen slipper når læseren selv ruller", () => {
  it("følger med indtil brugeren rører den, og kan startes igen", () => {
    const r = lavRulning();
    expect(r.maaRulle()).toBe(true);
    r.afbryd();
    expect(r.maaRulle()).toBe(false);
    r.nulstil();
    expect(r.maaRulle()).toBe(true);
  });

  it("lytter på brugerens egne handlinger, ikke på «scroll»", () => {
    // «scroll» udløses også af VORES egen rulning, og så kan de to ikke skelnes
    // — hele funktionen findes for den skelnen.
    expect(lavRulning().hændelser).not.toContain("scroll");
    expect(lavRulning().hændelser).toContain("wheel");
  });
});

describe("uret", () => {
  it("mm:ss, og noget uforståeligt bliver 0:00", () => {
    expect(tid(0)).toBe("0:00");
    expect(tid(65)).toBe("1:05");
    expect(tid(605)).toBe("10:05");
    expect(tid(Number.NaN)).toBe("0:00");
    expect(tid(-5)).toBe("0:00");
  });
});

/* ── malingen: den må ikke være pæn og ulæselig ──────────────────────────────
 *
 * Vi dumpede 4,5:1 én gang i forvejen (F013.3 — hvid tekst på brandorange gav
 * 3,45:1), og det blev opdaget ved at NOGEN KIGGEDE. Derfor måles parret her i
 * stedet: et kontrastkrav der kun står i en plan-doc er ikke et krav.
 */
import { readFileSync } from "node:fs";

const CSS = readFileSync(new URL("./styles/brand.css", import.meta.url).pathname, "utf-8");

function kontrast(a: string, b: string): number {
  const lum = (h: string) => {
    const n = h.replace("#", "");
    const k = [0, 2, 4].map((i) => {
      const c = parseInt(n.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * k[0]! + 0.7152 * k[1]! + 0.0722 * k[2]!;
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p) as [number, number];
  return (x + 0.05) / (y + 0.05);
}

/** Værdien af en token INDEN FOR én tema-blok — så de to temaer måles hver for sig. */
function token(blokStart: string, navn: string): string {
  const i = CSS.indexOf(blokStart);
  expect(i).toBeGreaterThan(-1);
  const blok = CSS.slice(i, CSS.indexOf("\n}", i));
  const m = blok.match(new RegExp(`${navn}:\\s*(#[0-9a-fA-F]{6})`));
  expect(m).not.toBeNull();
  return m![1]!;
}

describe("markeringen kan læses", () => {
  it("ordets farvepar holder 4,5:1 i BEGGE temaer", () => {
    for (const tema of [":root {", '[data-theme="light"] {']) {
      const flade = token(tema, "--oplaes-ord-flade");
      const tekst = token(tema, "--oplaes-ord-tekst");
      expect(kontrast(flade, tekst)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("begge lag males af CSS, ikke af et element i teksten", () => {
    expect(CSS).toContain("::highlight(oplaes-ord)");
    expect(CSS).toContain("::highlight(oplaes-saetning)");
  });
});
