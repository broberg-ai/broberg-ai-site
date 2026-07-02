/* Top navigation. Dropdowns open on hover (CSS) on desktop and on click
   (enhance.ts toggles .open) on touch — the mobile fix flagged in the build
   brief. In-page links use data-scroll; enhance.ts smooth-scrolls them.

   Locale-aware: every link routes through `withLocale`, and the DA/EN switch
   uses `altHref` — the route handler's computed equivalent URL in the other
   locale (e.g. a flagship/category page swaps locale segment + keeps slug;
   a blog post resolves its translationGroup twin). Falls back to that
   locale's homepage when the current page has no known twin.

   F156.5: "Univers" dropdown (universet/flagskibe/metoden in-page anchors)
   replaced by a single "Sådan bygger vi det" link to /universet — that
   content moved off the homepage in F156.4, so an in-page anchor no longer
   resolves there. New "Løsninger" dropdown added (Websites/Webshops/
   Platforme/AI Integration → /losninger/:slug). "Om" points at the
   homepage's own #om section (About moved there off /universet). */
import type { Locale } from "@/config.ts";
import { withLocale } from "@/i18n.ts";

const COPY = {
  da: {
    losninger: "Løsninger",
    websites: "Websites",
    websitesSub: "Hjemmesider der ikke går i stå",
    webshops: "Webshops",
    webshopsSub: "Salg på samme AI-motor",
    platforme: "Platforme",
    platformeSub: "Skræddersyet — det vi selv bygger på",
    aiIntegration: "AI Integration",
    aiIntegrationSub: "Rådgivning + integration i det I har",
    sadanByggerViDet: "Sådan bygger vi det",
    cases: "Cases",
    ressourcer: "Indsigter",
    indsigter: "Tanker",
    indsigterSub: "Blog om AI-native byg",
    aiMetode: "AI & Metode",
    aiMetodeSub: "Håndværket bag — sådan bygger vi med AI",
    bagOm: "Bag om",
    bagOmSub: "Kig bag motoren i universet",
    casesSub: "Kundeløsninger i drift",
    om: "Om",
    search: "Søg (⌘K)",
    theme: "Skift mellem lyst og mørkt tema",
    cta: "Lad os bygge",
    localeSwitch: "EN",
    localeLabel: "Switch to English",
  },
  en: {
    losninger: "Solutions",
    websites: "Websites",
    websitesSub: "Websites that don't stall",
    webshops: "Webshops",
    webshopsSub: "Selling on the same AI engine",
    platforme: "Platforms",
    platformeSub: "Custom-built — what we run on ourselves",
    aiIntegration: "AI Integration",
    aiIntegrationSub: "Advisory + integration into what you have",
    sadanByggerViDet: "How we build it",
    cases: "Cases",
    ressourcer: "Insights",
    indsigter: "Thoughts",
    indsigterSub: "Blog on AI-native building",
    aiMetode: "AI & Method",
    aiMetodeSub: "The craft behind it — how we build with AI",
    bagOm: "Behind the scenes",
    bagOmSub: "A look behind the universe's engine",
    casesSub: "Customer solutions in production",
    om: "About",
    search: "Search (⌘K)",
    theme: "Toggle light/dark theme",
    cta: "Let's build",
    localeSwitch: "DA",
    localeLabel: "Skift til dansk",
  },
} as const;

const SOLUTIONS_SEGMENT: Record<Locale, string> = { da: "losninger", en: "solutions" };

export function Nav({ locale, altHref }: { locale: Locale; altHref?: string }) {
  const t = COPY[locale];
  const otherLocale: Locale = locale === "en" ? "da" : "en";
  const switchHref = altHref ?? withLocale(otherLocale, "/");
  const universetHref = locale === "en" ? "/en/universe" : "/universet";
  const solutionsSeg = SOLUTIONS_SEGMENT[locale];

  return (
    <header>
      <div class="wrap nav">
        <a class="logo" href={withLocale(locale, "/")} data-testid="nav-logo">
          broberg<span class="ai">.ai</span>
        </a>
        <button class="navlink mobile-only" data-testid="nav-mobile-toggle" aria-label="Menu" aria-expanded="false">
          ☰
        </button>
        <nav class="navlinks" data-testid="nav-links">
          <div class="navitem">
            <button class="navlink dropdown-toggle" data-testid="nav-losninger" aria-haspopup="true" aria-expanded="false">
              {t.losninger} <span class="car">▾</span>
            </button>
            <div class="dd">
              <a href={`/${solutionsSeg}/websites`} data-testid="dd-websites">
                <b>{t.websites}</b>
                <span>{t.websitesSub}</span>
              </a>
              <a href={`/${solutionsSeg}/webshops`} data-testid="dd-webshops">
                <b>{t.webshops}</b>
                <span>{t.webshopsSub}</span>
              </a>
              <a href={`/${solutionsSeg}/platforme`} data-testid="dd-platforme-solution">
                <b>{t.platforme}</b>
                <span>{t.platformeSub}</span>
              </a>
              <a href={`/${solutionsSeg}/ai-integration`} data-testid="dd-ai-integration">
                <b>{t.aiIntegration}</b>
                <span>{t.aiIntegrationSub}</span>
              </a>
            </div>
          </div>
          <a class="navlink simple" href={universetHref} data-testid="nav-universet">
            {t.sadanByggerViDet}
          </a>
          <a class="navlink simple" href={`${withLocale(locale, "/")}#cases`} data-scroll="cases" data-testid="nav-cases">
            {t.cases}
          </a>
          <div class="navitem">
            <button class="navlink dropdown-toggle" data-testid="nav-ressourcer" aria-haspopup="true" aria-expanded="false">
              {t.ressourcer} <span class="car">▾</span>
            </button>
            <div class="dd">
              <a href={withLocale(locale, "/indsigter")} data-testid="dd-indsigter">
                <b>{t.indsigter}</b>
                <span>{t.indsigterSub}</span>
              </a>
              <a href={withLocale(locale, "/ai-metode")} data-testid="dd-ai-metode">
                <b>{t.aiMetode}</b>
                <span>{t.aiMetodeSub}</span>
              </a>
              <a href={withLocale(locale, "/bag-om")} data-testid="dd-bag-om">
                <b>{t.bagOm}</b>
                <span>{t.bagOmSub}</span>
              </a>
              <a href={withLocale(locale, "/cases")} data-testid="dd-cases">
                <b>{t.cases}</b>
                <span>{t.casesSub}</span>
              </a>
            </div>
          </div>
          <a class="navlink simple" href={`${withLocale(locale, "/")}#om`} data-testid="nav-om">
            {t.om}
          </a>
          <button class="navlink navsearch" data-testid="cmdk-trigger" aria-label={t.search} title={t.search}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5" />
              <path d="M11 11l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            <span class="navsearch-kbd">⌘K</span>
          </button>
          <a
            class="navlink navlocale"
            href={switchHref}
            data-testid="nav-locale-switch"
            aria-label={t.localeLabel}
            title={t.localeLabel}
            hrefLang={otherLocale}
          >
            {t.localeSwitch}
          </a>
          <button class="navlink navtheme" data-testid="theme-toggle" aria-label={t.theme} title={t.theme}>
            <svg class="theme-icon theme-sun" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
            <svg class="theme-icon theme-moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          </button>
          <a class="btn" href={`${withLocale(locale, "/")}#kontakt`} data-scroll="kontakt" data-testid="nav-cta-kontakt">
            {t.cta}
          </a>
        </nav>
      </div>
    </header>
  );
}
