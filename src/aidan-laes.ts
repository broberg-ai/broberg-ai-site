/* Oplæsning af indsigter (F007.7 + F007.8) — «Skal jeg læse artiklen højt?»
 *
 * Christians bestilling 4/9: tilbuddet må KUN gælde news posts (indsigter),
 * aldrig almindelige sider. Derfor er facitlisten server-autoritativ: klienten
 * spørger /api/aidan/indsigter om hvilke stier der ER indsigter, og /laes
 * afviser alt der ikke står på samme liste — uanset hvad klienten sender.
 *
 * TTS går gennem @broberg/ai-sdk (ai.tts, F020.4) med Azure-adapteren —
 * Christian valgte stemmerne 4/9: Aidan = «jeppe» (ung mandlig, native dansk),
 * Airina = «christel». Engelske artikler læses af de multilinguale Andrew/Ava.
 * voiceFallback er BEVIDST udeladt: stemmen er en identitet, og forsvinder
 * den skal det larme — ikke tale videre med en fremmeds stemme (F037).
 *
 * TTS koster pr. tegn, så lyden caches på disk pr. indholds-hash: samme
 * artikelversion koster præcis ét kald. Cachen er ephemeral (nulstilles ved
 * deploy) — det er den billige og rigtige afvejning her.
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Context } from "hono";
import { createAI, type AiClient } from "@broberg/ai-sdk";
import type { Locale } from "@/config.ts";
import { buildSearchIndex } from "@/content/compose.ts";
import { list } from "@/content/store.ts";

/** Persona → stemme pr. sprog (Azure-rosteret i ai-sdk). */
const STEMMER = {
  aidan: { da: "jeppe", en: "andrew" },
  airina: { da: "christel", en: "ava" },
} as const;
export type Persona = keyof typeof STEMMER;
const TEKST_LOFT = 12_000;
// VARIGT lager (Christian 4/9): første oplæsning gemmer filen; alle senere
// afspilninger OG mail-forsendelser kommer fra lageret. Kun en RETTELSE i
// teksten (eller en anden stemme) giver en ny fil — nøglen er et fingeraftryk
// af netop (tale, stemme). Lokal dev uden /data falder tilbage til .cache.
const CACHE_DIR =
  process.env.AIDAN_LAES_CACHE ?? (existsSync("/data") ? "/data/aidan-lyd" : ".cache/aidan-laes");

export function laesKonfigureret(): boolean {
  return !!process.env.AZURE_SPEECH_KEY;
}

let _ai: AiClient | null = null;
const ai = () => (_ai ??= createAI());
export function resetLaesForTest(client?: AiClient): void {
  _ai = client ?? null;
  _stier = null;
  hits.clear();
}

/** UDTALE-ORDBOGEN — ord stemmerne siger galt, skrevet som de skal LYDE.
 *  Vokser én linje ad gangen når Christian hører et nyt (webhook 5/9: Jeppe
 *  kunne ikke sige det). Alle opslag matches som hele ord, uafhængigt af
 *  store/små bogstaver — og de kører FØR den generelle AI-regel, så
 *  «broberg.ai» ikke mangles til «broberg.A I». */
/** UDTALE-ORDBOGEN (F007.7.1, Christians formål ordret: «en ordbog der gør at
 *  vores stemme bare bliver bedre og bedre jo flere faldgrupper jeg fanger den
 *  i») — fra ai-sdk 0.39.0 et FØRSTEKLASSES tts-felt: teksten forbliver ren
 *  (mail, genbrug), kun LYDEN ændres, og substitution + escaping sker i
 *  adapteren (injektions-værnet er pakkens, ikke vores).
 *  `sprog: "da"` holder danske lydregler væk fra Andrew/Ava, der udtaler de
 *  engelske ord rigtigt. Nyt galt-udtalt ord = én række her. */
const ORDBOG: Array<{ word: string; alias?: string; ipa?: string; sprog: "alle" | "da" }> = [
  { word: "AI", alias: "A I", sprog: "alle" },
  // Domæner og produktnavne — læses som NAVNE (Christians «Trail Mem»-regel).
  { word: "broberg.ai", alias: "broberg dot A I", sprog: "alle" },
  { word: "trailmem.com", alias: "trail mem dot com", sprog: "alle" },
  { word: "trailmem", alias: "trail mem", sprog: "alle" },
  { word: "webhouse.app", alias: "web house dot app", sprog: "alle" },
  { word: "xrt81.com", alias: "x r t 81 dot com", sprog: "alle" },
  { word: "fdsundhed.dk", alias: "f d sundhed dot d k", sprog: "alle" },
  { word: "sanneandersen.dk", alias: "sanne andersen dot d k", sprog: "alle" },
  { word: "gbrain", alias: "G brain", sprog: "alle" },
  { word: "webhooks", alias: "web-hooks", sprog: "alle" },
  { word: "webhook", alias: "web-hook", sprog: "alle" },
  // Bruttolisten fra sitets MÅLTE danske ordforråd (25 artikler, 5/9) + de
  // bøjede låneord Christian fangede («stylet» → stylet på dansk). Aliaser er
  // TALE-tekst — lydord bor fint dér uden at røre den skrevne tekst.
  { word: "native", ipa: "ˈneɪtɪv", sprog: "da" },
  { word: "stylet", alias: "stajlet", sprog: "da" },
  { word: "stylede", alias: "stajlede", sprog: "da" },
  { word: "styling", alias: "stajling", sprog: "da" },
  { word: "fine-tuning", alias: "fajn-tjuning", sprog: "da" },
  { word: "workflows", ipa: "ˈwɜːkfloʊs", sprog: "da" },
  { word: "workflow", ipa: "ˈwɜːkfloʊ", sprog: "da" },
  { word: "engineering", ipa: "ˌɛndʒɪˈnɪərɪŋ", sprog: "da" },
  { word: "agentic", ipa: "eɪˈdʒɛntɪk", sprog: "da" },
  { word: "harness", ipa: "ˈhɑːnəs", sprog: "da" },
];
export function udtaleFor(locale: Locale): Array<{ word: string; alias?: string; ipa?: string }> {
  return ORDBOG.filter((r) => r.sprog === "alle" || r.sprog === locale).map(({ word, alias, ipa }) => ({
    word,
    ...(alias ? { alias } : {}),
    ...(ipa ? { ipa } : {}),
  }));
}
/** Ordbogen er en del af lydens identitet: en ændret udtale SKAL give en ny
 *  fil, ellers serverer lageret den gamle lyd for evigt. */
export function ordbogNoegle(locale: Locale): string {
  return createHash("sha256").update(JSON.stringify(udtaleFor(locale))).digest("hex").slice(0, 8);
}

/** Artikel-markdown → noget et menneske gider HØRE (Christians GO 4/9 på
 *  eksemplet i /Downloads). Links læses som deres tekst (aldrig URL'en),
 *  markører og skillelinjer siges ikke, indlejrede [block:]-figurer springes
 *  over — og UDTALE-ORDBOGEN sikrer at navnet og «AI» siges rigtigt.
 *  Ordbogens rækkefølge bærer: broberg.ai-reglen SKAL køre før AI-reglen,
 *  ellers bliver navnet til «broberg.A I». */
export function tilTale(md: string): string {
  return md
    // BÆLTE (Christians fund 5/9: rå <em> i en titel blev læst højt som
    // «mindre end...»): HTML-tags når ALDRIG stemmen, uanset hvor de sniger
    // sig ind i et felt. Dataen rettes altid også — dette er nødbremsen.
    .replace(/<[^>]+>/g, "")
    .replace(/\bwww\./gi, "") // «www.» siges aldrig — det talte domæne er navnet
    .replace(/^\[block:[a-z0-9-]+\]\s*$/gim, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,4}\s+/gm, "")
    .replace(/^[-•]\s+/gm, "")
    .replace(/[*_`]/g, "")
    .replace(/^\s*[-–—_]{3,}\s*$/gm, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, TEKST_LOFT);
}

export function laesCacheNoegle(tale: string, stemme: string): string {
  return createHash("sha256").update(`${stemme}\n${tale}`).digest("hex").slice(0, 32);
}

// ── Indsigts-stierne — KUN posts-samlingen, fra sitets kanoniske søgeindeks.
// Kortet sti → (slug, locale) er også opslaget når en artikel skal læses.
// Cache 5 min: listen ændrer sig ved udgivelser, ikke pr. request.
let _stier: { kort: Map<string, { slug: string; locale: Locale }>; hentet: number } | null = null;
async function indsigtsStier(): Promise<Map<string, { slug: string; locale: Locale }>> {
  if (_stier && Date.now() - _stier.hentet < 300_000) return _stier.kort;
  const kort = new Map<string, { slug: string; locale: Locale }>();
  for (const locale of ["da", "en"] as Locale[]) {
    for (const e of await buildSearchIndex(locale)) {
      if (e.id.startsWith("post:") && typeof e.data === "string")
        kort.set(e.data, { slug: e.id.slice("post:".length), locale });
    }
  }
  _stier = { kort, hentet: Date.now() };
  return kort;
}

// Egen, strammere spærre end chatten: TTS er dyr pr. kald.
const VINDUE_MS = 60_000;
const MAX_PR_VINDUE = 3;
const hits = new Map<string, number[]>();
function rateLimited(c: Context): boolean {
  const ip = c.req.header("fly-client-ip") || c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "ukendt";
  const key = createHash("sha256").update(ip).digest("hex").slice(0, 16);
  const nu = Date.now();
  const liste = (hits.get(key) ?? []).filter((t) => nu - t < VINDUE_MS);
  if (liste.length >= MAX_PR_VINDUE) return true;
  liste.push(nu);
  hits.set(key, liste);
  if (hits.size > 5000) hits.clear();
  return false;
}

export async function handleAidanIndsigter(c: Context): Promise<Response> {
  if (!laesKonfigureret()) return c.json({ stier: [] });
  return c.json({ stier: [...(await indsigtsStier()).keys()] });
}

/** Fejl med HTTP-status — hentLyd kaster dem, ruterne oversætter. */
export class LydFejl extends Error {
  constructor(public status: 404 | 422 | 502, kode: string) {
    super(kode);
  }
}

/** Delt af /laes (afspilning) og /send-lyd (mail, F007.9): sti → lydfil.
 *  Server-autoritativ sti-validering + cache pr. (indhold, stemme). */
export async function hentLyd(
  sti: string,
  persona: Persona,
): Promise<{ audio: Uint8Array; mimeType: string; titel: string }> {
  const post = (await indsigtsStier()).get(sti);
  if (!post) throw new LydFejl(404, "ikke_en_indsigt");
  // KILDEN ER ARTIKLENS EGET CMS-FELT, ikke sidens HTML (Christians GO 4/9):
  // så hører oplæseren aldrig breadcrumb, meta-linje, tags eller outro — og
  // fordi begge ruter deler denne funktion, gælder det ALLE artikler.
  const doc = (await list("posts")).find((d) => String(d.slug) === post.slug);
  const data = (doc?.data ?? {}) as Record<string, unknown>;
  if (!doc || !data.content) throw new LydFejl(502, "side_utilgaengelig");
  const titel = String(data.title ?? post.slug);
  const dele = [titel];
  if (data.excerpt) dele.push(String(data.excerpt));
  dele.push(String(data.content));
  const tale = tilTale(dele.join("\n\n"));
  if (tale.length < 200) throw new LydFejl(422, "for_tynd");

  const locale = post.locale;
  const stemme = STEMMER[persona][locale];
  await mkdir(CACHE_DIR, { recursive: true });
  const fil = path.join(CACHE_DIR, `${laesCacheNoegle(tale, `${stemme}:${ordbogNoegle(locale)}`)}.mp3`);
  try {
    return { audio: new Uint8Array(await readFile(fil)), mimeType: "audio/mpeg", titel };
  } catch {
    /* ikke i cache endnu */
  }
  const { audio, mimeType } = await ai().tts({
    text: tale,
    voice: stemme,
    lang: locale === "en" ? "en-US" : "da-DK",
    pronunciations: udtaleFor(locale),
    override: { provider: "azure" },
  });
  await writeFile(fil, audio).catch(() => {}); // en fejlet cache-skrivning må aldrig koste svaret
  console.log(`[aidan-laes] genereret ${audio.byteLength} bytes (${stemme}) for ${sti}`);
  return { audio: new Uint8Array(audio), mimeType: mimeType || "audio/mpeg", titel };
}

export async function handleAidanLaes(c: Context): Promise<Response> {
  if (!laesKonfigureret()) return c.json({ error: "ikke_konfigureret" }, 503);
  if (rateLimited(c)) return c.json({ error: "rate_limited" }, 429);

  let sti = "";
  let persona: Persona = "aidan";
  try {
    const krop = await c.req.json();
    sti = String(krop?.sti ?? "");
    if (krop?.persona === "airina") persona = "airina";
  } catch {
    return c.json({ error: "ugyldig_krop" }, 400);
  }
  try {
    const { audio, mimeType } = await hentLyd(sti, persona);
    return new Response(new Uint8Array(audio).buffer as ArrayBuffer, {
      headers: { "Content-Type": mimeType, "Cache-Control": "private, max-age=86400" },
    });
  } catch (e) {
    if (e instanceof LydFejl) return c.json({ error: e.message }, e.status);
    throw e;
  }
}
