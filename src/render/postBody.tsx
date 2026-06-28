/* Post body renderer — interleaves a post's markdown `content` with embedded
   `[block:<slug>]` shortcodes. A shortcode on its OWN line is replaced by the
   resolved block-doc (cms `blocks` collection); the markdown segments between
   shortcodes render via richtextBlock (marked) inside `.richtext`. The post
   references its OWN locale's block slug, so resolution is an exact-slug lookup —
   no locale magic. An unresolved slug is skipped gracefully (never crashes). */
import { richtextBlock } from "@/content/richtext.ts";
import type { StoredDoc } from "@/content/store.ts";
import { PostBlock } from "@/render/postBlocks.tsx";

const BLOCK_RE = /^\[block:([a-z0-9-]+)\]\s*$/i;

type Part = { md: string } | { block: string };

function splitContent(content: string): Part[] {
  const parts: Part[] = [];
  let buf: string[] = [];
  const flush = () => {
    if (buf.length) {
      parts.push({ md: buf.join("\n") });
      buf = [];
    }
  };
  for (const line of content.split("\n")) {
    const m = line.match(BLOCK_RE);
    if (m) {
      flush();
      parts.push({ block: m[1] });
    } else {
      buf.push(line);
    }
  }
  flush();
  return parts;
}

/** Slugs referenced via [block:<slug>] in the content (deduped). The route uses
 *  this to pre-load only the block-docs a post actually embeds. */
export function extractBlockSlugs(content: string): string[] {
  const slugs = content
    .split("\n")
    .map((l) => l.match(BLOCK_RE))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => m[1]);
  return [...new Set(slugs)];
}

export function PostBody({ content, blocks }: { content: string; blocks: Record<string, StoredDoc> }) {
  return (
    <>
      {splitContent(content).map((p, i) =>
        "md" in p ? (
          p.md.trim() ? (
            <div class="richtext" key={i} dangerouslySetInnerHTML={{ __html: richtextBlock(p.md) }} />
          ) : null
        ) : blocks[p.block] ? (
          <PostBlock key={i} doc={blocks[p.block]} />
        ) : null,
      )}
    </>
  );
}
