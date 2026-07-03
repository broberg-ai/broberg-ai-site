#!/usr/bin/env node
/*
 * F157 inline-edit coverage audit.
 *
 * For each page it fetches the rendered HTML and lists every visible text run
 * that is NOT covered by a [data-cms-field] element (itself or an ancestor) —
 * i.e. everything that is still hardcoded and therefore NOT click-to-edit.
 *
 * It is a pure tokenizer (broberg's SSR HTML is clean, so no DOM lib needed).
 * It skips <script>/<style>/<svg> subtrees, aria-hidden subtrees (e.g. the
 * footer ticker's duplicate copy) and pure icon/symbol runs (→ ▾ · ⌘ …).
 *
 * The runs it still reports after a full sweep are the legitimate NON-content
 * items: the brand wordmark, functional toggles (locale/theme/search), status
 * badges, derived meta (read-time, dates, tag labels) and the HTML <title>.
 *
 * Usage:
 *   node scripts/audit-editable.mjs                 # audits https://broberg.ai
 *   node scripts/audit-editable.mjs http://localhost:3000
 */
const BASE = (process.argv[2] || "https://broberg.ai").replace(/\/$/, "");

// One representative URL per page template. Update the detail slugs if the
// example content is removed.
const PAGES = [
  ["/", "home"],
  ["/universet", "universet"],
  ["/flagskibe", "flagskibe-index"],
  ["/flagskibe/cardmem", "flagship-detail"],
  ["/losninger", "losninger-index"],
  ["/losninger/websites", "solution-detail"],
  ["/ai-metode", "blog-index"],
  ["/ai-metode/tre-arkitekturer-agent-hukommelse", "article"],
  ["/tags", "tag-cloud"],
  ["/tak", "thanks"],
  ["/indeks", "site-index"],
];

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
const SKIP = new Set(["script", "style", "svg", "path", "circle", "rect", "line", "g", "defs", "stop", "lineargradient", "radialgradient", "clippath", "text", "tspan", "use", "polygon", "polyline", "ellipse", "filter", "fegaussianblur", "femerge", "femergenode"]);

function audit(html) {
  const gaps = [];
  const stack = []; // { tag, hasCms, hiddenSelf, cls }
  let skipDepth = 0;
  let hiddenDepth = 0;
  const re = /<\/?([a-zA-Z][a-zA-Z0-9]*)((?:[^>"']|"[^"]*"|'[^']*')*)>|([^<]+)/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[3] !== undefined) {
      const text = m[3].replace(/\s+/g, " ").trim();
      if (!text || skipDepth > 0 || hiddenDepth > 0) continue;
      const letters = (text.match(/[\p{L}\p{N}]/gu) || []).length;
      if (letters < 2) continue; // pure icon/symbol/number noise
      if (/^[→▾·⌘\s\d↑↓×+]+$/u.test(text)) continue;
      if (!stack.some((s) => s.hasCms)) {
        const parent = stack[stack.length - 1];
        gaps.push({ text: text.slice(0, 60), tag: parent?.tag ?? "?", cls: parent?.cls ?? "" });
      }
      continue;
    }
    const raw = m[0];
    const tag = m[1].toLowerCase();
    const isClose = raw[1] === "/";
    const attrs = m[2] || "";
    const selfClose = /\/\s*>$/.test(raw) || VOID.has(tag);
    if (isClose) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tag === tag) {
          if (stack[i].hiddenSelf) hiddenDepth = Math.max(0, hiddenDepth - 1);
          stack.length = i;
          break;
        }
      }
      if (SKIP.has(tag) && skipDepth > 0) skipDepth = Math.max(0, skipDepth - 1);
      continue;
    }
    if (SKIP.has(tag)) { if (!selfClose) skipDepth++; continue; }
    if (selfClose) continue;
    const hiddenSelf = /aria-hidden="true"/.test(attrs);
    if (hiddenSelf) hiddenDepth++;
    const clsMatch = attrs.match(/class="([^"]*)"/);
    stack.push({
      tag,
      hasCms: /data-cms-field/.test(attrs) || stack.some((s) => s.hasCms),
      hiddenSelf,
      cls: clsMatch ? clsMatch[1].slice(0, 30) : "",
    });
  }
  return gaps;
}

let total = 0;
for (const [path, label] of PAGES) {
  let html;
  try {
    const res = await fetch(`${BASE}${path}`);
    html = await res.text();
  } catch (err) {
    console.log(`\n===== ${label}  (${path})  — FETCH FAILED: ${err.message} =====`);
    continue;
  }
  const gaps = audit(html);
  total += gaps.length;
  console.log(`\n===== ${label}  (${path})  — ${gaps.length} uncovered text runs =====`);
  const seen = new Set();
  for (const g of gaps) {
    if (seen.has(g.text)) continue;
    seen.add(g.text);
    console.log(`  [${g.tag}${g.cls ? "." + g.cls : ""}]  ${JSON.stringify(g.text)}`);
  }
}
console.log(`\n${total} uncovered text runs across ${PAGES.length} pages (${BASE}).`);
