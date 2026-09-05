/* F008 — Featured-fladerne (alle tre godkendte mockups, ejerens noter 5/9):
 * Bånd (B, roterer + Læs-KNAP) · Forside-boks (C, featuredText ≠ manchet) ·
 * Listeside (A, ét menupunkt → samlet liste). Data: loadFeatured (compose). */
import type { FeaturedItem } from "@/content/compose.ts";
import type { Locale } from "@/config.ts";
import type { CmsRef } from "@/content/types.ts";
import { cmsAttrs } from "@/components/sections.tsx";
import { stripHtml } from "@/content/richtext.ts";

export function FeaturedBaand({ items, laes, maerke }: { items: FeaturedItem[]; laes: string; maerke: string }) {
  if (!items.length) return null;
  return (
    <div class="f-baand" data-testid="featured-baand">
      <span class="f-maerke">{maerke}</span>
      <span class="f-baand-spor">
        {items.map((it, i) => (
          <a class={`f-baand-punkt${i === 0 ? " akt" : ""}`} href={it.href} data-testid="featured-baand-titel">
            {stripHtml(it.title)}
          </a>
        ))}
      </span>
      {items.length > 1 ? (
        <span class="f-prikker" data-testid="featured-baand-prikker" aria-hidden="true">
          {items.map((_it, i) => (
            <i class={i === 0 ? "akt" : ""} />
          ))}
        </span>
      ) : null}
      <a class="f-laes" href={items[0].href} data-testid="featured-baand-laes">
        {laes} →
      </a>
    </div>
  );
}

export function FeaturedBoks({
  item,
  eyebrow,
  laes,
  maerke,
  globalsRef,
}: {
  item: FeaturedItem;
  eyebrow: string;
  laes: string;
  maerke: string;
  globalsRef?: CmsRef;
}) {
  return (
    <section class="f-sektion" data-testid="featured-boks">
      <div class="wrap">
        <div class="eyebrow" {...cmsAttrs(globalsRef, "featuredEyebrow")}>{eyebrow}</div>
        <div class="f-boks">
          <div class="f-boks-tekst">
            <span class="f-maerke">{maerke}</span>
            <h2>{stripHtml(item.title)}</h2>
            <p>{item.featuredText}</p>
            <a class="btn" href={item.href} data-testid="featured-boks-laes">
              {laes} →
            </a>
          </div>
          <div class="f-boks-visual" aria-hidden="true">
            <svg viewBox="0 0 260 140">
              <rect x="10" y="90" width="30" height="40" rx="4" fill="var(--blue)" opacity="0.35" />
              <rect x="50" y="60" width="30" height="70" rx="4" fill="var(--blue)" opacity="0.55" />
              <rect x="90" y="75" width="30" height="55" rx="4" fill="var(--blue)" opacity="0.45" />
              <rect x="130" y="35" width="30" height="95" rx="4" fill="var(--blue)" />
              <rect x="170" y="50" width="30" height="80" rx="4" fill="var(--blue)" opacity="0.7" />
              <polyline points="15,70 65,45 105,55 145,20 185,32 230,14" fill="none" stroke="var(--blue-light)" stroke-width="3" stroke-linecap="round" />
              <circle cx="230" cy="14" r="5" fill="var(--blue-light)" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
