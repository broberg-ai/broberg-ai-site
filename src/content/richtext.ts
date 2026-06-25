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

export function richtextInline(md: string): string {
  return md ? (marked.parseInline(md) as string) : "";
}

export function richtextBlock(md: string): string {
  return md ? (marked.parse(md) as string) : "";
}
