// ICD (Instant Content Deployment) receiver.
//
// On every SAVE/publish in cms, cms POSTs the full document to this endpoint
// (the CONTENT-PUSH variant, cms revalidation.ts). We verify the HMAC over the
// RAW body, write the document to our local store (or delete it), and answer a
// fast 2xx. The site then serves from the local store — fully decoupled from
// cms, so it stays up even if cms is down.
//
// Contract (cms intercom #53/#54/#56):
//   Headers: X-CMS-Signature: sha256=<hex>, hex = HMAC-SHA256(secret, RAW body)
//            (NO timestamp header — that is the file-sync variant, not ours.)
//   Body:    { event, timestamp, site, paths[], collection, slug, action, document }
//            action ∈ created|updated|deleted|published|unpublished
//   Reply FAST 2xx. cms retries +1s/+4s/+16s on error/timeout (5s sync timeout).
//   Treat (collection, slug, action) idempotent.
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Context } from "hono";
import { config } from "@/config.ts";
import { put, del } from "@/content/store.ts";

type IcdAction = "created" | "updated" | "deleted" | "published" | "unpublished";

interface IcdBody {
  event: string;
  timestamp?: number;
  site?: string;
  paths?: string[];
  collection: string;
  slug: string;
  action: IcdAction;
  document: Record<string, unknown> | null;
}

const REMOVE_ACTIONS: ReadonlySet<IcdAction> = new Set(["deleted", "unpublished"]);

// Constant-time compare of two hex strings; false (not throw) on length mismatch.
function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function handleIcd(c: Context): Promise<Response> {
  const secret = config.revalidateSecret;
  if (!secret) return c.json({ error: "receiver not configured" }, 503);

  // Capture the RAW body BEFORE parsing — the HMAC is over these exact bytes.
  const raw = await c.req.text();

  const given = (c.req.header("x-cms-signature") || "").replace(/^sha256=/, "");
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  if (!given || !safeEqualHex(expected, given)) {
    return c.json({ error: "invalid signature" }, 401);
  }

  let body: IcdBody;
  try {
    body = JSON.parse(raw) as IcdBody;
  } catch {
    return c.json({ error: "invalid json" }, 400);
  }

  // Anti-replay: body.timestamp is signed (tamper-proof after HMAC), so reject
  // documents older than the configured window. Free hardening on top of HMAC.
  if (config.icdMaxAgeMs > 0 && typeof body.timestamp === "number") {
    if (Date.now() - body.timestamp > config.icdMaxAgeMs) {
      return c.json({ error: "stale document" }, 401);
    }
  }

  const { collection, slug, action } = body;
  if (!collection || !slug) return c.json({ error: "missing collection/slug" }, 400);

  try {
    if (REMOVE_ACTIONS.has(action)) {
      await del(collection, slug);
    } else if (body.document) {
      await put(collection, slug, body.document);
    } else {
      // updated/published with no document — treat as a removal to avoid serving
      // stale content.
      await del(collection, slug);
    }
  } catch (e) {
    // A write failure is worth a non-2xx so cms retries.
    return c.json({ error: "store write failed" }, 500);
  }

  return c.json({ ok: true });
}
