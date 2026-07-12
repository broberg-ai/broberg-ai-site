/* FAQ accordion (F156.3) — new on the sales landing, no prior equivalent on
   the site. Toggled client-side in enhance.ts (faqAccordion), not inline
   onclick — matches the site's progressive-enhancement convention. */
import type { Locale } from "@/config.ts";
import type { CmsRef } from "@/content/types.ts";
import { cmsAttrs, cmsHtmlAttrs } from "@/components/sections.tsx";

export function Faq({
  items,
  locale,
  cmsRef,
  eyebrow,
  heading,
}: {
  items: [string, string][];
  locale: Locale;
  cmsRef?: CmsRef;
  eyebrow?: string;
  heading?: string;
}) {
  return (
    <section id="faq" style="background:var(--dark2)">
      <div class="wrap" style="max-width:700px">
        <div class="sec-head">
          <div class="eyebrow" {...cmsAttrs(cmsRef, "faqEyebrow")}>{eyebrow ?? "FAQ"}</div>
          <h2 {...cmsAttrs(cmsRef, "faqHeading")}>{heading ?? (locale === "en" ? "Frequently asked questions" : "Ofte stillede spørgsmål")}</h2>
        </div>
        {items.map(([q, a], i) => (
          <div class={`faq-item${i === 0 ? " open" : ""}`} key={i} data-testid={`faq-item-${i}`}>
            <button class="faq-q" data-testid={`faq-question-${i}`}>
              <span {...cmsAttrs(cmsRef, `faq.${i}.0`)}>{q}</span> <span class="faq-chev">▾</span>
            </button>
            <div class="faq-a" {...cmsHtmlAttrs(cmsRef, `faq.${i}.1`)} dangerouslySetInnerHTML={{ __html: a }} />
          </div>
        ))}
      </div>
    </section>
  );
}
