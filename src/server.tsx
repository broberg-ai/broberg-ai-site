/* broberg.ai — Stack B server. Hono on Bun: SSR routes served from the local
   content store, the ICD receiver at /icd, and (in dev) on-the-fly asset
   serving so `bun run dev` is self-sufficient. In prod, built assets are served
   statically from dist/client. */
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { config } from "@/config.ts";
import { handleIcd } from "@/content/icd.ts";
import { ensureRoot } from "@/content/store.ts";
import { runBackfill, storeIsEmpty } from "@/content/backfill.ts";
import {
  renderHome,
  renderFlagships,
  renderFlagshipDetail,
  renderBlogPost,
  renderBlogIndex,
  renderTagPage,
  renderTagCloud,
  renderGenericPage,
} from "@/routes.tsx";
import { buildSearchIndex } from "@/content/compose.ts";
import { flagshipsSegment } from "@/i18n.ts";

const app = new Hono();
const html = (s: string) => new Response(s, { headers: { "content-type": "text/html; charset=utf-8" } });
const notFound = (s: string) => new Response(s, { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });

// Canonical-domain guard: 301 GET requests that land on the bare Fly host to
// https://broberg.ai (so a stale fly.dev tab never strands anyone + SEO).
// EXCLUDE /icd (cms POSTs the ICD push there) and /healthz (Fly health check) —
// redirecting those would break content pushes / mark the machine unhealthy.
app.use("*", async (c, next) => {
  // On HTTP/2 the Host header is empty (replaced by :authority), so fall back to
  // the request URL's host — otherwise the redirect never fires on Fly.
  let host = c.req.header("host") || "";
  if (!host) {
    try {
      host = new URL(c.req.url).host;
    } catch {
      /* ignore */
    }
  }
  const path = c.req.path;
  if (c.req.method === "GET" && host.startsWith("broberg-ai.fly.dev") && path !== "/icd" && path !== "/healthz") {
    return c.redirect(`https://broberg.ai${path}`, 301);
  }
  await next();
});

// Cache policy: SSR HTML can change every second (ICD edits + deploys), so it
// must always revalidate — this is what stopped Christian seeing stale pages.
// Hashed prod assets are immutable (a new deploy = a new URL). /icd + /healthz
// keep no cache header.
app.use("*", async (c, next) => {
  await next();
  const p = c.req.path;
  if (config.isProd && p.startsWith("/assets/")) c.header("cache-control", "public, max-age=31536000, immutable");
  else if (config.isProd && p.startsWith("/fonts/")) c.header("cache-control", "public, max-age=2592000");
  // cms-uploaded media (proxied) gets a day's cache — upload filenames are unique.
  else if (p.startsWith("/uploads/")) c.header("cache-control", "public, max-age=86400");
  else if (p === "/icd" || p === "/healthz") {
    /* leave default */
  } else c.header("cache-control", "no-cache, must-revalidate");
});

app.get("/healthz", (c) => c.json({ ok: true }));

// ⌘K search index — the prebuilt client-side fuzzy index (platforms + posts),
// built from the local cms store so search content stays editable in cms. The
// palette fetches this once on first open. Tiny + revalidated like SSR HTML.
app.get("/search-index.json", async (c) => {
  const locale = c.req.query("locale") === "en" ? "en" : "da";
  return c.json(await buildSearchIndex(locale));
});

// ICD content-push receiver (cms → us on every save/publish).
app.post("/icd", handleIcd);

// ── Assets ────────────────────────────────────────────────────────────────────
if (config.isProd) {
  app.use("/assets/*", serveStatic({ root: "./dist/client" }));
  app.use("/fonts/*", serveStatic({ root: "./public" }));
} else {
  // Dev: serve the brand stylesheet + a transpiled enhance bundle directly.
  // (Tailwind utilities are unused so far; prod runs the full Vite/Tailwind build.)
  let enhanceJs: string | null = null;
  app.get("/assets/app.css", async () => {
    const css = await Bun.file("src/styles/brand.css").text();
    return new Response(css, { headers: { "content-type": "text/css; charset=utf-8" } });
  });
  app.get("/assets/enhance.js", async () => {
    if (!enhanceJs) {
      const built = await Bun.build({ entrypoints: ["src/client/enhance.ts"], target: "browser", minify: true });
      enhanceJs = await built.outputs[0].text();
    }
    return new Response(enhanceJs, { headers: { "content-type": "text/javascript; charset=utf-8" } });
  });
  app.use("/fonts/*", serveStatic({ root: "./public" }));
}

// Media — same-origin raster assets (e.g. the About portrait) from public/media.
// Served via Bun.file so the response carries a correct Content-Length + native
// Range support (Hono serveStatic returned Content-Length: 0, which browsers
// honour → empty image even though curl GET streamed the bytes — cms bug report).
app.get("/media/*", async (c) => {
  const rel = c.req.path.replace(/^\/media\//, "");
  if (!rel || rel.includes("..")) return c.text("Not found", 404);
  const file = Bun.file(`./public/media/${rel}`);
  if (!(await file.exists())) return c.text("Not found", 404);
  // Buffer + explicit headers: a streamed Bun.file Response lost its
  // Content-Length/Content-Type through Hono → browsers saw an empty image.
  const buf = await file.arrayBuffer();
  const headers = new Headers();
  headers.set("content-type", file.type || "application/octet-stream");
  headers.set("content-length", String(buf.byteLength));
  return new Response(buf, { status: 200, headers });
});
// A miss must 404 — not fall through to the SPA page handler (which would
// answer 200 text/html and read as "broken image" to a curl/diagnostic).
app.all("/media/*", (c) => c.text("Not found", 404));

// Uploads — same-origin proxy to the cms media archive (Sanne's pattern, cms-core
// #1283). cms-uploaded images live on webhouse.app's volume; we stream them
// same-origin so content stays in cms (no repo commits) and it works for every
// broberg-ai upload. e.g. /uploads/cb-color-nr68.webp → globals.aboutImage.
app.get("/uploads/*", async (c) => {
  const rel = c.req.path.replace(/^\/uploads\//, "");
  if (!rel || rel.includes("..")) return c.text("Not found", 404);
  const upstream = `https://webhouse.app/api/uploads/${rel}?site=broberg-ai`;
  try {
    const res = await fetch(upstream);
    if (!res.ok) return c.text("Not found", 404);
    // Buffer to a sized body so the response carries a real Content-Length —
    // a streamed res.body left it at 0, which browsers honour → empty image.
    const buf = await res.arrayBuffer();
    const headers = new Headers();
    const ct = res.headers.get("content-type");
    if (ct) headers.set("content-type", ct);
    headers.set("content-length", String(buf.byteLength));
    return new Response(buf, { status: 200, headers });
  } catch {
    return c.text("Upstream error", 502);
  }
});
app.all("/uploads/*", (c) => c.text("Not found", 404));

// Favicon — ".ai" wordmark mark, served from public/ in dev + prod.
app.get("/favicon.svg", serveStatic({ path: "./public/favicon.svg" }));

// ── Pages ───────────────────────────────────────────────────────────────────
app.get("/", async () => html(await renderHome("da")));
app.get("/en", async () => html(await renderHome("en")));

// Flagships — locale-specific path segment (flagskibe ↔ flagships).
app.get(`/${flagshipsSegment("da")}`, async () => html(await renderFlagships("da")));
app.get(`/${flagshipsSegment("da")}/:slug`, async (c) => {
  const r = await renderFlagshipDetail("da", c.req.param("slug"));
  return r ? html(r) : notFound(renderGenericPage("da", "ikke-fundet"));
});
app.get(`/en/${flagshipsSegment("en")}`, async () => html(await renderFlagships("en")));
app.get(`/en/${flagshipsSegment("en")}/:slug`, async (c) => {
  const r = await renderFlagshipDetail("en", c.req.param("slug"));
  return r ? html(r) : notFound(renderGenericPage("en", "not-found"));
});

// Tags — cloud (/tags) + per-tag page (/tags/:tag), DA + EN. Registered BEFORE the
// catch-all blog/page routes so they win over /:slug and /:category/:slug.
app.get("/tags", async () => html(await renderTagCloud("da")));
app.get("/en/tags", async () => html(await renderTagCloud("en")));
app.get("/tags/:tag", async (c) => {
  const r = await renderTagPage("da", c.req.param("tag"));
  return r ? html(r) : notFound(renderGenericPage("da", "ikke-fundet"));
});
app.get("/en/tags/:tag", async (c) => {
  const r = await renderTagPage("en", c.req.param("tag"));
  return r ? html(r) : notFound(renderGenericPage("en", "not-found"));
});

// Blog: /:category/:slug (DA) and /en/:category/:slug (EN). A real post → its
// page; an unknown slug → 404 (not a 200 stub).
app.get("/en/:category/:slug", async (c) => {
  const r = await renderBlogPost("en", c.req.param("category"), c.req.param("slug"));
  return r ? html(r) : notFound(renderGenericPage("en", "not-found"));
});
app.get("/:category/:slug", async (c) => {
  const r = await renderBlogPost("da", c.req.param("category"), c.req.param("slug"));
  return r ? html(r) : notFound(renderGenericPage("da", "ikke-fundet"));
});

// Single segment: a category slug → its blog index; otherwise a generic page.
app.get("/en/:slug", async (c) => {
  const seg = c.req.param("slug");
  const idx = await renderBlogIndex("en", seg);
  return html(idx ?? renderGenericPage("en", seg));
});
app.get("/:slug", async (c) => {
  const seg = c.req.param("slug");
  const idx = await renderBlogIndex("da", seg);
  return html(idx ?? renderGenericPage("da", seg));
});

// ── Boot ──────────────────────────────────────────────────────────────────────
// Backfill BEFORE serving so the store is populated from cms before the first
// request — otherwise a cold start would briefly serve the thin skeleton. The
// persistent volume means this only runs on the very first boot; later restarts
// find the store already populated (storeIsEmpty=false) and skip it.
await ensureRoot();
if (await storeIsEmpty()) {
  try {
    const r = await runBackfill();
    console.log(r.skipped ? "[backfill] skipped (no read token)" : `[backfill] seeded ${r.seeded} docs`);
  } catch (e) {
    console.error("[backfill] failed — serving skeleton until ICD/backfill populates", e);
  }
}

console.log(`broberg.ai listening on :${config.port}`);
export default { port: config.port, fetch: app.fetch };
