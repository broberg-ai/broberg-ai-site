#!/usr/bin/env node
/**
 * Gate D — hver reservetekst i koden SKAL have en rigtig værdi i CMS'et.
 *
 * Christian, 31/8-2026: «LAV ALDRIG TEKST I KODEN - ALTID I CMS.»
 *
 * Mønsteret `g("feltnavn", "reservetekst")` ser ud til at gøre teksten
 * redigerbar, og siden renderer korrekt uanset hvad. Men findes værdien ikke i
 * CMS-dokumentet, kan hverken søgningen eller admin-editoren se den — og
 * reserveteksten i git bliver de facto den rigtige tekst.
 *
 * Den fejl renderer IDENTISK med den rigtige tilstand. Derfor en spærre og
 * ikke en påmindelse: den grønne retning er den tavse retning.
 *
 * Målt 31/8: fem felter i afslutningen på 34 artikler manglede alle i
 * globals-dokumentet, mens sitet så færdigt ud.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const SITE = process.env.CMS_SITE || "broberg-ai";
const BASE = process.env.CMS_API_BASE || "https://webhouse.app";
const TOKEN = process.env.CMS_ADMIN_TOKEN;

// Kommentarer ud først: en kommentar der FORKLARER mønsteret er ikke et kald.
// (Samme fælde som deploy-vagten og css-token-prøven faldt i samme dag.)
const afKommentarer = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

function filer(dir, ud = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) filer(p, ud);
    else if ([".ts", ".tsx"].includes(extname(p)) && !p.endsWith(".test.ts")) ud.push(p);
  }
  return ud;
}

/** `g("felt", …)` — feltnavne der har en reservetekst i koden. */
function felterMedReservetekst() {
  const fundet = new Map();
  for (const f of filer("src")) {
    const src = afKommentarer(readFileSync(f, "utf-8"));
    // Feltnavnet maa IKKE begraenses til et taegn-saet: foerste udgave tillod kun
    // [A-Za-z0-9_.], saa et navn med bindestreg var USYNLIGT for porten — og
    // mutationstesten gik groen med fejlen indsat. Fanget af netop den test.
    for (const m of src.matchAll(/\bg\(\s*["'`]([^"'`]+)["'`]\s*,/g)) {
      if (!fundet.has(m[1])) fundet.set(m[1], f);
    }
  }
  return fundet;
}

const felter = felterMedReservetekst();
if (felter.size === 0) {
  // POSITIV KONTROL: finder scanneren ingenting, er det næsten altid fordi den
  // kigger forkert — ikke fordi koden er ren. "0 fund" og "virker ikke" ser ens ud.
  console.error("✗ Gate D fandt INGEN g(...)-kald. Scanneren måler ikke det den tror.");
  process.exit(1);
}

if (!TOKEN) {
  console.error(`✗ Gate D kan ikke måle: CMS_ADMIN_TOKEN mangler.`);
  console.error(`  Uden den kan porten ikke se om ${felter.size} felter findes i CMS'et.`);
  console.error(`  Den springer IKKE over — en port der ikke kan måle skal sige det, ikke melde grønt.`);
  process.exit(1);
}

const svar = await fetch(`${BASE}/api/cms/globals/globals?site=${SITE}`, {
  headers: { Authorization: `Bearer ${TOKEN}` },
});
if (!svar.ok) {
  console.error(`✗ Gate D: CMS svarede ${svar.status} — kunne ikke hente globals for ${SITE}.`);
  process.exit(1);
}
const data = (await svar.json()).data ?? {};

const mangler = [...felter].filter(([navn]) => {
  const v = navn.split(".").reduce((o, k) => (o == null ? undefined : o[k]), data);
  return typeof v !== "string" || v.trim() === "";
});

if (mangler.length) {
  console.error(`✗ ${mangler.length} af ${felter.size} tekster findes KUN i koden — ikke i CMS'et:\n`);
  for (const [navn, fil] of mangler) console.error(`    ${navn}\n      brugt i ${fil}`);
  console.error(`\n  Sitet renderer reserveteksten, så det SER færdigt ud. Men CMS-søgningen`);
  console.error(`  finder den ikke, og admin-editoren kan ikke vise den.`);
  console.error(`\n  Skriv værdien ind i globals-dokumentet og læs den tilbage fra en frisk GET.`);
  process.exit(1);
}
console.log(`✓ Alle ${felter.size} tekster findes i CMS'et for ${SITE} — ingen lever kun i koden.`);
