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
import { VaertFigur } from "@/components/Figur.tsx";

export type PodcastAfsnit = {
  nr: string;
  titel: string;
  manchet: string;
  laengde: string;
  href: string;
  nyt?: boolean;
};

export type PodcastTrin = { maerke: string; titel: string; tekst: string };

/** Det afsnit der ligger i afspilleren. Undefined = intet udgivet endnu, og så
 *  står den ærlige «under produktion»-status i stedet. */
export type PodcastAktuelt = {
  slug: string;
  nr: string;
  titel: string;
  undertitel: string;
  dato: string;
  laengde: string;
  sekunder: number;
  lydUrl: string;
  replikker: { hvem: string; navn: string; tekst: string; tid: string; sek: number }[];
  /** Hvor reklamen ligger, i procent af afsnittet — tegnes som et mærke på
   *  søjlen. Lytteren kan se den komme i stedet for at blive overrasket. */
  sponsorFra?: number;
  sponsorTil?: number;
  /** Replikken reklamen ligger EFTER (0-indekseret). */
  sponsorEfterReplik?: number;
  sponsorMaerke: string;
};

export type PodcastData = {
  eyebrow: string;
  heading: string;
  lead: string;
  vaerter: { initialer: string; navn: string; rolle: string; figur?: "aidan" | "airina" }[];
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
  /** F012.1 — afspilleren. */
  aktuelt?: PodcastAktuelt;
  spolTilbage: string;
  afspil: string;
  pause: string;
  spolFrem: string;
  hastighed: string;
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
              {/* Christian, 8/9: «Brug denne som deres fulde Podcast avatar -
                  gerne din SVG animerede udgave». Han pegede på chat-widgetens
                  egen avatar: HELE figuren i en blå ring, ikke et udsnit af
                  hovedet. Det er den samme komponent — Figur.tsx — så de to
                  steder ikke kan drive fra hinanden.
                  Initialerne bliver stående som reserve: kender vi ikke værten,
                  er en bogstavcirkel bedre end et hul. */}
              {v.figur ? (
                <span class="pod-avatar pod-avatar-figur" data-vaert={v.figur}>
                  <VaertFigur vaert={v.figur} klasse="pod-avatar-krop" />
                </span>
              ) : (
                <span class="pod-avatar" aria-hidden="true">{v.initialer}</span>
              )}
              <span class="pod-vaert-tekst">
                <b>{v.navn}</b>
                <span>{v.rolle}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* F012.1 — AFSPILLEREN, når der er et udgivet afsnit. Er der ingen,
          står den ærlige «under produktion»-status i stedet. De to udelukker
          hinanden: en afspiller uden lyd og en status oven på et udgivet afsnit
          er begge løgne, bare i hver sin retning. */}
      {data.aktuelt ? (
        <section
          class="pod-afspiller"
          data-testid="podcast-afspiller"
          data-lyd={data.aktuelt.lydUrl}
          data-sekunder={String(data.aktuelt.sekunder)}
        >
          <div class="pod-cover" aria-hidden="true">
            <span>{data.aktuelt.nr}</span>
          </div>
          <div class="pod-afspiller-midt">
            <h2 class="pod-afspiller-titel" data-testid="podcast-afspiller-titel">
              {data.aktuelt.titel}
            </h2>
            <p class="pod-afspiller-sub" data-testid="podcast-afspiller-sub">
              {data.aktuelt.dato} · {data.aktuelt.laengde}
            </p>
            {/* Søjlen er en KNAP, ikke pynt: man skal kunne springe. Reklamens
                plads tegnes ovenpå, så den ikke kommer bag på nogen. */}
            <button
              type="button"
              class="pod-soejle"
              data-testid="podcast-soejle"
              aria-label={data.spolFrem}
            >
              <span class="pod-soejle-fyld" data-rolle="fyld" />
              <span class="pod-soejle-greb" data-rolle="greb" />
              {data.aktuelt.sponsorFra !== undefined && data.aktuelt.sponsorTil !== undefined ? (
                <span
                  class="pod-soejle-sponsor"
                  data-testid="podcast-soejle-sponsor"
                  title={data.aktuelt.sponsorMaerke}
                  style={`left:${data.aktuelt.sponsorFra}%;width:${data.aktuelt.sponsorTil - data.aktuelt.sponsorFra}%`}
                />
              ) : null}
            </button>
            <div class="pod-tider">
              <span data-rolle="nu" data-testid="podcast-tid-nu">0:00</span>
              <span data-rolle="rest">{data.aktuelt.laengde}</span>
            </div>
          </div>
          <div class="pod-knapper">
            <button type="button" class="pod-rund" data-testid="podcast-tilbage" aria-label={data.spolTilbage}>
              <span aria-hidden="true">15</span>
            </button>
            <button
              type="button"
              class="pod-rund pod-afspil"
              data-testid="podcast-afspil"
              aria-label={data.afspil}
              data-afspil={data.afspil}
              data-pause={data.pause}
            >
              <span aria-hidden="true" data-rolle="ikon">▶</span>
            </button>
            <button type="button" class="pod-rund" data-testid="podcast-frem" aria-label={data.spolFrem}>
              <span aria-hidden="true">15</span>
            </button>
            <button type="button" class="pod-fart" data-testid="podcast-fart" aria-label={data.hastighed}>
              1,0×
            </button>
          </div>
        </section>
      ) : (
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
      )}

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

        {/* Replikkerne. Hver er en KNAP: trykker man på en, springer afspilleren
            derhen. Det er den ene ting der gør et manuskript til mere end en
            udskrift — man kan finde stedet i stedet for at spole efter det. */}
        {data.aktuelt ? (
          <ol class="pod-replikker" data-testid="podcast-replikker">
            {data.aktuelt.replikker.map((r, i) => (
              <>
                {/* Reklamens plads MARKERES i manuskriptet. Uden den springer
                    tidsstemplet et helt minut uden forklaring, og en læser der
                    kigger efter en replik tror der mangler noget. */}
                {data.aktuelt && data.aktuelt.sponsorEfterReplik === i ? (
                  <li class="pod-pause" data-testid="podcast-manuskript-pause">
                    <span>{data.aktuelt.sponsorMaerke}</span>
                  </li>
                ) : null}
                <li class={`pod-replik pod-replik-${r.hvem}`}>
                <button
                  type="button"
                  class="pod-replik-knap"
                  data-testid="podcast-replik"
                  data-sek={String(r.sek)}
                >
                  <span class="pod-replik-hvem">
                    {r.navn}
                    <i class="pod-replik-tid">{r.tid}</i>
                  </span>
                  <span class="pod-replik-tekst">{r.tekst}</span>
                </button>
                </li>
              </>
            ))}
          </ol>
        ) : null}
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
