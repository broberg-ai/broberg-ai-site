/* broberg.ai — CMS AI-chat relay (same-origin SSE proxy to cms-admin).

   Christian's /admin/chat surface talks to cms-admin's full agentic chat (the
   ~64 build/version/control tools) without ever crossing origins in the
   browser — cms-admin's /api/cms/chat has no CORS, so a cross-origin fetch
   can't stream it. Instead the browser hits THIS same-origin relay, which
   streams cms-admin's SSE straight back.

   Auth has two independent halves:
   - The browser proves it's a connected admin with the 30-day, site-scoped
     editSession JWT it already holds (the "log ind via webhouse.app" inline-
     edit login). broberg can't verify that signature itself (no
     CMS_JWT_SECRET), so it DELEGATES the check to cms-admin — see
     callerIsConnectedAdmin().
   - The upstream call to cms-admin uses a server-side admin token
     (CMS_ADMIN_TOKEN, a wh_ access token) that NEVER reaches the browser.

   Ship-dark: with no CMS_ADMIN_TOKEN set, every relay route answers 503 and
   nothing half-wires. */
import type { Context } from "hono";
import { config } from "@/config.ts";

const CMS_BASE = "https://webhouse.app";
const SITE = config.site; // "broberg-ai"

// Read lazily (not a module const) so the ship-dark guard reflects the current
// env — and so tests can toggle configured/ship-dark against one import.
const adminToken = () => process.env.CMS_ADMIN_TOKEN ?? "";

/** The editSession JWT proves "admin/editor on THIS site". We can't verify the
 *  signature (no shared secret), so we ask cms-admin: a site-scoped GET its
 *  proxy allowlist gates on `requestSite === tokenSite`.
 *    200 / 404 → valid broberg-ai editor (auth ok; probe doc simply absent)
 *    403       → a valid token, but for another site  → reject
 *    401       → missing / invalid / expired token    → reject
 *  (A wh_ admin token would also pass — but the browser only ever holds the
 *  editSession token; a wh_ is an admin secret by definition, not public.) */
async function callerIsConnectedAdmin(c: Context): Promise<boolean> {
  const auth = c.req.header("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return false;
  try {
    const probe = await fetch(`${CMS_BASE}/api/cms/posts/__auth_probe__?site=${SITE}`, {
      headers: { authorization: auth },
    });
    return probe.status !== 401 && probe.status !== 403;
  } catch {
    return false;
  }
}

const notConfigured = (c: Context) => c.json({ error: "chat_not_configured" }, 503);
const unauthorized = (c: Context) => c.json({ error: "unauthorized" }, 401);

/** POST /api/admin/chat — streaming SSE relay to cms-admin's agentic chat. */
export async function handleAdminChat(c: Context): Promise<Response> {
  const token = adminToken();
  if (!token) return notConfigured(c);
  if (!(await callerIsConnectedAdmin(c))) return unauthorized(c);

  const body = await c.req.text();
  let upstream: Response;
  try {
    upstream = await fetch(`${CMS_BASE}/api/cms/chat?site=${SITE}`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body,
    });
  } catch {
    return c.json({ error: "upstream_unreachable" }, 502);
  }

  // Stream the SSE body straight through — NO buffering, or token-by-token
  // streaming collapses into one late chunk. SSE carries no Content-Length, so
  // the empty-image bug that forced the /uploads proxy to buffer doesn't apply.
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
}

/** ALL /api/admin/chat/* — JSON relay for conversation history + memory.
 *  These are the SAME per-site stores cms-admin's own chat uses, so broberg's
 *  Samtaler/Hukommelse stay in sync with webhouse.app. */
export async function handleAdminChatApi(c: Context): Promise<Response> {
  const token = adminToken();
  if (!token) return notConfigured(c);
  if (!(await callerIsConnectedAdmin(c))) return unauthorized(c);

  const url = new URL(c.req.url);
  const sub = url.pathname.replace(/^\/api\/admin\/chat\//, ""); // "conversations", "memory/x", …
  const params = new URLSearchParams(url.search);
  params.set("site", SITE);
  const upstreamUrl = `${CMS_BASE}/api/cms/chat/${sub}?${params.toString()}`;

  const method = c.req.method;
  const init: RequestInit = { method, headers: { authorization: `Bearer ${token}` } };
  if (method !== "GET" && method !== "HEAD") {
    init.body = await c.req.text();
    (init.headers as Record<string, string>)["content-type"] =
      c.req.header("content-type") ?? "application/json";
  }

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, init);
  } catch {
    return c.json({ error: "upstream_unreachable" }, 502);
  }
  const buf = await upstream.arrayBuffer();
  const headers = new Headers();
  const ct = upstream.headers.get("content-type");
  if (ct) headers.set("content-type", ct);
  return new Response(buf, { status: upstream.status, headers });
}
