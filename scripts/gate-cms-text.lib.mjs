/**
 * Gate D's målende dele, skilt ud så de kan prøves uden netværk.
 *
 * Porten selv (gate-cms-text.mjs) henter globals og kalder herind. Delingen
 * kom 8/9-2026 fordi porten stod RØD på fire felter der alle fandtes i CMS'et
 * — to blinde vinkler, og ingen af dem kunne findes uden en prøve på
 * scanneren.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

// Kommentarer ud først: en kommentar der FORKLARER mønsteret er ikke et kald.
export const afKommentarer = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

export function filer(dir, ud = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) filer(p, ud);
    else if ([".ts", ".tsx"].includes(extname(p)) && !p.endsWith(".test.ts")) ud.push(p);
  }
  return ud;
}

/** Er reserveteksten den TOMME streng? Så er der ingen tekst i koden at flytte.
 *  `g("aidanHilsenSide", "")` er et valgfrit felt der er slukket — ikke en
 *  tekst der bor det forkerte sted. Porten meldte det som en overtrædelse. */
export function tomReserve(udtryk) {
  const s = udtryk.trim();
  return s === '""' || s === "''" || s === "``";
}

/** `g("felt", …)` — feltnavne der har en reservetekst i koden. */
export function scanKilde(src) {
  const ud = [];
  // Feltnavnet maa IKKE begraenses til et taegn-saet: foerste udgave tillod kun
  // [A-Za-z0-9_.], saa et navn med bindestreg var USYNLIGT for porten — og
  // mutationstesten gik groen med fejlen indsat. Fanget af netop den test.
  for (const m of afKommentarer(src).matchAll(/\bg\(\s*(["'`])([^"'`]+)\1\s*,\s*([^)]*)/g)) {
    if (tomReserve(m[3])) continue;
    ud.push(m[2]);
  }
  return ud;
}

export function felterMedReservetekst(rod = "src") {
  const fundet = new Map();
  for (const f of filer(rod)) {
    for (const navn of scanKilde(readFileSync(f, "utf-8"))) {
      if (!fundet.has(navn)) fundet.set(navn, f);
    }
  }
  return fundet;
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Findes værdien — og er den udfyldt? */
function udfyldt(v) {
  return typeof v === "string" && v.trim() !== "";
}

/**
 * Hvilke felter findes IKKE i CMS'et?
 *
 * Et navn bygget af en skabelon (`podcastTrin${n}Titel`) kan ikke slås op:
 * scanneren ser KILDETEKSTEN, ikke det navn der bliver bygget ved kørsel.
 * Porten meldte derfor femten eksisterende felter som manglende under ét
 * opdigtet navn. Her kræves i stedet at FAMILIEN findes — mindst én rigtig
 * nøgle med samme for- og bagstykke og en udfyldt værdi.
 */
export function manglendeFelter(felter, data) {
  const noegler = Object.keys(data ?? {});
  return [...felter].filter(([navn]) => {
    if (navn.includes("${")) {
      const m = new RegExp("^" + navn.split(/\$\{[^}]*\}/).map(esc).join(".+") + "$");
      return !noegler.some((k) => m.test(k) && udfyldt(data[k]));
    }
    const v = navn.split(".").reduce((o, k) => (o == null ? undefined : o[k]), data);
    return !udfyldt(v);
  });
}

/* ------------------------------------------------------------------------- *
 * F016.9 — sprog-paritet på de primede chat-spørgsmål.
 *
 * Gate D læste kun `globals`. Den kunne strukturelt ikke se `en-globals`, og
 * derfor heller ikke se at de to drev fra hinanden: F016.6 skrev 145 linjer i
 * det danske dokument, det engelske stod med 17 i fire dage, og INTET sagde
 * fra. En engelsk side viste stadig tre pæne generelle forslag — den grønne
 * retning er den tavse retning, igen.
 *
 * Ruterne KAN ikke sammenlignes direkte (/flagskibe vs /flagships), og en
 * oversættelsestabel ville selv drive. Så det der måles er STRUKTUREN: lige
 * mange ruter, og nok spørgsmål på hver til at udvælgelsen har noget at vælge
 * imellem.
 * ------------------------------------------------------------------------- */

/** «/rute | spørgsmål» → Map(rute → antal). Tomme og ugyldige linjer ignoreres. */
export function ruteAntal(pills) {
  const ud = new Map();
  for (const linje of String(pills ?? "").split("\n")) {
    const i = linje.indexOf("|");
    if (i < 0) continue;
    const rute = linje.slice(0, i).trim();
    const spg = linje.slice(i + 1).trim();
    if (!rute || !spg) continue;
    ud.set(rute, (ud.get(rute) ?? 0) + 1);
  }
  return ud;
}

/**
 * Hvad er galt med de to lister? Tom liste = i orden.
 *
 * `mindst` er hvor mange forslag udvælgelsen viser ad gangen (3). En rute med
 * færre har intet at rotere mellem og fyldes op med de generelle — hvilket ser
 * ud præcis som en rute der virker.
 */
export function pillsParitet(daPills, enPills, mindst = 3) {
  const da = ruteAntal(daPills);
  const en = ruteAntal(enPills);
  const fejl = [];

  if (da.size === 0 || en.size === 0) {
    fejl.push(`en af listerne er tom (dansk: ${da.size} ruter, engelsk: ${en.size})`);
    return fejl; // resten ville kun være støj oven på dette.
  }
  if (da.size !== en.size) {
    fejl.push(
      `ulige mange ruter — dansk ${da.size}, engelsk ${en.size}. ` +
        `Et sprog er blevet opdateret uden det andet.`,
    );
  }
  for (const [navn, liste] of [["dansk", da], ["engelsk", en]]) {
    for (const [rute, antal] of liste) {
      if (antal < mindst) {
        fejl.push(`${navn} ${rute} har kun ${antal} forslag (mindst ${mindst})`);
      }
    }
  }
  return fejl;
}
