/* F008 — Featured-fladerne (alle tre godkendte mockups, ejerens noter 5/9):
 * Bånd (B, roterer + Læs-KNAP) · Forside-boks (C, featuredText ≠ manchet) ·
 * Listeside (A, ét menupunkt → samlet liste). Data: loadFeatured (compose). */
import type { FeaturedItem } from "@/content/compose.ts";
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
  // Titel + featuredText ankres til POST-dokumentet, så de er inline-
  // redigerbare på forsiden (Gate A.1 fangede de to som gaps).
  const postRef: CmsRef = { collection: "posts", slug: item.slug, locale: item.href.startsWith("/en") ? "en" : "da" };
  return (
    <section class="f-sektion" data-testid="featured-boks">
      <div class="wrap">
        <div class="eyebrow" {...cmsAttrs(globalsRef, "featuredEyebrow")}>{eyebrow}</div>
        <div class="f-boks">
          <div class="f-boks-tekst">
            <span class="f-maerke">{maerke}</span>
            <h2 {...cmsAttrs(postRef, "title")}>{stripHtml(item.title)}</h2>
            <p {...cmsAttrs(postRef, "featuredText")}>{item.featuredText}</p>
            <a class="btn" href={item.href} data-testid="featured-boks-laes">
              {laes} →
            </a>
          </div>
          <div class="f-boks-visual" aria-hidden="true">
            {item.visualVideo ? (
              <video class="f-visual-video" autoplay muted loop playsinline preload="metadata" poster={item.visualPoster} src={item.visualVideo}></video>
            ) : item.visualImg ? (
              <img class="f-visual-billede" src={item.visualImg} alt="" loading="lazy" />
            ) : (
              <FeaturedAnimation />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Fælles featured-animation — forsidens egne bølger (samme wOut-klasser og
 *  animation fra brand.css), så en artikel uden egen visual arver husets puls. */
export function FeaturedAnimation() {
  return (
    <svg class="f-anim" viewBox="200 90 220 160" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="fFeat" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#00b2ff" />
          <stop offset="1" stop-color="#40c8ff" />
        </linearGradient>
      </defs>
      <path class="wOut" d="M236 170 q10 -42 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="url(#fFeat)" stroke-width="3" fill="none" />
      <path class="wOut o2" d="M236 170 q10 -26 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="#00b2ff" stroke-width="2" fill="none" opacity="0.5" />
      <path class="wOut o3" d="M236 170 q10 -58 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="#00b2ff" stroke-width="1.4" fill="none" opacity="0.25" />
      <circle cx="236" cy="170" r="4" fill="#00b2ff" />
    </svg>
  );
}

