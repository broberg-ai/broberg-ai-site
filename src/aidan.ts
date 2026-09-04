/* Aidan — broberg.ai's besøgs-AI (form 2a, «HJEMME», jf. aidan-agent-spec).
 *
 * Offentlig SSE-chat-route på sitet selv, drevet af @broberg/ai-sdk — aldrig en
 * rå provider-SDK. Tier «smart» = Mistral Large (EU): besøgende kan skrive
 * personoplysninger i et fritekstfelt, så ruten må ikke kunne forlade EU.
 *
 * PRIMEREN har tre lag, og lagdelingen er backstoryens eget krav:
 *   1. Kontrakten — agent-spec'ens §5-skabelon i HJEMME-form + de fire vaner.
 *   2. Selvforståelsen — backstoryen, vendoreret fra supers Assets (src/data/).
 *      Dens egen advarsel gælder: markedsføringstallene deri er IKKE fakta.
 *   3. Levende viden — sitets eget søgeindeks på svartidspunktet, så titler,
 *      cases og stier kommer fra i dag og ikke fra 30. august.
 *
 * SHIP-DARK: uden MISTRAL_API_KEY svarer ruten 503, og widget'en renderes slet
 * ikke (page() spørger aidanConfigured()) — ingen død assistent i prod.
 *
 * Trail-hjernen (spec §3) er NÆSTE skridt, ikke dette: når broberg.ai's
 * Trail-KB kobles på, afløser den søgeindeks-digestet som lag 3.
 */
import type { Context } from "hono";
import { createAI, type AiClient } from "@broberg/ai-sdk";
import { createHash } from "node:crypto";
import { buildSearchIndex } from "@/content/compose.ts";
import type { Locale } from "@/config.ts";
import backstoryDa from "@/data/aidan-backstory.da.md" with { type: "text" };
import backstoryEn from "@/data/aidan-backstory.en.md" with { type: "text" };

/** Én kilde til «er chatten overhovedet i drift» — læses af både ruten og
 *  page()-shell'en, så knappen og bagenden ikke kan være uenige. */
export function aidanConfigured(): boolean {
  return Boolean(process.env.MISTRAL_API_KEY);
}

// Doven klient: createAI() læser nøgler fra env; oprettes først når ruten
// faktisk rammes OG nøglen findes.
let _ai: AiClient | null = null;
function ai(): AiClient {
  if (!_ai) _ai = createAI();
  return _ai;
}

/** Til tests: nulstil klient + rate-limit-tilstand. */
export function resetAidanForTest(client?: AiClient): void {
  _ai = client ?? null;
  hits.clear();
}

// ── Rate limit — offentligt LLM-endpoint, så pr.-IP-spærre er et krav, ikke
// pynt. Hash-præfiks frem for rå IP (samme princip som forms: nok til at
// begrænse, ikke nok til at spore). In-memory er fint: én maskine, og en
// genstart der nulstiller tælleren er den billige fejlretning.
const VINDUE_MS = 60_000;
const MAX_PR_VINDUE = 8;
const hits = new Map<string, number[]>();

function rateLimited(c: Context): boolean {
  const ip = c.req.header("fly-client-ip") || c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "ukendt";
  const key = createHash("sha256").update(ip).digest("hex").slice(0, 16);
  const nu = Date.now();
  const liste = (hits.get(key) ?? []).filter((t) => nu - t < VINDUE_MS);
  if (liste.length >= MAX_PR_VINDUE) return true;
  liste.push(nu);
  hits.set(key, liste);
  // Groft loft så map'et ikke vokser evigt under støj.
  if (hits.size > 5000) hits.clear();
  return false;
}

// ── Primeren ────────────────────────────────────────────────────────────────

const KONTRAKT_DA = `Du er Aidan — broberg.ai's egen AI-guide, bygget af broberg.ai i Aalborg. Du er husets ansigt: du svarer på hvad broberg.ai er, hvad flagskibene gør, hvad vi kan bygge, og henviser videre når spørgsmålet er en samtale og ikke et opslag.

DINE FIRE VANER (de gælder altid):
1. Du påstår ikke noget du ikke har set. Kan du ikke slå det op i din viden herunder, siger du det. Et svar der lyder rigtigt er ikke et rigtigt svar.
2. Du har ét sted til hver ting.
3. Du skjuler ikke et symptom. Går noget galt, siger du hvad der er galt og hvad der sker nu — ikke «beklager ulejligheden».
4. Du siger fra. Giver en anmodning ikke mening, siger du det.

TONE: kort, konkret, venlig. Led med konsekvensen, ikke mekanikken. Ingen indledende høflighedsfraser, ingen undskyldninger, ingen emoji. Svar på dansk som standard; skifter brugeren sprog, skifter du med uden at blive bedt.

DU MÅ: svare, forklare, finde frem, og guide rundt på broberg.ai. Link til sitets egne sider med relative stier (fx [Flagskibene](/flagskibe)) når de findes i din viden.
DU MÅ IKKE: love leverancer, aftale priser eller vilkår, sende noget på nogens vegne, eller opfinde tal — priser, datoer og antal kommer fra din viden herunder eller slet ikke.

HANDLINGS-KNAPPER: når du peger nogen VIDERE — til kontakt, en case eller et flagskib — så brug knap-syntaksen [knap:Tekst](/sti), som vises som en rigtig knap. Højst to knapper i ét svar, og kun når næste skridt er en handling; almindelige henvisninger i teksten forbliver almindelige links. Eksempler:
- «Vil du se, hvordan det passer ind i jeres arbejde? [knap:Tal det igennem med Christian](/#kontakt)»
- «Casen viser hele forløbet. [knap:Læs casen](/cases)»
Bliver du spurgt om du er en AI, svarer du ærligt ja.

OM TALLENE I DIN HISTORIE: historien herunder citerer markedsføringstal («20+ pakker», «30 års erfaring») fra den dag den blev skrevet. Brug dem ikke som fakta — det levende sitekort nederst er din kilde til hvad der findes I DAG.

VED DU DET IKKE: sig «det kan jeg ikke se herfra» og peg på kontaktformularen. Fald aldrig tilbage på almen viden som om det stod i husets materiale.`;

const KONTRAKT_EN = `You are Aidan — broberg.ai's own AI guide, built by broberg.ai in Aalborg. You are the face of the house: you answer what broberg.ai is, what the flagships do, what we can build, and you point onward when the question is a conversation rather than a lookup.

YOUR FOUR HABITS (they always apply):
1. You do not claim what you have not seen. If you cannot find it in your knowledge below, say so. An answer that sounds right is not a right answer.
2. You keep one place for each fact.
3. You do not hide a symptom. If something is wrong, say what and what happens next — not "sorry for the inconvenience".
4. You push back. If a request makes no sense, say so.

TONE: short, concrete, friendly. Lead with the consequence, not the mechanism. No warm-up pleasantries, no apologies, no emoji. Answer in the user's language.

YOU MAY: answer, explain, find, and guide around broberg.ai. Link to the site's own pages with relative paths (e.g. [The flagships](/en/flagships)) when they exist in your knowledge.
YOU MAY NOT: promise deliveries, agree prices or terms, send anything on anyone's behalf, or invent numbers — prices, dates and counts come from your knowledge below or not at all.

ACTION BUTTONS: when you point someone ONWARD — to contact, a case or a flagship — use the button syntax [knap:Text](/path), which renders as a real button. At most two buttons per answer, and only when the next step is an action; ordinary references in prose stay ordinary links. Examples:
- "Want to see how this fits your work? [knap:Talk it through with Christian](/en#kontakt)"
- "The case shows the whole journey. [knap:Read the case](/en/cases)"
If asked whether you are an AI, answer honestly: yes.

ABOUT THE NUMBERS IN YOUR STORY: the story below quotes marketing numbers from the day it was written. Do not treat them as facts — the live site map at the bottom is your source for what exists TODAY.

WHEN YOU DO NOT KNOW: say "I can't see that from here" and point to the contact form. Never fall back on general knowledge as if it came from the house's own material.`;

/** Levende viden: sitets eget søgeindeks, komprimeret til titel · linje · sti.
 *  Cachet kort (indekset bygges af det lokale content-store og er billigt, men
 *  ikke gratis pr. besked). */
let _digest: { locale: Locale; text: string; at: number } | null = null;
async function sitekort(locale: Locale): Promise<string> {
  if (_digest && _digest.locale === locale && Date.now() - _digest.at < 10 * 60_000) return _digest.text;
  const index = await buildSearchIndex(locale);
  const linjer = index
    .slice(0, 80)
    .map((e) => `- ${e.title} (${e.badge.toLowerCase()}): ${e.subtitle} → ${e.data}`)
    .join("\n");
  const text = `LEVENDE SITEKORT (${new Date().toISOString().slice(0, 10)}) — det der findes på broberg.ai lige nu:\n${linjer}`;
  _digest = { locale, text, at: Date.now() };
  return text;
}

// Sproget PÅFØRES modellen eksplicit (Christian 4/9): vidensbasen er DANSK
// som primært sprog, og den engelske samtale skal oversætte opslag i farten —
// det må aldrig afhænge af at modellen selv gætter det ud fra konteksten.
const SPROG_DA = `SAMTALENS SPROG: dansk. DIN VIDENSBASE ER PÅ DANSK — opslag heri citerer du direkte, med link til kilden.`;
const SPROG_EN = `CONVERSATION LANGUAGE: English. YOUR KNOWLEDGE BASE IS IN DANISH (its primary language): lookups below may arrive in Danish — translate their content fluently into English on the fly when you use them, keep proper nouns and product names as-is, and still cite and link the source.`;

export async function aidanSystemPrompt(locale: Locale): Promise<string> {
  const kontrakt = locale === "en" ? KONTRAKT_EN : KONTRAKT_DA;
  const sprog = locale === "en" ? SPROG_EN : SPROG_DA;
  const historie = locale === "en" ? backstoryEn : backstoryDa;
  return `${kontrakt}\n\n${sprog}\n\n=== DIN HISTORIE — hvem du er og hvor du kommer fra ===\n${historie}\n\n=== ${await sitekort(locale)}`;
}


// ── Trail-hjernen (spec §3) — KB'en «broberg.ai» hos app.trailmem.com.
// Pr. BESKED slås brugerens spørgsmål op i vidensbasen, og de bedste træf
// lægges i primeren med kilde-URL, så Aidan kan sige HVOR det står.
// Ship-dark: uden TRAIL_TOKEN/TRAIL_KB springes opslaget over, og Aidan kører
// videre på sitekortet alene — ingen død afhængighed i svar-vejen.
const TRAIL_API = process.env.TRAIL_API ?? "https://app.trailmem.com/api/v1";

export function trailConfigured(): boolean {
  return Boolean(process.env.TRAIL_TOKEN && process.env.TRAIL_KB);
}

export async function trailOpslag(spoergsmaal: string): Promise<string> {
  if (!trailConfigured()) return "";
  try {
    const ctl = new AbortController();
    // En langsom vidensbase må aldrig stalle chatten — så hellere et svar
    // uden opslag end en besøgende der kigger på tre prikker.
    const timer = setTimeout(() => ctl.abort(), 2500);
    const url = `${TRAIL_API}/knowledge-bases/${encodeURIComponent(process.env.TRAIL_KB!)}/search?q=${encodeURIComponent(spoergsmaal.slice(0, 200))}&limit=6`;
    const res = await fetch(url, {
      headers: {
        authorization: `Bearer ${process.env.TRAIL_TOKEN}`,
        "x-trail-tenant": process.env.TRAIL_TENANT ?? "broberg-ai",
      },
      signal: ctl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return "";
    const data = (await res.json()) as { documents?: Array<{ title?: string; highlight?: string; content?: string }> };
    const hits = (data.documents ?? []).slice(0, 6).map((d) => {
      const tekst = String(d.highlight ?? d.content ?? "")
        .replace(/<\/?mark>/g, "")
        .replace(/\s+/g, " ")
        .slice(0, 500);
      const kilde = /Kilde: (\S+)/.exec(String(d.content ?? d.highlight ?? ""))?.[1] ?? "";
      return `— ${d.title ?? "uden titel"}${kilde ? ` (${kilde})` : ""}: ${tekst}`;
    });
    if (!hits.length) return "";
    return `OPSLAG I DIN VIDENSBASE (Trail «broberg.ai») for netop dette spørgsmål — citér herfra og link til kilden når du bruger et opslag:\n${hits.join("\n")}`;
  } catch {
    return ""; // opslag er en forstærkning, aldrig en forudsætning
  }
}

// ── Ruterne ─────────────────────────────────────────────────────────────────

const MAX_BESKED = 2000;
const MAX_HISTORIK = 20;

/** GET /api/aidan/health — {ok} når chatten kan svare. */
export function handleAidanHealth(c: Context): Response {
  return c.json({ ok: aidanConfigured() }, aidanConfigured() ? 200 : 503);
}

/** POST /api/aidan/chat — SSE. Body: { messages: [{role,content}...], locale? }. */
export async function handleAidanChat(c: Context): Promise<Response> {
  if (!aidanConfigured()) return c.json({ error: "chat_not_configured" }, 503);
  if (rateLimited(c)) return c.json({ error: "rate_limited" }, 429);

  let body: { messages?: Array<{ role?: string; content?: string }>; locale?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }
  const locale: Locale = body.locale === "en" ? "en" : "da";
  const raa = Array.isArray(body.messages) ? body.messages : [];
  // Ren tekst-tur — IKKE SDK'ens Message: dens Uint8Array-generik kolliderer
  // med zod-inferensen i 0.38's egne typer, og indhold her er altid en streng.
  const messages: Array<{ role: "user" | "assistant"; content: string }> = raa
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-MAX_HISTORIK)
    .map((m) => ({ role: m.role as "user" | "assistant", content: String(m.content).slice(0, MAX_BESKED) }));
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return c.json({ error: "no_user_message" }, 400);
  }

  const sidste = messages[messages.length - 1].content;
  const [grund, opslag] = await Promise.all([aidanSystemPrompt(locale), trailOpslag(sidste)]);
  const system = opslag ? `${grund}\n\n=== ${opslag}` : grund;
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      try {
        for await (const ev of ai().chatStream({ tier: "smart", system, messages, maxTokens: 1200 })) {
          if (ev.type === "text") send("text", { delta: ev.delta });
          else if (ev.type === "error") send("error", { message: "model_error" });
        }
        send("done", {});
      } catch {
        // Detaljen hører til i loggen, ikke hos en fremmed i browseren.
        send("error", { message: "model_error" });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
