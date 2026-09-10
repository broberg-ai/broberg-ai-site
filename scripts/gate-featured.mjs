#!/usr/bin/env bun
/**
 * F008.10 — MÅLEREN Christian bad om.
 *
 *   «du må have noget der kan måle det så vi ikke fåt dette resultat»
 *
 * Enhedsprøverne fanger reglen i koden. Denne måler den FÆRDIGE side:
 * hvor mange kort der faktisk står der, og hvor høj sektionen blev.
 * Forskellen er hele pointen — skærmbilledet var en HØJDE, ikke et tal i
 * en kildefil.
 *
 *   bun scripts/gate-featured.mjs [url]        (standard: https://broberg.ai)
 *
 * MÅLT PÅ PRODUKTION 10/9, 1440px, med stræk slået fra:
 *   et lille kort er 215px naturligt, mellemrum 16px
 *   2 kort = 446px · 3 kort = 677px · 4 kort = 907px  ← den Christian så
 *   den store boks er 359–418px ved korte titler, 609px ved BI-titlen (67 tegn)
 *
 * Højden kræver en browser og måles gennem Lens-dæmonen. Svarer den ikke,
 * måles ANTALLET stadig og porten siger EKSPLICIT at højden ikke blev målt —
 * en sprunget kontrol må aldrig ligne en bestået.
 */
const BASE = process.argv[2] ?? "https://broberg.ai";
const LENS = "http://127.0.0.1:7475";
const LANG_TITEL_TEGN = 55;   // skal følge FEATURED_LANG_TITEL_TEGN
const MAKS_HOEJDE_PX = 700;   // 3 kort = 677; 4 kort = 907 og er for meget

let fejl = 0;
const sig = (ok, linje) => { console.log(`${ok ? "  ✓" : "  ✗"} ${linje}`); if (!ok) fejl++; };
const taeller = (h, m) => (h.match(new RegExp(m, "g")) ?? []).length;

for (const sti of ["/", "/en"]) {
  console.log(`\n── ${BASE}${sti} ──`);
  const r = await fetch(BASE + sti);
  if (!r.ok) { sig(false, `siden svarede ${r.status}`); continue; }
  const html = await r.text();
  if (!html.includes('data-testid="featured-boks"')) { console.log("  – ingen featured-sektion"); continue; }

  const store = taeller(html, 'class="f-boks"');
  const smaa = taeller(html, 'data-testid="featured-lille"');
  // Den STORE titel afgør hvor mange der må stå — så porten måler reglen,
  // ikke bare et loft. Et fast tal ville acceptere 3 små ved en kort titel.
  const h2 = /<div class="f-boks-tekst">[\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>/.exec(html)?.[1] ?? "";
  const titel = h2.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, " ").trim();
  const tilladt = titel.length >= LANG_TITEL_TEGN ? 3 : 2;

  sig(store === 1, `1 stor  (målt ${store})`);
  sig(smaa <= tilladt, `højst ${tilladt} små for en titel på ${titel.length} tegn  (målt ${smaa})`);
  console.log(`     titel: «${titel.slice(0, 60)}»`);
}

// ── højden: kræver en rigtig browser
let oppe = false;
try { oppe = (await fetch(`${LENS}/lens/vision-models`, { signal: AbortSignal.timeout(3000) })).ok; } catch { /* nede */ }

if (!oppe) {
  console.log("\n⚠ SEKTIONSHØJDEN IKKE MÅLT — Lens-dæmonen svarer ikke på 7475.");
  console.log("  Antallet er målt; hvor høj sektionen blev er det IKKE.");
} else {
  console.log("\n── sektionens højde (Lens, 1440px) ──");

  // En asserts RETURVÆRDI kan ikke læses ud af Lens — kun bestået/fejlet
  // (gap filet til cardmem, idé 01a08717). Så højden måles som et TÆRSKEL-
  // spørgsmål: «er den under N?». Er svaret nej, indsnævres den med en stige,
  // så porten kan sige et TAL og ikke bare «for høj».
  const underEnd = async (px) => {
    const js = `(()=>{const g=document.querySelector('.f-grid');return g&&g.getBoundingClientRect().height<=${px}?'ja':'';})()`;
    const svar = await fetch(`${LENS}/lens/manuscript`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        project: "broberg-ai-site",
        viewport: { width: 1440, height: 900 },
        manuscript: `# flow: featured-hoejde\nbase: ${BASE}\n\n- goto /\n- assert: ${js}\n`,
      }),
    }).then((x) => x.json()).catch(() => null);
    return svar?.status === "pass" ? true : svar?.status === "fail" ? false : null;
  };

  const inden = await underEnd(MAKS_HOEJDE_PX);
  if (inden === null) {
    console.log("  ⚠ Lens svarede ikke brugbart — SEKTIONSHØJDEN ER IKKE MÅLT.");
  } else if (inden) {
    sig(true, `sektionen er under ${MAKS_HOEJDE_PX}px (3 kort = 677; 4 kort gav 907)`);
  } else {
    let nedre = MAKS_HOEJDE_PX;
    for (const px of [750, 800, 850, 900, 950, 1100]) {
      if (await underEnd(px)) { console.log(`  ✗ sektionen er mellem ${nedre} og ${px}px — loftet er ${MAKS_HOEJDE_PX}px`); nedre = -1; break; }
      nedre = px;
    }
    if (nedre !== -1) console.log(`  ✗ sektionen er over ${nedre}px — loftet er ${MAKS_HOEJDE_PX}px`);
    fejl++;
  }
}

console.log(fejl ? `\n${fejl} fejl` : "\nAlt målt grønt");
process.exit(fejl ? 1 : 0);
