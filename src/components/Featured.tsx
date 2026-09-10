/* F008 — Featured-fladerne (alle tre godkendte mockups, ejerens noter 5/9):
 * Bånd (B, roterer + Læs-KNAP) · Forside-boks (C, featuredText ≠ manchet) ·
 * Listeside (A, ét menupunkt → samlet liste). Data: loadFeatured (compose). */
import type { FeaturedItem } from "@/content/compose.ts";
import type { CmsRef } from "@/content/types.ts";
import { cmsAttrs } from "@/components/sections.tsx";
import { stripHtml } from "@/content/richtext.ts";
import { Illustration, pickNewsIllustration } from "@/components/Illustrations.tsx";

export function FeaturedBaand({ items, laes, maerke, alleHref }: { items: FeaturedItem[]; laes: string; maerke: string; alleHref: string }) {
  if (!items.length) return null;
  return (
    <div class="f-baand" data-testid="featured-baand">
      {/* F008.8 — mærket ligner en knap, så det skal opføre sig som én. Titlen og
          «Læs →» er begge links; mærket var det eneste i båndet der ikke
          reagerede. Adressen kommer fra withLocale, ikke fra en skrevet
          "/featured": den ville føre til den DANSKE liste fra en engelsk side,
          og gøre det i tavshed.

          KUN her. De to andre f-maerke på forsiden lades urørt — det ene sidder
          INDE I <a class="f-lille">, og et link i et link er ugyldigt: browseren
          reparerer det ved at bryde det ydre op, så hele kortet holdt op med at
          virke for at give mærket et link ingen bad om. */}
      <a class="f-maerke f-maerke-link" href={alleHref} data-testid="featured-baand-maerke">
        {maerke}
      </a>
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

/** Elementets eget CMS-anker, så titel + manchet kan rettes direkte på forsiden.
 *
 *  F008.7: hed postRefOf og hardkodede "posts". Nu hvor listen også rummer
 *  flagskibe og løsninger, ville det have skrevet en redigering af et
 *  flagskib-kort ind i posts-samlingen — tavst, i det forkerte dokument. */
function refOf(item: FeaturedItem): CmsRef {
  return { collection: item.collection, slug: item.slug, locale: item.href.startsWith("/en") ? "en" : "da" };
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

/* F008.10 — hvor mange små kort på FORSIDEN.
 *
 * Christian 10/9: «optimalt skal det være 1 stor 2 små, hvis den store har en
 * STOR Featured intro som "Byg jeres BI-dashboard fra bunden — hurtigere end
 * at tæmme Power BI" SÅ må du vise 3 små eller altid kun 2 små.»
 *
 * DET ER STAKKEN DER GØR SEKTIONEN LANG, ikke den store boks. Målt på
 * produktion 10/9, 1440px bred, med stræk slået fra så de naturlige højder
 * kunne læses:
 *
 *   tegn i titlen   den store boks' NATURLIGE højde
 *      67            609 px   «Byg jeres BI-dashboard fra bunden — …»
 *      38            418 px   «Aidan — assistenten der voksede op her»
 *      37            393 px   «Otte uger til en hel sundhedsplatform»
 *      23            363 px   «Seletøjet, ikke agenten»
 *       8            359 px   «helpdesk»
 *
 *   et lille kort er 215 px naturligt, mellemrum 16 px:
 *      2 kort = 446 px      3 kort = 677 px      4 kort = 907 px
 *
 * Fladen tager den HØJESTE af de to spalter. Så fire kort tvang en 359 px boks
 * op i 907 — det Christian så. To kort giver 446, altså det halve.
 *
 * Tre kort koster 677 px og er kun rimeligt når den store boks selv er høj:
 * BI-titlen på 67 tegn er den eneste af de seks der er det (609 px), og det er
 * netop den han peger på. Grænsen på 55 tegn ligger i det tomme spænd mellem
 * de to grupper — nærmeste målinger er 38 og 67 — så den er ikke sat på en
 * kant hvor et enkelt ord ville vippe den.
 *
 * Tegn og ikke pixels, fordi serveren ikke kan måle en browser. Porten
 * scripts/gate-featured.mjs måler den FÆRDIGE side og fanger det hvis
 * sammenhængen mellem de to skrider.
 */
export const FEATURED_SMAA_STANDARD = 2;
export const FEATURED_SMAA_LANG = 3;
export const FEATURED_LANG_TITEL_TEGN = 55;

/** Antal små kort ved siden af den store — 2, eller 3 når den stores egen
 *  overskrift er lang nok til at boksen bærer højden selv. */
export function antalSmaa(storTitel: string): number {
  return stripHtml(storTitel ?? "").trim().length >= FEATURED_LANG_TITEL_TEGN
    ? FEATURED_SMAA_LANG
    : FEATURED_SMAA_STANDARD;
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
  // F008.10 — Christian 9/9, med et skærmbillede af en forside med 1 stor + 4
  // små: «Forsiden sektionen må aldrig vise så mange features … Der skal MAX
  // være 1 stor og 3 små.»
  //
  // Her stod `items.slice(1)` — ALLE resterende — og kommentaren begrundede
  // det med at loftet på 2 var «en aflæsning af mockup'ens tre kasser, ikke et
  // krav». Det var rigtigt dengang der var tre dokumenter. Med seks vokser
  // sektionen ubemærket hver gang nogen sætter en stjerne: ingen ændring at
  // godkende, ingen commit, ingen der ser det ske. Ét ekstra kort ser ikke
  // forkert ud — det er først ved fem-seks at forsiden er blevet en liste.
  //
  // Loftet gælder KUN forsiden. Listesiden (/featured) viser stadig alle;
  // det er dét «Se alle featured»-linket nedenfor er til.
  const maks = antalSmaa(stor.title);
  const smaa = items.slice(1, 1 + maks);
  const storRef = refOf(stor);
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
                const ref = refOf(it);
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
        {items.length > 1 + maks ? (
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

/**
 * F008.6 — «DENNE side er featured».
 *
 * Til forskel fra FeaturedBaand, som viser de ANDRE featured-artikler og
 * roterer: båndet siger intet om den side man står på, så der fandtes ingen
 * måde at se at siden selv var fremhævet.
 *
 * Læser sidens EGET dokument og ikke loadFeatured(). Målt 7/9-2026: ★-knappen i
 * redigerings-FAB'en tilbydes på enhver side med et primært dokument og sætter
 * `featured` på hvad end samlingen er — mens loadFeatured() kun kender `posts`.
 * Spurgte emblemet dén, ville en stjerne på et flagskib blive ved med at være
 * virkningsløs: knappen siger ja, feltet gemmes, siden viser ingenting.
 *
 * Skjuler sig selv frem for at lade hvert kaldested gentage betingelsen — så
 * findes den negative kontrol ét sted i stedet for tre.
 */
export function FeaturedEmblem({ featured, tekst }: { featured: boolean; tekst: string }) {
  if (!featured) return null;
  return (
    <span class="f-maerke f-emblem" data-testid="featured-emblem">
      {tekst}
    </span>
  );
}
