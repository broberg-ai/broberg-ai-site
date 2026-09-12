/**
 * F019.7 — broen: skub ord-tidskoder fra Macen op til sitet.
 *
 * voice-engines aligner kører lokalt; sitet kører i skyen. Indtil målingen kan
 * kaldes som en tjeneste, går vejen herigennem — og den går gennem appens EGEN
 * HTTP-API, aldrig ind i den mappe appen selv skriver i. Det er husets regel,
 * og den findes fordi en fil lagt ind udenom ender med forkert ejer og tavse
 * skrivefejl bagefter.
 *
 * Broen og den kommende tjeneste kalder det SAMME stykke kode hos voice-engine
 * og sender det samme ind. Skifter vejen, skifter kun adressen.
 *
 *   bun scripts/skub-tidskoder.ts <sti> <alignment.json> [--base https://broberg.ai]
 *
 * <alignment.json> er voice-engines eget svar: {"words":[{word,offset,start,end,spoken}]}
 *
 * HVORFOR LYDEN HENTES FØRST: tidskoderne gælder for NETOP den lydfil de blev
 * målt på. Sitet afviser dem hvis fingeraftrykket ikke passer — og det er ikke
 * teoretisk: samme dag broen blev skrevet ændrede vi udtalen af vores domæner,
 * teksten var uændret, og lyden blev 1,18 s længere.
 */
import { createHash, createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";

const [, , sti, alignmentFil, ...rest] = process.argv;
const base = rest.includes("--base") ? rest[rest.indexOf("--base") + 1]! : "https://broberg.ai";
const secret = process.env.TIDSKODER_SECRET;

if (!sti || !alignmentFil) {
  console.error("brug: bun scripts/skub-tidskoder.ts <sti> <alignment.json> [--base <url>]");
  process.exit(1);
}
if (!secret) {
  console.error("TIDSKODER_SECRET mangler — den skal være den SAMME som sitets.");
  process.exit(1);
}

console.log(`henter lyden for ${sti} …`);
const lydSvar = await fetch(`${base}/api/aidan/laes`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ sti, persona: "aidan" }),
});
if (!lydSvar.ok) {
  console.error(`kunne ikke hente lyden: ${lydSvar.status}`);
  process.exit(1);
}
const lyd = new Uint8Array(await lydSvar.arrayBuffer());
const lydHash = createHash("sha256").update(lyd).digest("hex");
console.log(`  ${lyd.byteLength} bytes · ${lydHash.slice(0, 12)}…`);

// Manuskriptet hentes fra SITET, ikke regnes ud her: så er det sitets egen
// udgave der sendes tilbage, og en uenighed opdages af serveren frem for at
// blive udjævnet af afsenderen.
const tidskoderSvar = await fetch(`${base}/api/aidan/tidskoder?sti=${encodeURIComponent(sti)}&persona=aidan`);
const alignment = JSON.parse(await readFile(alignmentFil, "utf-8"));
const ord = alignment.words ?? alignment.ord ?? alignment;
console.log(`  ${Array.isArray(ord) ? ord.length : "?"} ord i ${alignmentFil}`);
if (tidskoderSvar.ok) console.log("  (sitet har allerede tidskoder for denne udgave — de overskrives)");

// `tale` skal være sitets egen. Den eneste kilde vi har udefra er den vi selv
// afleverede til aligneren, så den sendes med og serveren dømmer.
const tale = String(alignment.tale ?? alignment.manuskript ?? "");
if (!tale) {
  console.error("alignment-filen bærer ikke manuskriptet («tale»). Uden det kan serveren ikke");
  console.error("afgøre om tidskoderne hører til DENNE udgave af artiklen — og den afviser dem.");
  process.exit(1);
}

const krop = JSON.stringify({ sti, persona: "aidan", tale, lydHash, ord });
const svar = await fetch(`${base}/api/aidan/tidskoder`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-tidskoder-signature": `sha256=${createHmac("sha256", secret).update(krop).digest("hex")}`,
  },
  body: krop,
});
const tekst = await svar.text();
console.log(`\n${svar.status} ${tekst}`);
process.exit(svar.ok ? 0 : 1);
