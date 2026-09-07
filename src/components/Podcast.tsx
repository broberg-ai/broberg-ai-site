/* F012 — podcast-siden, bygget efter den GODKENDTE mockup (cardmem
 * 01a07ba6-5eb0-79f3-9749-1b02b93b3511): hero med de to værter, den skrevne
 * intro, manuskript-princippet, arkivet, de fem trin, og hvor man lytter.
 *
 * TILSTAND: podcasten er UNDER PRODUKTION. Mockup'en viser en afspiller og et
 * fyldt arkiv; begge dele ville være en løgn i dag. Afspilleren er derfor
 * erstattet af en ærlig status, og arkivet har en tom-tilstand der siger hvad
 * der mangler frem for at vise et tomt gitter. Når første afsnit lander,
 * skiftes `afsnit` fra tom til en rigtig liste — resten af siden er uændret.
 *
 * AL TEKST KOMMER FRA CMS. Reserveteksterne herunder er en nødbremse, ikke et
 * hjem: værdierne ER skrevet ind i globals-dokumentet på begge sprog. Står der
 * en reservetekst på siden, betyder det at feltet er blevet slettet.
 */
import type { CmsRef } from "@/content/types.ts";
import { cmsAttrs } from "@/components/sections.tsx";

export type PodcastAfsnit = {
  nr: string;
  titel: string;
  manchet: string;
  laengde: string;
  href: string;
  nyt?: boolean;
};

export type PodcastTrin = { maerke: string; titel: string; tekst: string };

export type PodcastData = {
  eyebrow: string;
  heading: string;
  lead: string;
  vaerter: { initialer: string; navn: string; rolle: string }[];
  statusTitel: string;
  statusTekst: string;
  introTitel: string;
  introTekst: string;
  manuskriptTitel: string;
  manuskriptTekst: string;
  arkivTitel: string;
  arkivTom: string;
  afsnit: PodcastAfsnit[];
  trinTitel: string;
  trinEyebrow: string;
  trin: PodcastTrin[];
  lytTitel: string;
  lytTekst: string;
  /* Mærket på det nyeste afsnit. Eget felt frem for en streng i koden:
     gate:text fangede den, og den har ret — det er brugervendt tekst. */
  nytMaerke: string;
};

export function Podcast({
  data,
  cmsRef,
}: {
  data: PodcastData;
  cmsRef?: CmsRef;
}) {
  return (
    <main class="pod" data-testid="podcast-root">
      <section class="pod-hero" data-testid="podcast-hero">
        <p class="pod-eyebrow" {...cmsAttrs(cmsRef, "podcastEyebrow")} data-testid="podcast-eyebrow">
          {data.eyebrow}
        </p>
        <h1 class="pod-h1" {...cmsAttrs(cmsRef, "podcastHeading")} data-testid="podcast-heading">
          {data.heading}
        </h1>
        <p class="pod-lead" {...cmsAttrs(cmsRef, "podcastLead")} data-testid="podcast-lead">
          {data.lead}
        </p>

        <ul class="pod-vaerter" data-testid="podcast-vaerter">
          {data.vaerter.map((v) => (
            <li class="pod-vaert" data-testid="podcast-vaert">
              <span class="pod-avatar" aria-hidden="true">
                {v.initialer}
              </span>
              <span class="pod-vaert-tekst">
                <b>{v.navn}</b>
                <span>{v.rolle}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Under produktion — står hvor afspilleren skal stå, så siden er ærlig
          om at der endnu ikke er noget at trykke på. */}
      <section class="pod-status" data-testid="podcast-status">
        <span class="pod-status-prik" aria-hidden="true" />
        <div>
          <h2 class="pod-status-h" {...cmsAttrs(cmsRef, "podcastStatusTitel")} data-testid="podcast-status-titel">
            {data.statusTitel}
          </h2>
          <p {...cmsAttrs(cmsRef, "podcastStatusTekst")} data-testid="podcast-status-tekst">
            {data.statusTekst}
          </p>
        </div>
      </section>

      <section class="pod-blok" data-testid="podcast-intro">
        <h2 {...cmsAttrs(cmsRef, "podcastIntroTitel")} data-testid="podcast-intro-titel">
          {data.introTitel}
        </h2>
        <p class="pod-brod" {...cmsAttrs(cmsRef, "podcastIntroTekst")} data-testid="podcast-intro-tekst">
          {data.introTekst}
        </p>
      </section>

      <section class="pod-blok" data-testid="podcast-manuskript">
        <h2 {...cmsAttrs(cmsRef, "podcastManuskriptTitel")} data-testid="podcast-manuskript-titel">
          {data.manuskriptTitel}
        </h2>
        <p class="pod-brod" {...cmsAttrs(cmsRef, "podcastManuskriptTekst")} data-testid="podcast-manuskript-tekst">
          {data.manuskriptTekst}
        </p>
      </section>

      <section class="pod-blok" data-testid="podcast-arkiv">
        <h2 {...cmsAttrs(cmsRef, "podcastArkivTitel")} data-testid="podcast-arkiv-titel">
          {data.arkivTitel}
        </h2>
        {data.afsnit.length ? (
          <ul class="pod-arkiv" data-testid="podcast-arkiv-liste">
            {data.afsnit.map((a) => (
              <li>
                <a class="pod-kort" href={a.href} data-testid="podcast-arkiv-punkt">
                  <span class="pod-nr">{a.nr}</span>
                  <span class="pod-kort-tekst">
                    <b>
                      {a.titel}
                      {a.nyt ? <i class="pod-nyt">{data.nytMaerke}</i> : null}
                    </b>
                    <span>{a.manchet}</span>
                  </span>
                  <span class="pod-laengde">{a.laengde}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p class="pod-tom" {...cmsAttrs(cmsRef, "podcastArkivTom")} data-testid="podcast-arkiv-tom">
            {data.arkivTom}
          </p>
        )}
      </section>

      <section class="pod-blok pod-trin-blok" data-testid="podcast-trin">
        <p class="pod-eyebrow" {...cmsAttrs(cmsRef, "podcastTrinEyebrow")} data-testid="podcast-trin-eyebrow">
          {data.trinEyebrow}
        </p>
        <h2 {...cmsAttrs(cmsRef, "podcastTrinTitel")} data-testid="podcast-trin-titel">
          {data.trinTitel}
        </h2>
        <ol class="pod-trin" data-testid="podcast-trin-liste">
          {data.trin.map((t) => (
            <li class="pod-trin-punkt" data-testid="podcast-trin-punkt">
              <span class="pod-trin-maerke">{t.maerke}</span>
              <b>{t.titel}</b>
              <span>{t.tekst}</span>
            </li>
          ))}
        </ol>
      </section>

      <section class="pod-blok" data-testid="podcast-lyt">
        <h2 {...cmsAttrs(cmsRef, "podcastLytTitel")} data-testid="podcast-lyt-titel">
          {data.lytTitel}
        </h2>
        <p class="pod-brod" {...cmsAttrs(cmsRef, "podcastLytTekst")} data-testid="podcast-lyt-tekst">
          {data.lytTekst}
        </p>
      </section>
    </main>
  );
}
