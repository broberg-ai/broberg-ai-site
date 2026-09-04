/* Trail-sync — «det der svarer til web-clipperen på samtlige sider» (Christian 4/9).
 *
 * To faser, så indsamlingen kan efterses før noget forlader huset:
 *   collect  sitemap.xml → én markdown-fil pr. side i .trail-sync/ (gitignored)
 *   push     hver fil → POST /api/v1/knowledge-bases/<KB>/documents/upload
 *            (multipart .md + metadata.sourceUrl) — trail chunker og kompilerer selv.
 *
 * Kør:  bun scripts/trail-sync.mjs collect
 *       TRAIL_TOKEN=trail_… TRAIL_KB=<kb-id-eller-slug> bun scripts/trail-sync.mjs push
 *
 * Token: trail_-nøgle scoped til broberg.ai-KB'en — fra vaulten/.env, ALDRIG i argv.
 * Re-sync: kør begge faser igen; trail dedup'er på indholds-hash, og en ændret side
 * bliver et nyt dokument (gammel udgave arkiveres manuelt indtil trail svarer på
 * overskrivnings-semantikken — spurgt i intercom #25542).
 */
const BASE = process.env.SITE_BASE ?? "https://broberg.ai";
const UD = new URL("../.trail-sync/", import.meta.url).pathname;

const fase = process.argv[2];
if (fase !== "collect" && fase !== "push") {
  console.error("brug: trail-sync.mjs collect|push");
  process.exit(1);
}

import { tilTekst } from "../src/trail-clip.ts";

function filnavn(url) {
  const p = new URL(url).pathname.replace(/\/$/, "") || "/forside";
  return p.replace(/^\//, "").replace(/[^a-zA-Z0-9æøåÆØÅ-]+/g, "_") + ".md";
}

if (fase === "collect") {
  const { mkdirSync, writeFileSync, rmSync } = await import("node:fs");
  rmSync(UD, { recursive: true, force: true });
  mkdirSync(UD, { recursive: true });

  const xml = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  console.log(`${urls.length} sider i sitemappet`);

  let ok = 0, tomme = 0, fejl = 0;
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) { fejl++; console.error(`  ${res.status} ${url}`); continue; }
      const html = await res.text();
      const titel = /<title>([^<]*)<\/title>/.exec(html)?.[1]?.trim() ?? url;
      const tekst = tilTekst(html);
      // En side uden reelt indhold (ren navigations-side) er støj i en KB.
      if (tekst.length < 200) { tomme++; continue; }
      const md = `# ${titel}\n\nKilde: ${url}\n\n${tekst}\n`;
      writeFileSync(UD + filnavn(url), md);
      ok++;
    } catch (e) {
      fejl++;
      console.error(`  FEJL ${url}: ${e.message}`);
    }
  }
  console.log(`skrevet: ${ok} · sprunget over (tyndt indhold): ${tomme} · fejl: ${fejl} → ${UD}`);
}

if (fase === "push") {
  const TOKEN = process.env.TRAIL_TOKEN;
  const KB = process.env.TRAIL_KB;
  const API = process.env.TRAIL_API ?? "https://app.trailmem.com/api/v1";
  if (!TOKEN || !KB) {
    console.error("TRAIL_TOKEN og TRAIL_KB skal være sat (token fra vaulten, aldrig argv)");
    process.exit(1);
  }
  const { readdirSync, readFileSync } = await import("node:fs");
  const filer = readdirSync(UD).filter((f) => f.endsWith(".md"));
  console.log(`pusher ${filer.length} sider til KB «${KB}»`);
  let ok = 0, fejl = 0;
  for (const f of filer) {
    const md = readFileSync(UD + f, "utf8");
    const kilde = /^Kilde: (.+)$/m.exec(md)?.[1];
    const form = new FormData();
    form.set("file", new File([md], f, { type: "text/markdown" }));
    form.set("path", "/broberg-ai-site");
    form.set("metadata", JSON.stringify({ connector: "broberg-ai-site-sync", sourceUrl: kilde }));
    const res = await fetch(`${API}/knowledge-bases/${encodeURIComponent(KB)}/documents/upload`, {
      method: "POST",
      // X-Trail-Tenant: en scope=all-nøgle falder ellers stille tilbage på hjemme-tenant (trail #25543)
      headers: { authorization: `Bearer ${TOKEN}`, "x-trail-tenant": process.env.TRAIL_TENANT ?? "broberg-ai" },
      body: form,
    });
    if (res.ok) { ok++; }
    else { fejl++; console.error(`  ${res.status} ${f}: ${(await res.text()).slice(0, 200)}`); }
  }
  console.log(`pushet: ${ok} · fejl: ${fejl}`);
  process.exit(fejl ? 1 : 0);
}
