/* Aidan — besøgs-AI'ens flade: FAB (reveal ved første scroll) + chatpanel.
 *
 * SSR'et i page()-shell'en på hver offentlig side, KUN når aidanConfigured()
 * — ship-dark: ingen nøgle, ingen knap. Alt klient-liv (reveal, vink, chat)
 * bor i enhance.ts's aidan(); denne fil er markup + CMS-tekster.
 *
 * TEKSTERNE kommer fra globals-dokumentet (hard rule: tekst bor i CMS'et).
 * Fallbacks er nødbremser mod en pre-seed-tilstand, ikke tekstens hjem —
 * værdierne ER skrevet ind i begge sprogs globals og læst tilbage.
 *
 * FIGUREN er husets kanoniske SVG som stillbillede og de to tema-bagte
 * vinke-klip fra artiklerne (g2-*-mp4, allerede i drift på /uploads). Begge
 * temaers klip ligger i DOM'en; CSS viser det ene — samme mønster som
 * artiklernes fig-box, så figurKlip-logikken genkendes.
 */
import type { CmsRef } from "@/content/types.ts";
import type { Locale } from "@/config.ts";
import { cmsAttrs, cmsHtmlAttrs } from "@/components/sections.tsx";
import { richtextBlock } from "@/content/richtext.ts";

const STILL = "/uploads/aidan-kanonisk-rfjl.svg";
const KLIP_MOERK = "/uploads/g2-aidan-moerk-s45h.mp4";
const KLIP_LYS = "/uploads/g2-aidan-lys-6kty.mp4";
// F007.8.2: Airina — Aidans kvindelige modstykke (figurerne fra supers Assets).
const AIRINA_STILL = "/uploads/airina-klasser-77ms.svg";
const AIRINA_MOERK = "/uploads/airina-tema-moerk-kdtq.mp4";
const AIRINA_LYS = "/uploads/airina-tema-lys-656n.mp4";

export interface AidanTekster {
  boble: string;
  navn: string;
  rolle: string;
  hilsen: string;
  /** Én chip pr. linje. */
  chips: string;
  placeholder: string;
  disclaimer: string;
  velkommen: string;
  fortsaet: string;
  startNy: string;
  tidligere: string;
  nySamtale: string;
  ingenSamtaler: string;
  nytSvar: string;
  forslag: string;
  laesTilbud: string;
  laesHenter: string;
  laesPause: string;
  laesVidere: string;
  laesFejl: string;
  info: string;
  omTitel: string;
  omMd: string;
  svarMail: string;
  opsummer: string;
  fejlRetry: string;
  travlt: string;
  statusOk: string;
  statusFejl: string;
  tidBesked: string;
  hilsenSide: string;
  kopier: string;
  kopieret: string;
  transTilbud: string;
  vaelgStemme: string;
  stemmeAidan: string;
  stemmeAirina: string;
  mailTilbud: string;
  mailFelt: string;
  mailSamtykke: string;
  mailSend: string;
  mailSendt: string;
  mailFejl: string;
  airinaNavn: string;
  airinaBoble: string;
  airinaHilsen: string;
  airinaDisclaimer: string;
  airinaPlaceholder: string;
}

export function aidanTekster(
  g: (field: string, fallback: string) => string,
  locale: Locale,
): AidanTekster {
  const en = locale === "en";
  return {
    boble: g("aidanBoble", en ? "Hi — I'm Aidan" : "Hej — jeg er Aidan"),
    navn: g("aidanNavn", "Aidan"),
    rolle: g("aidanRolle", en ? "AI guide at broberg.ai" : "AI-guide på broberg.ai"),
    hilsen: g(
      "aidanHilsen",
      en
        ? "Hi! I'm Aidan — I know this whole universe. Ask me about the cases, the flagships, or what we can build for you."
        : "Hej! Jeg er Aidan — jeg kender hele universet her. Spørg mig om cases, flagskibe eller hvad vi kan bygge for dig.",
    ),
    chips: g(
      "aidanChips",
      en
        ? "Show me your cases\nWhat can you build for me?\nHow do you work?"
        : "Vis mig jeres cases\nHvad kan I bygge for mig?\nHvordan arbejder I?",
    ),
    placeholder: g("aidanPlaceholder", en ? "Write to Aidan…" : "Skriv til Aidan…"),
    velkommen: g("aidanVelkommen", en ? "Welcome back. Last time we talked about" : "Velkommen tilbage. Sidst talte vi om"),
    fortsaet: g("aidanFortsaet", en ? "Continue" : "Fortsæt"),
    startNy: g("aidanStartNy", en ? "Start new" : "Start ny"),
    tidligere: g("aidanTidligere", en ? "Previous conversations" : "Tidligere samtaler"),
    nySamtale: g("aidanNySamtale", en ? "New conversation" : "Ny samtale"),
    ingenSamtaler: g("aidanIngenSamtaler", en ? "No previous conversations yet" : "Ingen tidligere samtaler endnu"),
    nytSvar: g("aidanNytSvar", en ? "New reply" : "Nyt svar"),
    forslag: g("aidanForslag", en ? "Suggestions" : "Forslag"),
    laesTilbud: g("aidanLaesTilbud", en ? "Want me to read the article aloud?" : "Skal jeg læse artiklen højt for dig?"),
    laesHenter: g("aidanLaesHenter", en ? "Fetching the reading…" : "Henter oplæsningen…"),
    laesPause: g("aidanLaesPause", en ? "Pause" : "Pause"),
    laesVidere: g("aidanLaesVidere", en ? "Resume reading" : "Fortsæt oplæsningen"),
    laesFejl: g("aidanLaesFejl", en ? "Couldn't fetch the reading — try again" : "Kunne ikke hente oplæsningen — prøv igen"),
    info: g(
      "aidanInfo",
      en
        ? "Aidan is broberg.ai's own AI guide — built on the house components with this whole universe as its knowledge base. Answers may contain mistakes."
        : "Aidan er broberg.ai's egen AI-guide — bygget på husets komponenter og med hele universet her som vidensbase. Svar kan indeholde fejl.",
    ),
    omTitel: g("aidanOmTitel", en ? "About Aidan & Airina" : "Om Aidan & Airina"),
    omMd: g("aidanOmMd", ""),
    svarMail: g("aidanSvarMail", en ? "Send this answer to me" : "Send dette svar til mig"),
    opsummer: g("aidanOpsummer", en ? "Get a summary of our chat" : "Få en opsummering af samtalen"),
    fejlRetry: g("aidanFejlRetry", en ? "Try again" : "Prøv igen"),
    travlt: g("aidanTravlt", en ? "I'm still thinking — try again in a moment" : "Jeg tænker stadig — prøv igen om et øjeblik"),
    statusOk: g("aidanStatusOk", en ? "All systems running · response {ms} ms · data in the EU" : "Alle systemer kører · svartid {ms} ms · data i EU"),
    statusFejl: g("aidanStatusFejl", en ? "Status is unavailable right now" : "Status kan ikke hentes lige nu"),
    tidBesked: g("aidanTidBesked", en ? "Can we meet {tid}?" : "Kan vi mødes {tid}?"),
    hilsenSide: g("aidanHilsenSide", en
      ? "PS: I see you've been reading \u201c{titel}\u201d \u2014 great pick. Ask away if you'd like to hear what it could do for your business."
      : "PS: Jeg kan se du har kigget p\u00e5 \u00ab{titel}\u00bb \u2014 godt valg. Sp\u00f8rg l\u00f8s, hvis du vil h\u00f8re hvad det kan g\u00f8re for jeres forretning."),
    kopier: g("aidanKopier", en ? "Copy" : "Kopiér"),
    kopieret: g("aidanKopieret", en ? "Copied" : "Kopieret"),
    transTilbud: g("aidanTransTilbud", en ? "Get the whole conversation by email" : "Få hele samtalen tilsendt på mail"),
    vaelgStemme: g("aidanVaelgStemme", en ? "Who should read aloud?" : "Hvem skal læse højt?"),
    stemmeAidan: g("aidanStemmeAidan", en ? "Aidan — male voice" : "Aidan — mandlig stemme"),
    stemmeAirina: g("aidanStemmeAirina", en ? "Airina — female voice" : "Airina — kvindelig stemme"),
    mailTilbud: g("aidanMailTilbud", en ? "Want the reading sent to you as an audio file?" : "Vil du have oplæsningen tilsendt som lydfil?"),
    mailFelt: g("aidanMailFelt", en ? "your@email.com" : "din@mail.dk"),
    mailSamtykke: g("aidanMailSamtykke", en ? "Yes — send me the audio file and relevant news from broberg.ai" : "Ja tak — send mig lydfilen og relevant nyt fra broberg.ai"),
    mailSend: g("aidanMailSend", en ? "Send" : "Send"),
    mailSendt: g("aidanMailSendt", en ? "Sent — check your inbox" : "Sendt — tjek din indbakke"),
    mailFejl: g("aidanMailFejl", en ? "Couldn't send — try again" : "Kunne ikke sende — prøv igen"),
    airinaNavn: g("airinaNavn", "Airina"),
    airinaBoble: g("airinaBoble", en ? "Hi — I'm Airina" : "Hej — jeg er Airina"),
    airinaHilsen: g(
      "airinaHilsen",
      en
        ? "Hi! I'm Airina — I know this whole universe. Ask me about the cases, the flagships, or what we can build for you."
        : "Hej! Jeg er Airina — jeg kender hele universet her. Spørg mig om cases, flagskibe eller hvad vi kan bygge for dig.",
    ),
    airinaPlaceholder: g("airinaPlaceholder", en ? "Write to Airina…" : "Skriv til Airina…"),
    airinaDisclaimer: g(
      "airinaDisclaimer",
      en ? "Airina is an AI — answers may contain mistakes" : "Airina er en AI — svar kan indeholde fejl",
    ),
    disclaimer: g(
      "aidanDisclaimer",
      en ? "Aidan is an AI — answers may contain mistakes" : "Aidan er en AI — svar kan indeholde fejl",
    ),
  };
}

/** Ét videopar (mørk+lys) i en rund maske. Poster = kanonisk SVG.
 *  BEGGE personaers figurer ligger i DOM'en; CSS viser den valgte
 *  (#aidan.persona-airina) — samme mønster som tema-klippene. */
/** Liv i den stillestående figur UDEN en ny video og UDEN at røre original-SVG'en
 *  (ejerens to krav, 6/9). Et overlay i figurens EGET koordinatsystem
 *  (viewBox 0 0 1024 1024), så delene rammer præcis. Positioner og farver er
 *  MÅLT i browseren på den rigtige fil, ikke gættet:
 *
 *    øjne     (389,405) + (634,405) r53   hovedet bagved: #f7bd64
 *    hjul     (514,717) r65               skiven: #ea8f1f, mørk: #030202
 *    antenne  (514,62)  r31               kuglen: #df5416
 *
 *  VIGTIGT — koordinaterne gælder HVILETILSTANDEN, hvor figuren viser den
 *  kanoniske SVG-poster. Vinke-videoen er en ANDEN positur, og robotten
 *  bevæger sig i den (målt: antennekuglen svinger 68 enheder = 3x sin egen
 *  bredde), så overlayet ville sidde ved siden af. Derfor slukkes det mens
 *  videoen kører (.spiller) — se brand.css.
 *
 *  Alt er sjældent og kort — figuren skal virke levende, ikke urolig. */
function Liv({ klasse }: { klasse: string }) {
  const prikker = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg class={klasse} viewBox="0 0 1024 1024" aria-hidden="true" focusable="false">
      {/* Øjenlåg. Det gyldne dække ALENE var ikke et blink — det så ud som om
          øjnene blev visket ud (målt på figuren 6/9). Buen ovenpå er det der
          gør det til et lukket øje frem for et manglende. */}
      {[389, 634].map((cx, i) => (
        <g key={cx} class={i ? "liv-laag liv-laag-2" : "liv-laag"}>
          <ellipse cx={cx} cy="405" rx="56" ry="56" fill="#f7bd64" />
          <path d={`M ${cx - 40} 398 Q ${cx} 430 ${cx + 40} 398`} fill="none"
            stroke="#030202" stroke-width="13" stroke-linecap="round" />
        </g>
      ))}
      {/* Hjulet: skiven dækkes og prikkerne tegnes igen, så de kan dreje */}
      <g class="liv-hjul">
        <circle cx="514" cy="717" r="64" fill="#ea8f1f" />
        <circle cx="514" cy="717" r="64" fill="none" stroke="#030202" stroke-width="9" />
        <g class="liv-hjul-drej">
          {prikker.map((g) => (
            <circle key={g} cx="514" cy="717" r="7.5" fill="#030202"
              transform={`rotate(${g} 514 717) translate(0 -40)`} />
          ))}
        </g>
        <circle cx="514" cy="717" r="15" fill="#030202" />
      </g>
      {/* Antennekuglen: grønt blink oven på den orange */}
      <circle class="liv-antenne" cx="514" cy="62" r="30" fill="#34d399" />
    </svg>
  );
}

function Figur({ klasse }: { klasse: string }) {
  return (
    <>
      <span class={`${klasse} figur-aidan`} aria-hidden="true">
        <video class="aidan-v aidan-v-moerk" src={KLIP_MOERK} poster={STILL} muted playsinline preload="none" />
        <video class="aidan-v aidan-v-lys" src={KLIP_LYS} poster={STILL} muted playsinline preload="none" />
        <Liv klasse="aidan-liv" />
      </span>
      <span class={`${klasse} figur-airina`} aria-hidden="true">
        <video class="aidan-v aidan-v-moerk" src={AIRINA_MOERK} poster={AIRINA_STILL} muted playsinline preload="none" />
        <video class="aidan-v aidan-v-lys" src={AIRINA_LYS} poster={AIRINA_STILL} muted playsinline preload="none" />
      </span>
    </>
  );
}

export function AidanWidget({
  sideTitel,
  t,
  globalsRef,
  locale,
}: {
  sideTitel?: string;
  t: AidanTekster;
  globalsRef: CmsRef | undefined;
  locale: Locale;
}) {
  const en = locale === "en";
  const chips = t.chips.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 4);
  return (
    <div
      id="aidan"
      data-aidan
      data-locale={locale}
      data-laes-tilbud={t.laesTilbud}
      data-laes-henter={t.laesHenter}
      data-laes-pause={t.laesPause}
      data-laes-videre={t.laesVidere}
      data-laes-fejl={t.laesFejl}
      data-mail-tilbud={t.mailTilbud}
      data-mail-felt={t.mailFelt}
      data-mail-samtykke={t.mailSamtykke}
      data-mail-send={t.mailSend}
      data-mail-sendt={t.mailSendt}
      data-mail-fejl={t.mailFejl}
      data-navn-aidan={t.navn}
      data-navn-airina={t.airinaNavn}
      data-boble-aidan={t.boble}
      data-boble-airina={t.airinaBoble}
      data-hilsen-aidan={t.hilsen}
      data-hilsen-airina={t.airinaHilsen}
      data-disclaimer-aidan={t.disclaimer}
      data-disclaimer-airina={t.airinaDisclaimer}
      data-placeholder-aidan={t.placeholder}
      data-placeholder-airina={t.airinaPlaceholder}
      data-svar-mail={t.svarMail}
      data-opsummer={t.opsummer}
      data-fejl-retry={t.fejlRetry}
      data-travlt={t.travlt}
      data-status-ok={t.statusOk}
      data-status-fejl={t.statusFejl}
      data-tid-besked={t.tidBesked}
      data-hilsen-side={t.hilsenSide}
      data-side-titel={sideTitel ?? ""}
      data-kopier={t.kopier}
      data-kopieret={t.kopieret}
      data-trans-tilbud={t.transTilbud}
    >
      <button
        type="button"
        class="aidan-fab"
        data-testid="aidan-fab"
        aria-label={en ? "Open chat with Aidan" : "Åbn chat med Aidan"}
      >
        <span class="aidan-fab-ring" />
        <Figur klasse="aidan-fab-figur" />
      </button>
      <div class="aidan-boble" data-testid="aidan-boble" {...cmsAttrs(globalsRef, "aidanBoble")}>
        {t.boble}
      </div>

      <div class="aidan-bagtaeppe" data-testid="aidan-bagtaeppe" hidden></div>
      <div
        class="aidan-panel"
        data-testid="aidan-panel"
        role="dialog"
        aria-label={en ? "Chat with Aidan" : "Chat med Aidan"}
        hidden
      >
        <div class="aidan-top">
          <Figur klasse="aidan-avatar" />
          <div class="aidan-navn">
            <b class="aidan-navn-tekst" {...cmsAttrs(globalsRef, "aidanNavn")}>{t.navn}</b>
            <small>
              <span class="aidan-prik" />
              <span {...cmsAttrs(globalsRef, "aidanRolle")}>{t.rolle}</span>
            </small>
          </div>
          <button type="button" class="aidan-knap" data-testid="aidan-historik-knap" aria-label={t.tidligere} title={t.tidligere}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
            </svg>
          </button>
          <button type="button" class="aidan-knap" data-testid="aidan-fuld" aria-label={en ? "Full screen" : "Fuld skærm"} title={en ? "Full screen" : "Fuld skærm"}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />
            </svg>
          </button>
          <button type="button" class="aidan-knap" data-testid="aidan-luk" aria-label={en ? "Close" : "Luk"}>
            ✕
          </button>
        </div>
        {/* Velkommen tilbage — Eir-mønstret: seneste samtales titel + Fortsæt/Start ny.
            Klienten udfylder titlen og viser banneret når der ER en tidligere samtale. */}
        <div class="aidan-banner" data-testid="aidan-banner" hidden>
          <span>
            <span {...cmsAttrs(globalsRef, "aidanVelkommen")}>{t.velkommen}</span> <b class="aidan-banner-titel" />.
          </span>
          <span class="aidan-banner-knapper">
            <button type="button" class="aidan-banner-primaer" data-testid="aidan-banner-fortsaet">{t.fortsaet}</button>
            <button type="button" class="aidan-banner-sekundaer" data-testid="aidan-banner-startny">{t.startNy}</button>
          </span>
        </div>
        {/* Historik-visningen lægger sig over beskederne når klok-knappen trykkes. */}
        <div class="aidan-historik" data-testid="aidan-historik-visning" hidden>
          <div class="aidan-historik-hoved">
            <b {...cmsAttrs(globalsRef, "aidanTidligere")}>{t.tidligere}</b>
            <button type="button" class="aidan-banner-primaer" data-testid="aidan-ny">{t.nySamtale}</button>
          </div>
          <div class="aidan-hist-liste" data-testid="aidan-hist-liste" data-tom-tekst={t.ingenSamtaler} />
        </div>
        <div class="aidan-msgs" data-testid="aidan-msgs">
          <div class="aidan-msg fra-aidan" {...cmsAttrs(globalsRef, "aidanHilsen")}>
            {t.hilsen}
          </div>
        </div>
        {/* F007.5: vises kun når brugeren er scrollet op og nyt svar strømmer ind. */}
        <button type="button" class="aidan-nyt-svar" data-testid="aidan-nyt-svar" hidden>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 5v14M6 13l6 6 6-6" />
          </svg>
          <span {...cmsAttrs(globalsRef, "aidanNytSvar")}>{t.nytSvar}</span>
        </button>
        {/* F007.6: folder forslags-chippene ud/ind — chevronen roterer med tilstanden. */}
        <button type="button" class="aidan-chips-fold" data-testid="aidan-chips-fold" hidden>
          <span {...cmsAttrs(globalsRef, "aidanForslag")}>{t.forslag}</span>
          <svg class="aidan-fold-pil" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <div class="aidan-chips" data-testid="aidan-chips" {...cmsAttrs(globalsRef, "aidanChips")}>
          {chips.map((c, i) => (
            <button type="button" class="aidan-chip" data-testid={`aidan-chip-${i + 1}`}>
              {c}
            </button>
          ))}
        </div>
        <form class="aidan-input" data-testid="aidan-form">
          <input
            type="text"
            name="besked"
            maxlength={2000}
            autocomplete="off"
            placeholder={t.placeholder}
            data-testid="aidan-input"
          />
          <button type="submit" class="aidan-send" data-testid="aidan-send" aria-label={en ? "Send" : "Send"}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </form>
        {/* F007.8: info + stemmevalg — popover over foden, valget bor i cookie. */}
        <div class="aidan-info-popover aidan-om" data-testid="aidan-info-popover" hidden>
          <div class="aidan-om-hoved">
            <b class="aidan-om-titel" {...cmsAttrs(globalsRef, "aidanOmTitel")}>{t.omTitel}</b>
            <button type="button" class="aidan-om-luk" data-testid="aidan-om-luk" aria-label={en ? "Close" : "Luk"}>×</button>
          </div>
          <div class="aidan-om-krop">
            <p class="aidan-info-tekst" {...cmsAttrs(globalsRef, "aidanInfo")}>{t.info}</p>
            {/* Indholdet BOR i CMS'et (aidanOmMd, da+en) — koden render kun. */}
            {t.omMd ? <div class="aidan-om-md" {...cmsHtmlAttrs(globalsRef, "aidanOmMd")} dangerouslySetInnerHTML={{ __html: richtextBlock(t.omMd) }} /> : null}
            <b class="aidan-info-hoved" {...cmsAttrs(globalsRef, "aidanVaelgStemme")}>{t.vaelgStemme}</b>
          <div class="aidan-personaer">
            <button type="button" class="aidan-persona" data-persona="aidan" data-testid="aidan-persona-aidan" {...cmsAttrs(globalsRef, "aidanStemmeAidan")}>
              {t.stemmeAidan}
            </button>
            <button type="button" class="aidan-persona" data-persona="airina" data-testid="aidan-persona-airina" {...cmsAttrs(globalsRef, "aidanStemmeAirina")}>
              {t.stemmeAirina}
            </button>
            </div>
          </div>
        </div>
        <div class="aidan-fod-raekke">
          <div class="aidan-fod" {...cmsAttrs(globalsRef, "aidanDisclaimer")}>{t.disclaimer}</div>
          <button type="button" class="aidan-info-knap" data-testid="aidan-info-knap" aria-label={en ? "About Aidan" : "Om Aidan"}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><circle cx="12" cy="8" r="0.6" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
