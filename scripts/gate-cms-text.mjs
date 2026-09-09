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
 *
 * Selve målingen bor i gate-cms-text.lib.mjs, så den kan prøves uden netværk.
 */
import { felterMedReservetekst, manglendeFelter, pillsParitet } from "./gate-cms-text.lib.mjs";

const SITE = process.env.CMS_SITE || "broberg-ai";
const BASE = process.env.CMS_API_BASE || "https://webhouse.app";
const TOKEN = process.env.CMS_ADMIN_TOKEN;

const felter = felterMedReservetekst("src");
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

const mangler = manglendeFelter(felter, data);

if (mangler.length) {
  console.error(`✗ ${mangler.length} af ${felter.size} tekster findes KUN i koden — ikke i CMS'et:\n`);
  for (const [navn, fil] of mangler) console.error(`    ${navn}\n      brugt i ${fil}`);
  console.error(`\n  Sitet renderer reserveteksten, så det SER færdigt ud. Men CMS-søgningen`);
  console.error(`  finder den ikke, og admin-editoren kan ikke vise den.`);
  console.error(`\n  Skriv værdien ind i globals-dokumentet og læs den tilbage fra en frisk GET.`);
  process.exit(1);
}
console.log(`✓ Alle ${felter.size} tekster findes i CMS'et for ${SITE} — ingen lever kun i koden.`);

/* --------------------------------------------------------------------------
 * F016.9 — sprog-paritet. Porten hentede kun `globals`, så den kunne
 * strukturelt ikke se at `en-globals` var faldet bagud. Det skete: 145 danske
 * linjer mod 17 engelske i fire dage, mens engelske sider viste tre pæne
 * generelle forslag og så helt rigtige ud.
 * -------------------------------------------------------------------------- */
const enSvar = await fetch(`${BASE}/api/cms/globals/en-globals?site=${SITE}`, {
  headers: { Authorization: `Bearer ${TOKEN}` },
});
if (enSvar.status === 404) {
  // Sagt HØJT, ikke sprunget over i stilhed: et sprog-tjek der ikke kørte må
  // aldrig kunne forveksles med et der bestod.
  console.log(`· Sprog-paritet IKKE målt: ${SITE} har intet en-globals-dokument.`);
} else if (!enSvar.ok) {
  console.error(`✗ Gate D: CMS svarede ${enSvar.status} på en-globals for ${SITE}.`);
  process.exit(1);
} else {
  const enData = (await enSvar.json()).data ?? {};
  const fejl = pillsParitet(data.aidanPills, enData.aidanPills);
  if (fejl.length) {
    console.error(`\n✗ De primede chat-spørgsmål er ude af trit mellem sprogene:\n`);
    for (const f of fejl) console.error(`    ${f}`);
    console.error(`\n  Et sprog opdateret uden det andet ser IKKE forkert ud på sitet —`);
    console.error(`  den glemte side viser stadig tre pæne generelle forslag.`);
    console.error(`\n  Ret begge dokumenter og læs dem tilbage fra en frisk GET.`);
    process.exit(1);
  }
  console.log(`✓ Sprog-paritet: dansk og engelsk dækker de samme antal ruter.`);
}
