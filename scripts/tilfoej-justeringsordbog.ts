/**
 * F019.8 — læg justerings-ordbogen i de 59 mapper der ALLEREDE findes.
 *
 * Ingen ny lyd. Det er hele pointen: tal-posterne beskriver hvad stemmen
 * allerede sagde, så optagelserne er urørte og deres fingeraftryk holder.
 * voice-engine måler de samme filer igen med en bedre beskrivelse.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { sprogFor, udtaleordbogFil } from "./sidevogn.ts";
import { justeringsFor, justeringsNoegle, ordbogNoegle } from "@/aidan-laes.ts";

const UD = "/Users/cb/Delte-proever/f019-alle";
const mapper = (await readdir(UD, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
let poster = 0;
for (const slug of mapper.sort()) {
  const info = JSON.parse(await readFile(`${UD}/${slug}/info.json`, "utf-8"));
  const tale = await readFile(`${UD}/${slug}/manuskript.txt`, "utf-8");
  const locale = sprogFor(info.sti);
  await writeFile(`${UD}/${slug}/udtaleordbog.json`, udtaleordbogFil(tale, locale));
  const n = justeringsFor(tale, locale).length;
  poster += n;
  await writeFile(`${UD}/${slug}/info.json`, JSON.stringify({
    ...info,
    // ordbog_noegle var HÅRDKODET til dansk for alle 59 — også de 27 engelske,
    // hvis lyd blev lavet med den engelske ordbog. Feltet rettes til artiklens
    // EGEN nøgle. Det får voice-engines nuværende port til at fejle, og det er
    // meningen: den sammenlignede de 59 med hinanden, og en fejl de ALLE bar
    // kunne den derfor ikke se. Porten skal spørge «passer denne fils nøgle
    // til dens egen ordbog», ikke «er de 59 enige».
    ordbog_noegle: ordbogNoegle(locale),
    sprog: locale,
    noegle_lyd: ordbogNoegle(locale),
    noegle_justering: justeringsNoegle(tale, locale),
  }, null, 2));
  console.log(`${slug.padEnd(48)} ${locale}  ${n} tal-poster`);
}
console.log(`\n${mapper.length} mapper · ${poster} tal-poster i alt · lyden er URØRT`);
