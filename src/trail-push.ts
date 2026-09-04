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
import { tilTekst, trailHarSide, trailUploadSide } from "@/trail-clip.ts";
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

  if (await trailHarSide(sourceUrl)) {
    // Dublet-spærren — fjernes når trails upsert-på-sourceUrl er live.
    console.log(`[trail-push] springer over (findes allerede, afventer upsert): ${sourceUrl}`);
    return;
  }

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
