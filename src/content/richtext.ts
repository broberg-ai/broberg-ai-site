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

export function richtextBlock(md: string): string {
  return md ? (marked.parse(md) as string) : "";
}
