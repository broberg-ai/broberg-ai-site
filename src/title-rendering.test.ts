// En titel er IKKE almindelig tekst mere.
//
// `posts.title` er et RICH, inline-redigerbart felt — artiklens <h1> bærer
// data-cms-html — så i det øjeblik nogen retter en overskrift på det live site,
// gemmes den som HTML: "Seletøjet, <em>ikke agenten</em>".
//
// Derfor har hver flade præcis to lovlige måder at vise en titel på:
//   titleToHtml(...) via dangerouslySetInnerHTML  — artiklen, hvor kursiven SKAL ses
//   stripHtml(...)                                — kortlister, faneblad, deling
//
// Den tredje mulighed — at binde titlen rå ind i JSX — ser rigtig ud, typechecker,
// og viser <em>ikke agenten</em> som bogstavelig tekst til læseren.
//
// DET SKETE 31/8-2026, og ikke ét sted men TRE: nyhedslisten (rapporteret af
// Christian), forsidens tre kort og tak-siden. De to sidste var latente — de
// venter bare på at en redigeret titel bliver trukket frem. Ingen prøve fangede
// det, fordi der ikke var nogen; og stripHtml lå som en privat kopi i routes.tsx
// hvor sections.tsx ikke kunne nå den, så forsidekortet KUNNE ikke gøre det
// rigtige uden først at flytte hjælperen.
//
// Prøven læser kilden frem for at rendere, fordi det er dét der gør den brugbar
// for FREMTIDIGE flader: en ny kortliste skrevet om et halvt år bliver fanget
// uden at nogen husker at skrive en prøve for netop den.

import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const FILES = ["routes.tsx", "components/sections.tsx", "components/FlagshipSlides.tsx", "components/SolutionPage.tsx"];
const srcPath = (f: string) => new URL(`./${f}`, import.meta.url).pathname;

// Udtryk der ER en titel, men ikke en POST-titel. Hver har en grund, og
// grunden er den samme i alle tilfælde: feltet er markeret med cmsAttrs
// (almindeligt felt) eller hardkodet, og editoren gemmer almindelige felter
// som ren tekst. De kan altså aldrig komme til at indeholde markup.
const IKKE_POST_TITLER: Record<string, string> = {
  title: "steps/features-tupler på landing + SolutionPage — almindelige cmsAttrs-felter",
  "group.title": "site-indeksets gruppeoverskrift — hardkodet i siteIndexGroups",
  "t.title": "blok-overskrift i Method — almindeligt cmsAttrs-felt",
  "c.title": "case-overskrift — almindeligt cmsAttrs-felt",
  "b.title": "flagskib-slide — almindeligt cmsAttrs-felt",
  "item.title": "SolutionPage proof-punkt — almindeligt cmsAttrs-felt",
};

/** JSX-tekstpositioner: `>{ ... }<` — et udtryk der bliver til synlig tekst. */
function jsxTextExpressions(src: string): { expr: string; line: number }[] {
  const out: { expr: string; line: number }[] = [];
  const re = />\{([^{}]+)\}</g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) out.push({ expr: m[1]!.trim(), line: src.slice(0, m.index).split("\n").length });
  return out;
}

const looksLikeTitle = (e: string) => /(^|[.\s(])title\b/i.test(e) || /\btitle\s*\)/.test(e);
const isSafe = (e: string) => e.includes("stripHtml") || e.includes("titleToHtml");

test("ingen post-titel bindes rå ind i JSX", () => {
  const offenders: string[] = [];
  for (const f of FILES) {
    const src = readFileSync(srcPath(f), "utf-8");
    for (const { expr, line } of jsxTextExpressions(src)) {
      if (!looksLikeTitle(expr) || isSafe(expr) || expr in IKKE_POST_TITLER) continue;
      offenders.push(`  ${f}:${line}  {${expr}}`);
    }
  }
  expect(offenders.join("\n")).toBe("");
});

test("hver undtagelse findes stadig i kilden — en forældet undtagelse skjuler en fejl", () => {
  const alle = FILES.flatMap((f) => jsxTextExpressions(readFileSync(srcPath(f), "utf-8")).map((x) => x.expr));
  const forældede = Object.keys(IKKE_POST_TITLER).filter((k) => !alle.includes(k));
  expect(forældede.join(", ")).toBe("");
});

test("prøven kan faktisk se en rå titel (negativ kontrol)", () => {
  // Uden denne ville prøven ovenfor bestå selv hvis mønsteret aldrig matchede
  // noget som helst — en grøn prøve der ikke måler noget.
  const raa = jsxTextExpressions(`<h3>{n.title}</h3>`).filter((x) => looksLikeTitle(x.expr) && !isSafe(x.expr));
  expect(raa.map((x) => x.expr)).toEqual(["n.title"]);

  const rettet = jsxTextExpressions(`<h3>{stripHtml(n.title)}</h3>`).filter((x) => looksLikeTitle(x.expr) && !isSafe(x.expr));
  expect(rettet.length).toBe(0);
});
