/* Det faste job (F007.3): udgives en side i CMS, sendes den automatisk til
 * Trail-KB'en — samme rensning som den manuelle sync, én kilde (trail-clip.ts).
 *
 * UDLØSES AF CMS'ETS WEBHOOK-STAGE (Christians arkitektur 4/9): F35-content-
 * webhooks er registreret PR. SITE i CMS-admin, så adfærden er et synligt
 * tilvalg for netop broberg-ai — ikke noget alle sites arver. Endpointet
 * herunder (/api/trail-ingest) er sitets modtager; død uden TRAIL_INGEST_SECRET.
 *
 * Kæden: cms udgiv → F35-webhook → /api/trail-ingest (HMAC) → (forsinket job)
 * → siden hentes fra vores egen server (ICD har imens lagt indholdet i storen),
 * renses og uploades med sourceUrl.
 *
 * DEBOUNCE 20s pr. URL: en artikel-import udgiver i bursts, og siden skal
 * hentes EFTER storen er skrevet — forsinkelsen giver også composition-lag
 * (sektioner, globals) tid til at være konsistente.
 *
 * DUBLET-SPÆRRE indtil trails upsert-på-sourceUrl (deres F243.1) er live: en
 * side der allerede står i KB'en springes over med en log-linje. Når upsert
 * lander, fjernes spærren, og et gen-push bliver en opdatering. Nye sider
 * (nye URL'er) pushes med det samme — det er dem det faste job er til.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Context } from "hono";
import { config } from "@/config.ts";
import { buildSearchIndex } from "@/content/compose.ts";
import { tilTekst, trailUploadSide } from "@/trail-clip.ts";
import type { Locale } from "@/config.ts";

const OFFENTLIG_BASE = process.env.SITE_BASE ?? "https://broberg.ai";
const VENT_MS = Number(process.env.TRAIL_PUSH_DELAY_MS ?? 20_000);

/** Samlinger hvis dokumenter ER en offentlig side. Resten (sections, globals,
 *  solutions, categories) er byggeklodser der komponeres IND i sider — dem
 *  dækker den manuelle fulde re-sync, ikke pr.-udgivelses-jobbet. */
const SIDE_SAMLINGER = new Set(["posts", "platforms"]);

const ventende = new Map<string, ReturnType<typeof setTimeout>>();

/** Dokument → offentlig sti, via sitets EGEN kanoniske kilde (søgeindekset —
 *  samme sted sitemap og ⌘K får stierne fra). Ingen gættet URL-skabelon. */
async function findSti(collection: string, slug: string, locale: Locale): Promise<string | null> {
  const praefiks = collection === "posts" ? "post" : "flagship";
  const index = await buildSearchIndex(locale);
  const entry = index.find((e) => e.id === `${praefiks}:${slug}`);
  return entry?.data ?? null;
}

async function pushSide(collection: string, slug: string, locale: Locale): Promise<void> {
  const sti = await findSti(collection, slug, locale);
  if (!sti) return; // ikke (længere) en offentlig side — intet at pushe
  const sourceUrl = `${OFFENTLIG_BASE}${sti}`;

  // Hent fra VORES EGEN server: storen er netop skrevet, så det rendrede er
  // friskere end den offentlige URL (CDN/andre replikaer er ikke et krav her).
  const res = await fetch(`http://127.0.0.1:${config.port}${sti}`);
  if (!res.ok) throw new Error(`side ${res.status}: ${sti}`);
  const html = await res.text();
  const titel = /<title>([^<]*)<\/title>/.exec(html)?.[1]?.trim() ?? sourceUrl;
  const tekst = tilTekst(html);
  if (tekst.length < 200) return; // en tynd side er støj i en vidensbase
  const udfald = await trailUploadSide(`# ${titel}\n\nKilde: ${sourceUrl}\n\n${tekst}\n`, sourceUrl);
  console.log(udfald === "uaendret"
    ? `[trail-push] uændret — KB'en har allerede præcis dette indhold: ${sourceUrl}`
    : `[trail-push] sendt til KB: ${sourceUrl}`);
}

/**
 * Har dette dokument en søskende på primærsproget?
 *
 * TO KENDETEGN, fordi ét ikke dækker. Målt 10/9 på alle 64 engelske dokumenter:
 *
 *   posts       27 af 27 har translationGroup   → første kendetegn virker
 *   platforms    0 af 14 har translationGroup   → den ville have spærret INGEN
 *
 * Første udgave spurgte kun om dokumentet HAR en `translationGroup`. For posts
 * er «har et felt» og «har en søskende» det samme; for platforms er de ikke,
 * og alle 14 engelske flagskibs-sider ville være røget til Trail igen ved næste
 * redigering. At Trail målte NUL siden filteret gik live betød ikke at det
 * dækkede dem — kun at ingen af dem var blevet gemt siden.
 *
 * Det er husets egen fejlform: en vagt der måler et FELTS tilstedeværelse frem
 * for den EGENSKAB der betyder noget.
 *
 * 1. `translationGroup` — CMS'ets egen kobling (F48), den samme navigationen
 *    bruger til sprogskiftet.
 * 2. SLUG-MØNSTRET `en-<slug>` — den konvention de oversatte dokumenter uden
 *    gruppe faktisk følger. Målt: alle 14 platforms + 19 andre danner par på
 *    den, og hver eneste dansk modpart findes.
 *
 * Kun ét af dem behøver at holde. Et dokument uden begge er enestående og
 * sendes — en engelsk-KUN side til et andet marked overlever derfor stadig.
 */
export function harSoeskendePaaPrimaersprog(
  doc: Record<string, unknown> | null,
  locale: Locale,
  slug?: string,
): boolean {
  if (locale === "da") return false; // primærsproget sendes altid
  const tg = doc?.translationGroup ?? (doc?.data as Record<string, unknown> | undefined)?.translationGroup;
  if (typeof tg === "string" && tg.trim() !== "") return true;
  const s = (slug ?? (typeof doc?.slug === "string" ? doc.slug : "")).trim();
  return s.startsWith("en-") && s.length > 3;
}

/** Planlæg et push. Fyrer-og-glemmer: webhook-svaret må ALDRIG vente på —
 *  eller vælte på — Trail. */
export function planlaegTrailPush(
  collection: string,
  slug: string,
  doc: Record<string, unknown> | null,
): void {
  if (!process.env.TRAIL_TOKEN || !process.env.TRAIL_KB) return; // ship-dark
  if (!SIDE_SAMLINGER.has(collection)) return;
  if (!doc || doc.status !== "published") return; // kladder hører ikke til i KB'en
  const dataLocale = (doc.data as Record<string, unknown> | undefined)?.locale;
  const locale: Locale = doc.locale === "en" || dataLocale === "en" ? "en" : "da";

  // PAUSE (Christian 9/9-2026): oversættelser sendes ikke til Trail.
  //
  // Hans begrundelse, og den er vidensbasens egen logik: «desto mere tekst der
  // er i hjernen, desto mere diluted bliver sandheden». Målt af Trail: 139
  // råkilder, 70 med en engelsk tvilling — halvdelen af korpusset er den samme
  // sandhed sagt to gange. Et opslag på «helpdesk» gav den engelske udgave som
  // nr. 3, lige under den danske original, altså to af seks pladser til ét svar.
  //
  // FORMEN ER TRAILS, ikke en flad sprogregel: spring over hvis dokumentet har
  // en SØSKENDE på primærsproget. En engelsk-KUN side til et andet marked
  // overlever derfor — med «spring alt engelsk over» ville den forsvinde uden
  // at nogen opdagede det.
  //
  // PRISEN, som Christian har taget stilling til: Aidan kan ikke citere den
  // publicerede engelske ordlyd — han oversætter den danske i farten. For fakta
  // er det ligegyldigt; for salgstekst er det et valg.
  //
  // OPHÆVES ved at fjerne dette kald. Det er en pause, ikke en arkitektur.
  if (harSoeskendePaaPrimaersprog(doc, locale, slug)) {
    console.log(`[trail-push] springer over — oversættelse med dansk søskende: ${collection}:${slug}`);
    return;
  }

  const noegle = `${collection}:${slug}`;
  const eksisterende = ventende.get(noegle);
  if (eksisterende) clearTimeout(eksisterende);
  ventende.set(
    noegle,
    setTimeout(() => {
      ventende.delete(noegle);
      pushSide(collection, slug, locale).catch((e) =>
        console.error(`[trail-push] fejlede for ${noegle}:`, e.message),
      );
    }, VENT_MS),
  );
}

/** Til tests: se og ryd den ventende kø. */
export function _trailPushTestState() {
  return {
    antalVentende: () => ventende.size,
    ryd: () => {
      for (const t of ventende.values()) clearTimeout(t);
      ventende.clear();
    },
  };
}

// ── Webhook-endpointet (Christians arkitektur, 4/9): CMS'ets F35-webhook-stage
// kalder registrerede endpoints pr. site — dette er broberg-ai's. Registreret
// i sitets contentWebhooks i CMS-admin (synligt + til/fra dér), signeret med
// HMAC over rå krop, præcis som ICD. Ship-dark uden TRAIL_INGEST_SECRET.
function ensHex(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export async function handleTrailIngest(c: Context): Promise<Response> {
  const secret = process.env.TRAIL_INGEST_SECRET;
  if (!secret) return c.json({ error: "not configured" }, 503);

  const raw = await c.req.text();
  const given = (c.req.header("x-webhook-signature") || "").replace(/^sha256=/, "");
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  if (!given || !ensHex(expected, given)) return c.json({ error: "invalid signature" }, 401);

  let body: {
    event?: string;
    fields?: Array<{ name?: string; value?: string }>;
    data?: Record<string, unknown> | null;
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return c.json({ error: "invalid json" }, 400);
  }

  // Kun indholds-hændelser der kan betyde en (ny) offentlig side. "updated"
  // tages med fordi en rettelse af en allerede udgivet side også skal frem —
  // planlaegTrailPush's status-tjek + dublet-spærren sorterer resten fra.
  if (body.event !== "content.published" && body.event !== "content.updated") {
    return c.json({ ok: true, ignored: body.event ?? "unknown" });
  }
  const felt = (navn: string) => body.fields?.find((f) => f.name === navn)?.value ?? "";
  const collection = felt("Collection");
  const slug = felt("Slug");
  if (!collection || !slug) return c.json({ error: "missing collection/slug" }, 400);

  planlaegTrailPush(collection, slug, (body.data as Record<string, unknown> | null) ?? null);
  return c.json({ ok: true });
}
