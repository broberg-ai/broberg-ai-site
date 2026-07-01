/* FAQ accordion (F156.3) — new on the sales landing, no prior equivalent on
   the site. Toggled client-side in enhance.ts (faqAccordion), not inline
   onclick — matches the site's progressive-enhancement convention. */
import type { Locale } from "@/config.ts";

export function Faq({ items, locale }: { items: [string, string][]; locale: Locale }) {
  return (
    <section id="faq" style="background:var(--dark2)">
      <div class="wrap" style="max-width:700px">
        <div class="sec-head">
          <div class="eyebrow">FAQ</div>
          <h2>{locale === "en" ? "Frequently asked questions" : "Ofte stillede spørgsmål"}</h2>
        </div>
        {items.map(([q, a], i) => (
          <div class={`faq-item${i === 0 ? " open" : ""}`} key={q} data-testid={`faq-item-${i}`}>
            <button class="faq-q" data-testid={`faq-question-${i}`}>
              {q} <span class="faq-chev">▾</span>
            </button>
            <div class="faq-a">{a}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
