/* Embeddable content blocks referenced from a post's richtext via `[block:<slug>]`
   (cms `blocks` collection, ICD'd to our store). One block-doc per slug; its
   `data.blockType` selects the view. Locked contract with cms:
     - comparison {label, less[], more[]}  → Før/Efter two-column (reuse .ctable)
     - notice     {label, text(md), variant: info|warning|tip} → .callout
     - carousel   {label, images[{url,alt}], caption} → image gallery
   0 hardcoded copy — every field comes from the cms doc. Unknown type → null
   (skip gracefully) so a new block kind never crashes a published post. */
import type { StoredDoc } from "@/content/store.ts";
import { richtextBlock } from "@/content/richtext.ts";
import { cmsAttrs } from "@/components/sections.tsx";
import type { CmsRef } from "@/content/types.ts";

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

export function PostBlock({ doc }: { doc: StoredDoc }) {
  const d = (doc.data ?? {}) as Record<string, unknown>;
  const type = str(d.blockType);
  const label = str(d.label);
  const isEn = doc.locale === "en";
  // F157 — these live in the `blocks` collection (their own docs), so inline-edit
  // targets the block-doc, not the host post.
  const ref: CmsRef = { collection: "blocks", slug: String(doc.slug), locale: (doc.locale as string) || "da" };

  switch (type) {
    case "comparison": {
      const less = arr(d.less);
      const more = arr(d.more);
      const rows = Math.max(less.length, more.length);
      if (!rows) return null;
      const [h1, h2] = isEn ? ["Before", "After"] : ["Før", "Efter"];
      return (
        <div class="card postblock postblock-compare" style="min-width:0">
          {label ? <div class="eyebrow" {...cmsAttrs(ref, "label")}>{label}</div> : null}
          <table class="ctable">
            <thead>
              <tr>
                <th>{h1}</th>
                <th>{h2}</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, i) => (
                <tr key={i}>
                  <td {...cmsAttrs(ref, `less.${i}`)}>{less[i] ?? ""}</td>
                  <td class="ctable-win" {...cmsAttrs(ref, `more.${i}`)}>{more[i] ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case "notice": {
      const variant = str(d.variant) || "info";
      const body = richtextBlock(str(d.text));
      if (!body && !label) return null;
      return (
        <div class={`card callout postblock postblock-notice notice-${variant}`}>
          {label ? <div class="eyebrow" {...cmsAttrs(ref, "label")}>{label}</div> : null}
          {body ? (
            <div
              class="richtext"
              data-cms-collection="blocks"
              data-cms-slug={String(doc.slug)}
              data-cms-field="text"
              data-cms-richtext="true"
              dangerouslySetInnerHTML={{ __html: body }}
            />
          ) : null}
        </div>
      );
    }
    case "carousel": {
      const images = Array.isArray(d.images)
        ? (d.images as { url: string; alt?: string; width?: number; height?: number }[])
        : [];
      if (!images.length) return null;
      return (
        <figure class="postblock postblock-carousel">
          <div class="block-gallery">
            {images.map((im, i) => (
              // width/height (when cms supplies the intrinsic dims) reserve the
              // box so the lazy image causes no layout-shift/CLS. CSS keeps
              // height:auto so the ratio stays responsive, no distortion.
              <img
                key={i}
                src={im.url}
                alt={im.alt ?? ""}
                loading="lazy"
                {...(im.width && im.height ? { width: im.width, height: im.height } : {})}
              />
            ))}
          </div>
          {d.caption ? <figcaption {...cmsAttrs(ref, "caption")}>{str(d.caption)}</figcaption> : null}
        </figure>
      );
    }
    default:
      return null;
  }
}
