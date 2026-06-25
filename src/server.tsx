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
  renderGenericPage,
} from "@/routes.tsx";
import { flagshipsSegment } from "@/i18n.ts";

const app = new Hono();
const html = (s: string) => new Response(s, { headers: { "content-type": "text/html; charset=utf-8" } });
const notFound = (s: string) => new Response(s, { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });

app.get("/healthz", (c) => c.json({ ok: true }));

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

// Blog: /:category/:slug (DA) and /en/:category/:slug (EN).
app.get("/en/:category/:slug", (c) => html(renderBlogPost("en", c.req.param("category"), c.req.param("slug"))));
app.get("/:category/:slug", (c) => html(renderBlogPost("da", c.req.param("category"), c.req.param("slug"))));

// Generic pages last (most permissive).
app.get("/en/:slug", (c) => html(renderGenericPage("en", c.req.param("slug"))));
app.get("/:slug", (c) => html(renderGenericPage("da", c.req.param("slug"))));

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
