/**
 * F019.7 — skub tidskoder for FLERE artikler op til sitet i ÉN proces.
 *
 * Findes ved siden af skub-tidskoder.ts (som stadig er den rigtige til én
 * artikel) fordi et kald pr. artikel startede 59 processer, og Macen slog dem
 * ihjel undervejs da voice-engines model kørte samtidig. Én proces, samme
 * skridt, samme spærre-tempo.
 *
 *   bun scripts/skub-alle-tidskoder.ts <liste.tsv>
 *
 * Listen er «<sti>\t<mappe>» pr. linje — så en afbrudt kørsel kan genoptages
 * med kun det der mangler.
 */
import { createHash, createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";

const BASE = "https://broberg.ai";
const secret = process.env.TIDSKODER_SECRET;
if (!secret) { console.error("TIDSKODER_SECRET mangler"); process.exit(1); }

const liste = (await readFile(process.argv[2]!, "utf-8")).trim().split("\n")
  .map((l) => l.split("\t")).filter((r) => r.length === 2);

let ok = 0; const afvist: string[] = [];
for (const [i, [sti, mappe]] of liste.entries()) {
  // Lyden hentes for at bevise at tidskoderne hører til NETOP den optagelse.
  const lydSvar = await fetch(`${BASE}/api/aidan/laes`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sti, persona: "aidan" }),
  });
  if (!lydSvar.ok) { afvist.push(`${sti} :: lyd ${lydSvar.status}`); console.log(`FEJL ${sti} — lyd ${lydSvar.status}`); continue; }
  const lydHash = createHash("sha256").update(new Uint8Array(await lydSvar.arrayBuffer())).digest("hex");

  const { words } = JSON.parse(await readFile(`${mappe}/tidskoder.json`, "utf-8"));
  const tale = await readFile(`${mappe}/manuskript.txt`, "utf-8");
  const krop = JSON.stringify({ sti, persona: "aidan", tale, lydHash, ord: words });
  const svar = await fetch(`${BASE}/api/aidan/tidskoder`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tidskoder-signature": `sha256=${createHmac("sha256", secret).update(krop).digest("hex")}`,
    },
    body: krop,
  });
  const tekst = await svar.text();
  if (svar.ok) { ok++; console.log(`${i + 1}/${liste.length} OK   ${sti}`); }
  else { afvist.push(`${sti} :: ${svar.status} ${tekst}`); console.log(`${i + 1}/${liste.length} FEJL ${sti} — ${svar.status} ${tekst}`); }
  await new Promise((r) => setTimeout(r, 21_000)); // spærren er 3 pr. minut
}
console.log(`\n=== ${ok} skubbet, ${afvist.length} afvist`);
for (const a of afvist) console.log(`  ${a}`);
