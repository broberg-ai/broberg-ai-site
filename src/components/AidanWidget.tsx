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
import { cmsAttrs } from "@/components/sections.tsx";

const STILL = "/uploads/aidan-kanonisk-rfjl.svg";
const KLIP_MOERK = "/uploads/g2-aidan-moerk-s45h.mp4";
const KLIP_LYS = "/uploads/g2-aidan-lys-6kty.mp4";

export interface AidanTekster {
  boble: string;
  navn: string;
  rolle: string;
  hilsen: string;
  /** Én chip pr. linje. */
  chips: string;
  placeholder: string;
  disclaimer: string;
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
    disclaimer: g(
      "aidanDisclaimer",
      en ? "Aidan is an AI — answers may contain mistakes" : "Aidan er en AI — svar kan indeholde fejl",
    ),
  };
}

/** Ét videopar (mørk+lys) i en rund maske. Poster = kanonisk SVG. */
function Figur({ klasse }: { klasse: string }) {
  return (
    <span class={klasse} aria-hidden="true">
      <video class="aidan-v aidan-v-moerk" src={KLIP_MOERK} poster={STILL} muted playsinline preload="none" />
      <video class="aidan-v aidan-v-lys" src={KLIP_LYS} poster={STILL} muted playsinline preload="none" />
    </span>
  );
}

export function AidanWidget({
  t,
  globalsRef,
  locale,
}: {
  t: AidanTekster;
  globalsRef: CmsRef | undefined;
  locale: Locale;
}) {
  const en = locale === "en";
  const chips = t.chips.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 4);
  return (
    <div id="aidan" data-aidan data-locale={locale}>
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
            <b {...cmsAttrs(globalsRef, "aidanNavn")}>{t.navn}</b>
            <small>
              <span class="aidan-prik" />
              <span {...cmsAttrs(globalsRef, "aidanRolle")}>{t.rolle}</span>
            </small>
          </div>
          <button type="button" class="aidan-knap" data-testid="aidan-luk" aria-label={en ? "Close" : "Luk"}>
            ✕
          </button>
        </div>
        <div class="aidan-msgs" data-testid="aidan-msgs">
          <div class="aidan-msg fra-aidan" {...cmsAttrs(globalsRef, "aidanHilsen")}>
            {t.hilsen}
          </div>
        </div>
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
        <div class="aidan-fod" {...cmsAttrs(globalsRef, "aidanDisclaimer")}>{t.disclaimer}</div>
      </div>
    </div>
  );
}
