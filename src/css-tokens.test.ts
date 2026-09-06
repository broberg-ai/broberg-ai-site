// Et var(--navn) der ikke findes fejler TAVST.
//
// Browseren kaster ingen fejl; egenskaben falder tilbage til arvet eller
// initial værdi. Skrev jeg `color: var(--primary)` i et tema hvor farven hedder
// `--blue`, blev linkene sorte i stedet for blå — og siden så "færdig" ud.
// Ingen build fejlede, ingen test var rød, og gate:text og gate:testids kigger
// ikke på CSS.
//
// Fundet 31/8-2026 ved at SE på et skærmbillede og undre mig over farven. Det
// er ikke en holdbar detektor, så den ligger her i stedet.

import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const RAA = readFileSync(new URL("./styles/brand.css", import.meta.url).pathname, "utf-8");

/**
 * KOMMENTARER UD FØRST. Uden dette skridt gør netop den kommentar der
 * FORKLARER reglen prøven rød — teksten «hjemmestrikkede sit eget med
 * var(--primary)» er en beskrivelse, ikke en deklaration. Målt: prøven fyrede
 * på sin egen begrundelse ved første kørsel.
 *
 * Samme fælde som deploy-vagten i .claude/hooks (den blokerede sin egen
 * plan-doc) og som mailto-vagten på fd-sundhed. Et værktøj der læser kildetekst
 * skal skelne KODE fra OMTALE af kode, ellers straffer det den der skriver ned
 * hvorfor reglen findes.
 */
const CSS = RAA.replace(/\/\*[\s\S]*?\*\//g, "");

/** Variabler temaet SELV definerer: `--navn:` i en deklaration. */
function definerede(css: string): Set<string> {
  return new Set([...css.matchAll(/(^|[;{\s])(--[A-Za-z0-9_-]+)\s*:/g)].map((m) => m[2]!));
}
/** Variabler der BRUGES: var(--navn) — med eller uden fallback. */
function brugte(css: string): { navn: string; harFallback: boolean }[] {
  return [...css.matchAll(/var\(\s*(--[A-Za-z0-9_-]+)\s*(,)?/g)].map((m) => ({
    navn: m[1]!,
    harFallback: Boolean(m[2]),
  }));
}

test("hver var(--x) uden fallback peger på en variabel temaet definerer", () => {
  const def = definerede(CSS);
  const ukendte = [...new Set(brugte(CSS).filter((b) => !b.harFallback && !def.has(b.navn)).map((b) => b.navn))];
  expect(ukendte.join(", ")).toBe("");
});

test("prøven kan faktisk se en ukendt variabel (negativ kontrol)", () => {
  // Uden denne ville prøven ovenfor bestå selv hvis regex'en aldrig matchede
  // noget — en grøn prøve der ikke måler noget.
  const fake = ":root{--blue:#00b2ff}\n.x{color:var(--findes-ikke)}";
  const def = definerede(fake);
  const ukendte = brugte(fake).filter((b) => !b.harFallback && !def.has(b.navn)).map((b) => b.navn);
  expect(ukendte).toEqual(["--findes-ikke"]);
  // ...og at en KENDT variabel ikke rapporteres
  expect(brugte(":root{--blue:#00b2ff}\n.x{color:var(--blue)}").filter((b) => !definerede(":root{--blue:#00b2ff}").has(b.navn))).toEqual([]);
});

test("en var() MED fallback er lovlig selv hvis navnet er ukendt", () => {
  const fake = ".x{color:var(--maaske, #000)}";
  const ukendte = brugte(fake).filter((b) => !b.harFallback && !definerede(fake).has(b.navn));
  expect(ukendte).toEqual([]);
});

test("en variabel der kun NÆVNES i en kommentar tæller ikke", () => {
  // Den kontrol der gør kommentar-strippingen ægte frem for en påstand.
  const medKommentar = ":root{--blue:#00b2ff}\n/* vi brugte engang var(--vaek) her */\n.x{color:var(--blue)}";
  const uden = medKommentar.replace(/\/\*[\s\S]*?\*\//g, "");
  const ukendte = brugte(uden).filter((b) => !b.harFallback && !definerede(uden).has(b.navn)).map((b) => b.navn);
  expect(ukendte).toEqual([]);
  // ...og at den SAMME tekst UDEN stripping ville have fejlet — ellers beviser prøven intet
  const ukendteRaa = brugte(medKommentar).filter((b) => !b.harFallback && !definerede(medKommentar).has(b.navn)).map((b) => b.navn);
  expect(ukendteRaa).toEqual(["--vaek"]);
});

// ── Kontrast på TEKST-tokens ───────────────────────────────────────────────
//
// Farverne blev målt op til WCAG AA 6/9-2026 (blå tekst stod på 3,06:1 i lyst
// tema, orange på 4,47:1). Et tal som 4,47 er farligt netop fordi det SER
// rigtigt ud — det er 0,03 fra kravet, og ingen opdager forskellen ved at
// kigge. Derfor regnes det her i stedet for at blive husket.
//
// Kun TEKST-tokens. --blue og --orange er grafik (streger, planeter, glow) og
// har med vilje ikke et kontrastkrav; en regel der også omfattede dem ville
// tvinge brandfarven mørkere for at bestå en test der ikke gælder den.

/** WCAG 2.1 relativ luminans. */
function luminans(hex: string): number {
  const h = hex.replace("#", "");
  const kanal = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = [0, 2, 4].map((i) => kanal(parseInt(h.slice(i, i + 2), 16)));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
function kontrast(a: string, b: string): number {
  const [x, y] = [luminans(a), luminans(b)];
  return (Math.max(x!, y!) + 0.05) / (Math.min(x!, y!) + 0.05);
}
/** Værdien af et token inde i en bestemt regel-blok. */
function token(blok: string, navn: string): string {
  const b = CSS.slice(CSS.indexOf(blok));
  const m = b.slice(0, b.indexOf("}")).match(new RegExp(`${navn}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`fandt ikke ${navn} i ${blok}`);
  return m[1]!;
}

test("tekst-tokens klarer WCAG AA (4,5:1) mod deres eget temas baggrund", () => {
  const sager = [
    { tema: ":root {", navn: "--blue-text", bg: "#23282f", som: "mørkt" },
    { tema: ":root {", navn: "--orange-text", bg: "#23282f", som: "mørkt" },
    { tema: '[data-theme="light"] {', navn: "--blue-text", bg: "#f5f7fa", som: "lyst" },
    { tema: '[data-theme="light"] {', navn: "--orange-text", bg: "#f5f7fa", som: "lyst" },
  ];
  for (const s of sager) {
    const farve = token(s.tema, s.navn);
    const r = kontrast(farve, s.bg);
    // Meldingen bærer BEGGE tal, så en rød kørsel siger hvad der skal rettes
    // til — ikke bare at noget er galt.
    expect(`${s.navn} ${s.som} ${farve}: ${r.toFixed(2)}:1`).toBe(
      `${s.navn} ${s.som} ${farve}: ${Math.max(r, 4.5).toFixed(2)}:1`,
    );
  }
});

test(".lead viser linjeskift som redaktøren skriver dem i CMS'et", () => {
  // Uden white-space:pre-line kollapser browseren et linjeskift til et
  // mellemrum, og så kan Christian ikke styre sine egne afsnit uden at en
  // agent ændrer koden. Reglen er hele mekanismen bag det.
  const blok = CSS.slice(CSS.indexOf(".lead {"));
  expect(blok.slice(0, blok.indexOf("}"))).toContain("white-space: pre-line");
});
