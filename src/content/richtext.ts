// cms `richtext` fields store MARKDOWN, not HTML (cms contract; their blog
// example runs marked.parse over them). The consumer renders it. Every place
// that injects a richtext field as HTML MUST go through one of these so a
// WYSIWYG save (which writes `**bold**`) renders correctly instead of showing
// literal asterisks. Content is admin-authored/trusted, so no sanitizer.
//
// Use richtextInline for one-line fields (no <p> wrapper); richtextBlock for
// full article bodies. text/textarea fields (heading/subheading/eyebrow) are
// intentional HTML snippets — do NOT pass those through here.
import { marked } from "marked";
import { resolveCmsLinks } from "@broberg/cms-inline-edit/server";
import { cmsLinkLookup, ensureFreshLinkLookup } from "./link-lookup.ts";

marked.setOptions({ gfm: true, breaks: false });

const renderer = new marked.Renderer();
const _link = renderer.link.bind(renderer);
// marked v18: renderer.link takes a single token object ({ href, title, tokens }).
renderer.link = (token) => {
  const html = _link(token);
  if (token.href && /^https?:\/\//.test(token.href))
    return html.replace("<a ", '<a target="_blank" rel="noopener noreferrer" ');
  return html;
};
const _table = renderer.table.bind(renderer);
// A wide comparison table (5+ columns) can't be squeezed to fit a phone
// screen without either breaking words mid-string or clipping columns
// unreachable — CSS overflow-x on the <table> element itself is unreliable
// across browsers once its children need table-row/table-cell display. A
// wrapper div with overflow-x:auto is the one pattern that reliably scrolls.
renderer.table = (token) => `<div class="richtext-table-scroll">${_table(token)}</div>`;
marked.setOptions({ renderer });

export function richtextInline(md: string): string {
  return md ? (marked.parseInline(md) as string) : "";
}

// `[cta:<url>|<label>]` on its own line → a real primary button (.btn), for
// article CTAs. Kept as a plain-text shortcode (not raw HTML in the source) so
// it round-trips through a richtext-editor save as text instead of degrading
// back to a plain link. Expanded to trusted HTML at render time (no sanitizer,
// same as the rest of richtextBlock).
const CTA_RE = /^\[cta:\s*([^\]|]+?)\s*\|\s*([^\]]+?)\s*\]\s*$/gim;
function expandCtas(md: string): string {
  return md.replace(
    CTA_RE,
    (_m, href, label) =>
      `\n<p class="post-cta"><a class="btn" href="${String(href).trim()}">${String(label).trim()} <span class="ar">→</span></a></p>\n`,
  );
}

export function richtextBlock(md: string): string {
  if (!md) return "";
  const html = marked.parse(expandCtas(md)) as string;
  // cms F164 — a link the editor made to a PAGE carries data-cms-ref, so it can
  // be re-pointed here when that page moves or is renamed. A reference we don't
  // recognise keeps the href it was stored with, so this can only ever improve
  // a link, never break one.
  ensureFreshLinkLookup();
  return resolveCmsLinks(html, cmsLinkLookup);
}

/**
 * Ren tekst ud af en titel til faneblad, deling og KORTLISTER.
 *
 * `posts.title` er et rich, inline-redigerbart felt (artiklens <h1> bærer
 * data-cms-html), så en overskrift der er rettet på det live site er gemt som
 * HTML: "Seletøjet, <em>ikke agenten</em>". Artiklen skal vise kursiven; et
 * kort i en liste skal ikke vise taggene som tekst.
 *
 * Lå tidligere som en privat kopi i routes.tsx, hvor sections.tsx ikke kunne nå
 * den — og derfor renderede forsidens kort titlen rå. Én kilde nu.
 * No-op på en gammeldags ren titel.
 */
export function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "");
}
