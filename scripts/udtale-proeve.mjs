/* Udtale-prøvefilen (Christians idé 5/9): Aidan (jeppe) og Airina (christel)
 * skiftes til at sige alle ord vi har mistanke om — én fil, ordlisten følger
 * i mailen, så en lytning afgør hele bruttolisten på få minutter.
 * Kører lokalt med repoets .env (Azure + Resend). */
import { createAI } from "@broberg/ai-sdk";
import { createMailerFromEnv } from "@broberg/mail";
import { udtaleFor } from "../src/aidan-laes.ts";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

// Ordbogens egne ord (med rettelser aktive) + endnu-urettede mistanke-ord fra
// høsten — så en fejl i BEGGE grupper kan høres.
const RETTEDE = ["AI", "broberg.ai", "trailmem.com", "trailmem", "webhouse.app",
  "xrt81.com", "fdsundhed.dk", "sanneandersen.dk", "gbrain", "webhook", "native",
  "stylet", "styling", "fine-tuning", "workflow", "workflows", "engineering",
  "agentic", "harness", "lens"];
const MISTANKE = ["trail", "source", "open source", "hosting", "router", "reviewer",
  "compacting", "email", "loopet", "browseren", "booking", "screenshot", "website",
  "prompt", "deploy", "pipeline", "dashboard", "frontend", "backend", "embedding"];
const ORD = [...RETTEDE, ...MISTANKE];

const ai = createAI();
const pron = udtaleFor("da");
await mkdir("/tmp/udtale", { recursive: true });
const stykker = [];
let i = 0;
for (const ord of ORD) {
  for (const voice of ["jeppe", "christel"]) {
    const { audio } = await ai.tts({ text: ord + ".", voice, lang: "da-DK",
      pronunciations: pron, override: { provider: "azure" } });
    const f = `/tmp/udtale/${String(i++).padStart(3, "0")}.mp3`;
    await writeFile(f, audio);
    stykker.push(f);
  }
  process.stdout.write(".");
}
console.log(`\n${ORD.length} ord × 2 stemmer genereret`);
await writeFile("/tmp/udtale/liste.txt", stykker.map((f) => `file '${f}'`).join("\n"));
execFileSync("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", "/tmp/udtale/liste.txt",
  "-c:a", "libmp3lame", "-q:a", "4", "/tmp/udtale/udtale-proeve.mp3"], { stdio: "ignore" });

const fil = await readFile("/tmp/udtale/udtale-proeve.mp3");
console.log(`fil: ${(fil.byteLength / 1e6).toFixed(2)} MB`);
const liste = ORD.map((o, n) => `${n + 1}. ${o}`).join("\n");
const res = await createMailerFromEnv().send({
  to: "cb@webhouse.dk",
  from: "Aidan fra broberg.ai <aidan@broberg.ai>",
  subject: "Udtale-prøven: alle mistanke-ord, begge stemmer",
  text: `Hvert ord siges FØRST af Aidan (Jeppe), SÅ af Airina (Christel), i denne rækkefølge — de første ${RETTEDE.length} har allerede en ordbogs-rettelse aktiv, resten er urettede mistanke-ord:\n\n${liste}\n\nMeld numrene der lyder galt.`,
  attachments: [{ filename: "udtale-proeve.mp3", content: fil, contentType: "audio/mpeg" }],
});
console.log("mail:", JSON.stringify(res));
if (!res.ok || res.skipped) process.exit(1);
