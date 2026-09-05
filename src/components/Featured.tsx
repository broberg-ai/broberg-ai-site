/* F008 — Featured-fladerne (alle tre godkendte mockups, ejerens noter 5/9):
 * Bånd (B, roterer + Læs-KNAP) · Forside-boks (C, featuredText ≠ manchet) ·
 * Listeside (A, ét menupunkt → samlet liste). Data: loadFeatured (compose). */
import type { FeaturedItem } from "@/content/compose.ts";
import type { CmsRef } from "@/content/types.ts";
import { cmsAttrs } from "@/components/sections.tsx";
import { stripHtml } from "@/content/richtext.ts";
import { Illustration, pickNewsIllustration } from "@/components/Illustrations.tsx";

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

/** Postens eget CMS-anker, så titel + featuredText kan rettes direkte på forsiden. */
function postRefOf(item: FeaturedItem): CmsRef {
  return { collection: "posts", slug: item.slug, locale: item.href.startsWith("/en") ? "en" : "da" };
}

/** Visual, i denne rækkefølge: artiklens eget STILLBILLEDE (en videos poster
 *  tæller med) → artiklens illustration.
 *
 *  pickNewsIllustration og IKKE hasIllustration: den første er dét artiklens
 *  egen top og nyhedslisten bruger, og den giver ALTID en tegning — er slug'en
 *  ikke specialtegnet, vælges en fast flagskibs-tegning ud fra navnet.
 *  hasIllustration svarer kun ja for de specialtegnede, så featured-boksen
 *  faldt tilbage til husets bølger for en artikel der HAR en fin animation på
 *  sin egen side (målt 6/9 på /ai-metode/selen-ikke-agenten). To flader der
 *  spørger forskelligt om samme ting giver to forskellige svar. */
function FeaturedVisual({ item }: { item: FeaturedItem }) {
  if (item.visualImg) return <img class="f-visual-billede" src={item.visualImg} alt="" loading="lazy" />;
  return <div class="f-illu"><Illustration k={pickNewsIllustration(item.slug)} /></div>;
}

export function FeaturedBoks({
  items,
  eyebrow,
  laes,
  maerke,
  alle,
  alleHref,
  globalsRef,
}: {
  items: FeaturedItem[];
  eyebrow: string;
  laes: string;
  maerke: string;
  alle: string;
  alleHref: string;
  globalsRef?: CmsRef;
}) {
  if (!items.length) return null;
  const stor = items[0];
  // ALLE resterende, ikke de to første. Loftet på 2 var en aflæsning af
  // mockup'ens tre kasser, ikke et krav — ejeren taggede 4 og så kun 3
  // (målt 6/9). Han styrer selv hvor mange der er featured; boksen viser dem.
  const smaa = items.slice(1);
  const storRef = postRefOf(stor);
  return (
    <section class="f-sektion" data-testid="featured-boks">
      <div class="wrap">
        <div class="eyebrow" {...cmsAttrs(globalsRef, "featuredEyebrow")}>{eyebrow}</div>
        <div class={smaa.length ? "f-grid" : "f-grid f-grid-en"}>
          <div class="f-boks">
            <div class="f-boks-tekst">
              <span class="f-maerke">{maerke}</span>
              <h2 {...cmsAttrs(storRef, "title")}>{stripHtml(stor.title)}</h2>
              <p {...cmsAttrs(storRef, "featuredText")}>{stor.featuredText}</p>
              <a class="btn" href={stor.href} data-testid="featured-boks-laes">
                {laes} →
              </a>
            </div>
            <div class="f-boks-visual" aria-hidden="true">
              <FeaturedVisual item={stor} />
            </div>
          </div>
          {smaa.length ? (
            <div class="f-stak" data-testid="featured-stak">
              {smaa.map((it) => {
                const ref = postRefOf(it);
                return (
                  <a class="f-lille" href={it.href} key={it.slug} data-testid="featured-lille">
                    <span class="f-maerke f-maerke-tynd">{maerke}</span>
                    <b {...cmsAttrs(ref, "title")}>{stripHtml(it.title)}</b>
                    <p {...cmsAttrs(ref, "featuredText")}>{it.featuredText}</p>
                    <span class="f-lille-laes">{laes} →</span>
                  </a>
                );
              })}
            </div>
          ) : null}
        </div>
        {items.length > 2 ? (
          <div class="f-flere">
            <a href={alleHref} data-testid="featured-alle" {...cmsAttrs(globalsRef, "featuredAlle")}>
              {alle} →
            </a>
          </div>
        ) : null}
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

