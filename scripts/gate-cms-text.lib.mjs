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
