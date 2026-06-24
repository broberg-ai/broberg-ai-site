/* Generic block renderer for the cms `blocks` field (sections.blocks +
   pages.blocks). 12 builtins, discriminator `_block`, fields flat as siblings
   (cms intercom #61). `columns` recurses into per-column slots with the same
   switch. `interactive` resolves an interactiveId to one of OUR bespoke widgets. */
import type { JSX } from "preact";

export interface Block {
  _block: string;
  [key: string]: unknown;
}

// The `interactive` block addresses EDITOR-EMBEDDED cms interactives by id
// (cms #62). Our 3 bespoke widgets (hero-frequency / universe-diagram /
// count-up) are NOT cms interactives — they are keyed on section `kind` and
// driven by cms props, so they are not registered here. Add real cms-Int ids
// to this map if/when editors embed any.
const INTERACTIVES: Record<string, () => JSX.Element> = {};

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

// `column-slots` stored shape is being confirmed with cms; tolerate both an
// array of blocks-arrays and an array of { blocks: Block[] }.
function slotBlocks(slot: unknown): Block[] {
  if (Array.isArray(slot)) return slot as Block[];
  if (slot && typeof slot === "object" && Array.isArray((slot as any).blocks)) {
    return (slot as any).blocks as Block[];
  }
  return [];
}

function RenderBlock({ block }: { block: Block }): JSX.Element | null {
  switch (block._block) {
    case "text":
      return <div class="block-text" dangerouslySetInnerHTML={{ __html: asString(block.body) }} />;
    case "textarea":
      return <p class="block-textarea">{asString(block.content)}</p>;
    case "richtext":
    case "htmldoc":
      return <div class="block-rich" dangerouslySetInnerHTML={{ __html: asString(block.content) }} />;
    case "image":
      return (
        <figure class="block-image">
          <img src={asString(block.src)} alt={asString(block.alt)} loading="lazy" />
          {block.caption ? <figcaption>{asString(block.caption)}</figcaption> : null}
        </figure>
      );
    case "image-gallery": {
      const images = Array.isArray(block.images) ? (block.images as { url: string; alt?: string }[]) : [];
      return (
        <div class="block-gallery">
          {images.map((im, i) => (
            <img key={i} src={im.url} alt={im.alt ?? ""} loading="lazy" />
          ))}
        </div>
      );
    }
    case "columns": {
      const slots = Array.isArray(block.columns) ? block.columns : [];
      return (
        <div class={`block-columns layout-${asString(block.layout) || "1-1"}`}>
          {slots.map((slot, i) => (
            <div class="block-col" key={i}>
              <RenderBlocks blocks={slotBlocks(slot)} />
            </div>
          ))}
        </div>
      );
    }
    case "video":
      return (
        <figure class="block-video">
          <video src={asString(block.src)} controls />
          {block.caption ? <figcaption>{asString(block.caption)}</figcaption> : null}
        </figure>
      );
    case "audio":
      return (
        <figure class="block-audio">
          <audio src={asString(block.src)} controls />
          {block.caption ? <figcaption>{asString(block.caption)}</figcaption> : null}
        </figure>
      );
    case "file":
      return (
        <a class="block-file" href={asString(block.src)} download data-testid="block-file-download">
          {asString(block.filename) || "Download"}
        </a>
      );
    case "interactive": {
      const Widget = INTERACTIVES[asString(block.interactiveId)];
      return Widget ? (
        <div class="block-interactive">
          <Widget />
        </div>
      ) : null;
    }
    case "form":
      // Forms are wired to a handler later; render a stable anchor for now.
      return <div class="block-form" data-form={asString(block.formName)} />;
    default:
      return null;
  }
}

export function RenderBlocks({ blocks }: { blocks: Block[] }): JSX.Element {
  return (
    <>
      {(blocks ?? []).map((b, i) => (
        <RenderBlock key={i} block={b} />
      ))}
    </>
  );
}
