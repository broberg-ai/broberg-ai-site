/* Pre-generering af oplæsninger (F007.7.1, Christians GO 5/9) — én stemme
 * (Aidan/jeppe) for ALLE indsigter, gennem den ÆGTE rute på prod, så filerne
 * lander i det varige lager præcis som et brugerkald ville lægge dem.
 *
 * Idempotent per design: en artikel der allerede ligger i lageret svarer på
 * ~0,5s uden TTS-kald, så scriptet kan køres igen når som helst (fx efter en
 * tekst-rettelse — kun de rettede koster).
 *
 *   bun scripts/pre-generer-lyd.mjs            # alle, aidan-stemmen
 *   PERSONA=airina bun scripts/pre-generer-lyd.mjs
 */
const BASE = process.env.SITE_BASE ?? "https://broberg.ai";
const PERSONA = process.env.PERSONA ?? "aidan";

const { stier } = await (await fetch(`${BASE}/api/aidan/indsigter`)).json();
console.log(`${stier.length} indsigter · stemme: ${PERSONA}`);

let genereret = 0, fraLager = 0, fejl = 0;
for (const sti of stier) {
  const t0 = Date.now();
  const res = await fetch(`${BASE}/api/aidan/laes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sti, persona: PERSONA }),
  });
  const ms = Date.now() - t0;
  if (!res.ok) {
    fejl++;
    console.error(`  FEJL ${res.status} (${(await res.text()).slice(0, 80)}): ${sti}`);
    // Rate-limit (3/min): vent og prøv igen én gang.
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 25_000));
      const igen = await fetch(`${BASE}/api/aidan/laes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sti, persona: PERSONA }),
      });
      if (igen.ok) { fejl--; genereret++; console.log(`  ok efter retry: ${sti}`); }
    }
    continue;
  }
  const bytes = (await res.arrayBuffer()).byteLength;
  // Et lager-svar er ~0,5s; en generering er 8-15s. Tærsklen 2s skiller dem.
  if (ms < 2000) { fraLager++; } else { genereret++; }
  console.log(`  ${ms < 2000 ? "lager" : "GENERERET"} ${(bytes / 1e6).toFixed(2)} MB · ${(ms / 1000).toFixed(1)}s · ${sti}`);
  // Hold os under rutens 3/min-spærre når vi reelt genererer.
  if (ms >= 2000) await new Promise((r) => setTimeout(r, 21_000));
}
console.log(`\nfærdig: ${genereret} genereret · ${fraLager} fra lager · ${fejl} fejl`);
process.exit(fejl ? 1 : 0);
