/* F019.5 — den ægte kørsel ai-sdk beder om.
 *
 * De har ingen Azure-nøgle; vi har. Deres batch-rute er skrevet mod Microsofts
 * dokumenterede eksempler og bevist offline mod arkiver prøven selv bygger.
 * DEN HER KØRSEL ER DEN FØRSTE MOD DEN RIGTIGE TJENESTE — og det er dét der
 * afgør om F055 virker, ikke at 27 offline-prøver er grønne.
 *
 *   bun scripts/maal-ordtidskoder.mjs
 */
import { createAI } from "@broberg/ai-sdk";
import { tilTale, udtaleFor } from "../src/aidan-laes.ts";
import { byggKort, omraadeTil } from "../src/dom-kort.ts";
import { markeringVed, saetningerFra } from "../src/markering.ts";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";

const dir = new URL("../.content-store/posts/", import.meta.url).pathname;
const valgt = process.argv[2];
const filer = readdirSync(dir).filter((n) => n.endsWith(".json") && !n.startsWith("en-"));
const fil = valgt ? filer.find((f) => f.includes(valgt)) : filer[0];
const doc = JSON.parse(readFileSync(dir + fil, "utf8"));
const md = String(doc.data.content ?? "");
// En KORT artikel: dette er en måling, ikke en produktion. Azure tager betaling
// pr. tegn, og de første 1.500 tegn beviser nøjagtig det samme som 12.000.
const tale = tilTale([doc.data.title, md].join("\n\n")).slice(0, 1500);

console.log(`artikel: ${fil}`);
console.log(`tale: ${tale.length} tegn · ${tale.split(/\s+/).length} ord\n`);

const t0 = Date.now();
const svar = await createAI().tts({
  text: tale,
  voice: "da-DK-JeppeNeural",
  lang: "da-DK",
  pronunciations: udtaleFor("da"),
  wordTimings: true,
  override: { provider: "azure" },
});
const ms = Date.now() - t0;

console.log(`svartid: ${(ms / 1000).toFixed(1)}s · lyd: ${svar.audio.byteLength} bytes · ${svar.mimeType}`);

const wt = svar.wordTimings;
if (!wt) {
  console.log("\nwordTimings MANGLER — ruten gav dem ikke. Det er svaret ai-sdk skal have.");
  process.exit(1);
}
console.log(`ord placeret: ${wt.words.length} · IKKE placeret: ${wt.unaligned.length}`);
if (wt.unaligned.length) console.log(`  unaligned: ${JSON.stringify(wt.unaligned.slice(0, 12))}`);

// DET DER AFGØR OM FEATUREN VIRKER: peger sourceStart/sourceEnd på det ord der
// blev SAGT? Et offset der er tæt på er ikke godt nok — markeringen sidder på
// et ord, ikke i nærheden af et.
let ramt = 0, forkert = [];
for (const w of wt.words) {
  const i_kilden = tale.slice(w.sourceStart, w.sourceEnd);
  const a = i_kilden.toLowerCase().replace(/[^a-zæøå0-9]/g, "");
  const b = w.text.toLowerCase().replace(/[^a-zæøå0-9]/g, "");
  if (a && b && (a.includes(b) || b.includes(a))) ramt++;
  else if (forkert.length < 8) forkert.push({ sagt: w.text, iKilden: i_kilden });
}
console.log(`\nsourceStart/End peger på det sagte ord: ${ramt}/${wt.words.length} (${Math.round((ramt / wt.words.length) * 100)}%)`);
for (const f of forkert) console.log(`  afviger: sagt=${JSON.stringify(f.sagt)} kilde=${JSON.stringify(f.iKilden)}`);

// tiderne skal løbe forlæns
let baglaens = 0;
for (let i = 1; i < wt.words.length; i++) if (wt.words[i].startMs < wt.words[i - 1].startMs) baglaens++;
console.log(`tider der løber baglæns: ${baglaens}`);
console.log(`sidste ord slutter: ${(wt.words.at(-1).endMs / 1000).toFixed(1)}s`);

// HELE KÆDEN: tid → ord → sted i en (simuleret) artikel-tekst
const stykker = [{ tekst: tale, ref: "n0" }];
const kort = byggKort(tale, stykker);
const ordListe = wt.words.map((w) => ({ fra: w.sourceStart, laengde: w.sourceEnd - w.sourceStart, msFra: w.startMs, msTil: w.endMs }));
const saet = saetningerFra(tale);
console.log(`\nkæden, stikprøve:`);
for (const sek of [1, 5, 10, 20]) {
  const m = markeringVed(ordListe, saet, sek * 1000);
  if (!m.ord) { console.log(`  ${sek}s: intet`); continue; }
  const o = omraadeTil(kort, m.ord.fra, m.ord.til);
  const ordTekst = o ? stykker[0].tekst.slice(o.start.offset, o.slut.offset) : "(ikke fundet i teksten)";
  console.log(`  ${sek}s: ord=${JSON.stringify(ordTekst)}`);
}

writeFileSync("/tmp/ordtidskoder.json", JSON.stringify({ tale, wordTimings: wt }, null, 1));
console.log("\nrå svar gemt: /tmp/ordtidskoder.json");
