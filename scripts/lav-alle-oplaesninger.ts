/**
 * F019.7 — generér lyd + manuskript for HVER artikel, klar til måling.
 *
 * Én mappe pr. artikel med tre ting: lyden som produktionen serverer den,
 * manuskriptet der blev sagt, og et sha256 af lydfilen. Aligneren skal bruge
 * alle tre — og sha'en er dét der beviser at tidskoderne hører til netop den
 * optagelse (sitet afviser dem ellers).
 *
 * TEMPO ER MED VILJE. Ruten er rate-limited til 3 kald i minuttet pr. IP, og
 * den spærre er der for at beskytte TTS-generering der koster penge. Vi går
 * derfor langsomt frem for at bede om en undtagelse.
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { tilTale, ordbogNoegle } from "@/aidan-laes.ts";
import { sprogFor, udtaleordbogFil } from "./sidevogn.ts";

const UD = "/Users/cb/Delte-proever/f019-alle";
const BASE = "https://broberg.ai";
const token = process.env.CMS_ADMIN_TOKEN;
if (!token) { console.error("CMS_ADMIN_TOKEN mangler"); process.exit(1); }

const stier: { sti: string; titel: string }[] =
  (await (await fetch(`${BASE}/api/aidan/indsigter`)).json()).artikler;
const docs: Record<string, any>[] =
  await (await fetch("https://webhouse.app/api/cms/posts?site=broberg-ai", {
    headers: { Authorization: `Bearer ${token}` },
  })).json();

await mkdir(UD, { recursive: true });
// ORDBOGEN LÆGGES MED I HVER MAPPE. voice-engine udleder de TALTE ord af
// manuskript + ordbog; er ordbogen en anden end den lyden blev lavet med, bliver
// udledningen forkert — og den ville se rigtig ud, for deres to veje ville stadig
// være enige med hinanden. De spurgte selv, og de havde ret: ordbogen HAVDE
// ændret sig samme dag (domæner udtales nu også midt i et sammensat ord).
// ORDBOGEN ER PR. ARTIKEL, ikke pr. kørsel. Den gamle udgave hårdkodede dansk
// for alle 59 — også de 27 engelske, hvis lyd blev lavet med den ENGELSKE
// ordbog. Målt 14/9: 886 engelske ordforekomster fik dermed en dansk
// udtale-regel de aldrig blev sagt med, «AI» alene 447 gange.
console.log(`${stier.length} artikler\n`);

let ok = 0, fejl = 0;
for (const [i, a] of stier.entries()) {
  const slug = a.sti.split("/").pop()!;
  const doc = docs.find((d) => String(d.slug) === slug);
  if (!doc?.data?.content) { console.log(`${i + 1}/${stier.length} ${a.sti} — SPRINGES OVER (intet indhold)`); fejl++; continue; }

  const titel = String(doc.data.title ?? slug).replace(/<[^>]+>/g, "").trim();
  const tale = tilTale([titel, String(doc.data.content)].join("\n\n"));

  let svar: Response | null = null;
  for (let forsoeg = 0; forsoeg < 6; forsoeg++) {
    svar = await fetch(`${BASE}/api/aidan/laes`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sti: a.sti, persona: "aidan" }),
    });
    if (svar.status !== 429) break;
    await new Promise((r) => setTimeout(r, 25_000)); // vent spærren ud
  }
  if (!svar?.ok) { console.log(`${i + 1}/${stier.length} ${a.sti} — FEJL ${svar?.status}`); fejl++; continue; }

  const lyd = new Uint8Array(await svar.arrayBuffer());
  const sha = createHash("sha256").update(lyd).digest("hex");
  const mappe = `${UD}/${slug}`;
  await mkdir(mappe, { recursive: true });
  await writeFile(`${mappe}/lyd.mp3`, lyd);
  await writeFile(`${mappe}/manuskript.txt`, tale);
  await writeFile(`${mappe}/udtaleordbog.json`, udtaleordbogFil(tale, sprogFor(a.sti)));
  await writeFile(`${mappe}/info.json`, JSON.stringify({ sti: a.sti, slug, titel, tegn: tale.length, bytes: lyd.byteLength, audio_sha256: sha, sprog: sprogFor(a.sti), ordbog_noegle: ordbogNoegle(sprogFor(a.sti)) }, null, 2));
  ok++;
  console.log(`${i + 1}/${stier.length} ${a.sti} — ${(lyd.byteLength / 1024 / 1024).toFixed(1)} MB · ${tale.length} tegn · ${sha.slice(0, 12)}…`);
  await new Promise((r) => setTimeout(r, 21_000)); // 3 pr. minut
}
console.log(`\nfærdig: ${ok} klar, ${fejl} fejlede. Mappe: ${UD}`);
