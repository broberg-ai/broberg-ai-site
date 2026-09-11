/**
 * To lydklip af SAMME sætning, så et valg kan HØRES frem for læses.
 *
 * 14 af 37 omtaler af broberg.ai står i en sammensætning («broberg.ai-drevet»),
 * og ordbogen springer dem over med vilje — bindestregs-reglen findes for at
 * holde «mail» ude af «e-mail». Spørgsmålet er hvad DOMÆNET skal lyde som, og
 * det kan ingen af os læse os til.
 */
import { createAI } from "@broberg/ai-sdk";
import { udtaleFor } from "@/aidan-laes.ts";
import { writeFile } from "node:fs/promises";

const UD = "/Users/cb/Delte-proever/domaene-udtale";
const SAETNING =
  "Det er den skærm, der møder dig, hver gang du logger ind på et broberg.ai-drevet website.";

const ai = createAI();
const ordbog = udtaleFor("da");

const varianter = [
  { navn: "1-som-i-dag", ordbog },
  {
    navn: "2-domaenet-staves-ud",
    ordbog: ordbog.map((o) =>
      o.word === "broberg.ai" ? { ...o, matchInCompounds: true } : o,
    ),
  },
];

for (const v of varianter) {
  const { audio } = await ai.tts({
    text: SAETNING,
    voice: "jeppe",
    lang: "da-DK",
    pronunciations: v.ordbog as never,
    override: { provider: "azure" },
  });
  await writeFile(`${UD}/${v.navn}.mp3`, new Uint8Array(audio));
  console.log(`${v.navn}.mp3 — ${audio.byteLength} bytes`);
}
console.log(`\nSætningen: ${SAETNING}`);
