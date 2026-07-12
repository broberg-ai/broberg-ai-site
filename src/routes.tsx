/* Route handlers — return full HTML strings. The home page renders the complete
   landing from the model (fallback copy until cms is wired); the other routes
   render valid minimal pages so navigation never 404s before content lands.
   When cms is wired, each handler builds its model from the local store. */
import type { Locale } from "@/config.ts";
import { Nav, AdminNav } from "@/components/Nav.tsx";
import { Footer } from "@/components/Footer.tsx";
import { RenderSections } from "@/render/blocks.tsx";
import { Platforms } from "@/components/sections.tsx";
import { renderPage } from "@/render/html.tsx";
import { resolveAssets } from "@/render/assets.ts";
import { homeFallback } from "@/data/fallback.ts";
import {
  loadHome,
  loadPlatform,
  loadPlatforms,
  loadFlagship,
  loadPost,
  loadBlock,
  loadPostTwin,
  loadCategoryPosts,
  categoryMeta,
  isCategory,
  slugifyTag,
  loadPostsByTag,
  buildTagCloud,
  loadSolutions,
  loadCategories,
  loadSolution,
  loadLanding,
  loadLatestNewsPerCategory,
  loadRandomNews,
  loadFooter,
  loadGlobals,
} from "@/content/compose.ts";
import { richtextBlock, richtextInline } from "@/content/richtext.ts";
import { PostBody, extractBlockSlugs } from "@/render/postBody.tsx";
import { Logo } from "@/components/Logos.tsx";
import { Illustration, hasIllustration, pickNewsIllustration } from "@/components/Illustrations.tsx";
import { Icon } from "@/components/Icons.tsx";
import { FlagshipSlides, flagshipFromRegistry } from "@/components/FlagshipSlides.tsx";
import { SolutionPage, type SolutionData } from "@/components/SolutionPage.tsx";
import { Cases, Insights, About, cmsAttrs, cmsHtmlAttrs, cmsRichAttrs } from "@/components/sections.tsx";
import type { CmsRef } from "@/content/types.ts";
import { Faq } from "@/components/Faq.tsx";
import { Contact } from "@/components/Contact.tsx";
import type { PlatformsData, CasesData, CaseItem } from "@/content/types.ts";
import type { StoredDoc } from "@/content/store.ts";
import { flagshipsSegment, withLocale, formatDate } from "@/i18n.ts";

const SOLUTIONS_SEGMENT: Record<Locale, string> = { da: "losninger", en: "solutions" };
const SOLUTION_ICONS: Record<string, string> = {
  websites: "Globe",
  webshops: "ShoppingCart",
  platforme: "Layers",
  "ai-integration": "Sparkles",
};

async function page(
  children: any,
  meta: { title: string; description: string; locale: Locale; canonical?: string; altHref?: string },
) {
  const footerData = await loadFooter(meta.locale);
  const globalsDoc = await loadGlobals(meta.locale);
  const globalsData = (globalsDoc?.data ?? {}) as Record<string, unknown>;
  const globalsRef: CmsRef | undefined = globalsDoc
    ? { collection: "globals", slug: String(globalsDoc.slug), locale: meta.locale }
    : undefined;
  const navLabels = (globalsData.nav && typeof globalsData.nav === "object" ? globalsData.nav : undefined) as
    | Record<string, string>
    | undefined;
  return renderPage(
    <>
      <Nav locale={meta.locale} altHref={meta.altHref} nav={navLabels} globalsRef={globalsRef} />
      {children}
      <Footer data={footerData} cmsRef={globalsRef} />
    </>,
    meta,
    resolveAssets(),
  );
}

// F157 — index/utility pages keep their section chrome (eyebrows/headings/leads)
// on the globals doc so it's inline-editable. Returns the globals doc ref plus a
// locale-fallback reader `g(field, fallback)` (defensive: docs are seeded, so
// the fallback only guards a pre-seed state — the "no naked cutover" rule).
async function globalsChrome(locale: Locale): Promise<{ ref: CmsRef | undefined; g: (field: string, fallback: string) => string }> {
  const doc = await loadGlobals(locale);
  const data = (doc?.data ?? {}) as Record<string, unknown>;
  const ref: CmsRef | undefined = doc ? { collection: "globals", slug: String(doc.slug), locale } : undefined;
  const g = (field: string, fallback: string): string => (typeof data[field] === "string" && data[field]) || fallback;
  return { ref, g };
}

// F157 — internal admin tools (Inline Editing toggle today, more later —
// same login bounce as sanneandersen.dk's own /admin). No Nav/Footer chrome;
// enhance.ts's adminPanel() takes over #admin-root client-side: redirects to
// the cms-admin connect flow if not yet connected, else renders the panel.
export async function renderAdmin(): Promise<string> {
  return renderPage(
    <>
      <AdminNav />
      <div
        id="admin-root"
        style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0d0d0d;color:#f0f4f8;font-family:system-ui,-apple-system,sans-serif;"
      >
        <p style="color:#8a8a8a;font-size:14px;">Indlæser…</p>
      </div>
    </>,
    { title: "Admin — broberg.ai", description: "", locale: "da", forceTheme: "dark" },
    resolveAssets(),
  );
}

// F002 — full-screen AI chat surface. Deliberately NO AdminNav: the chat gets
// the WHOLE surface (its own action bar is the only chrome), so there's never a
// second admin header stacked on top. Same login bounce as /admin; enhance.ts's
// mountAdminChat() takes over #admin-chat-root client-side (redirects to the
// cms-admin connect flow if not connected, else mounts the Preact chat that
// streams the full CMS agentic chat via the same-origin /api/admin/chat relay).
export async function renderAdminChat(): Promise<string> {
  return renderPage(
    <div
      id="admin-chat-root"
      data-testid="admin-chat-root"
      style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0d0d0d;color:#f0f4f8;font-family:system-ui,-apple-system,sans-serif;"
    >
      <p style="color:#8a8a8a;font-size:14px;">Indlæser chat…</p>
    </div>,
    { title: "AI-chat — broberg.ai", description: "", locale: "da", forceTheme: "dark" },
    resolveAssets(),
  );
}

// "Sådan bygger vi det" (F156.4) — the ORIGINAL homepage content (universe
// diagram, all 12 flagship cards, SDLC method), relocated unchanged from `/`
// to `/universet` (DA) / `/en/universe` (EN) when the new sales landing
// (renderHome below) took over the root routes. The About/"om" section moved
// on again from here to the homepage — excluded so it isn't shown twice.
export async function renderUniverset(locale: Locale): Promise<string> {
  // Prefer live cms content from the local store; fall back to mockup-v6 copy
  // until the first ICD pushes / backfill land.
  const model = (await loadHome(locale)) ?? homeFallback;
  const sections = model.sections.filter((s) => s.kind !== "about");
  return await page(<RenderSections sections={sections} />, {
    title: model.title,
    description: model.description,
    locale,
    altHref: locale === "en" ? "/universet" : "/en/universe",
    canonical: locale === "en" ? "/en/universe" : "/universet",
  });
}

// New sales landing (F156.3) — Hero → Problem → Løsninger grid → Sådan
// foregår det → Cases (real, reused verbatim) → Hvorfor os → Om → FAQ →
// Kontakt. Falls back to renderUniverset's content if the `landing` cms doc
// isn't there yet (no naked cutover — never a blank homepage).
export async function renderHome(locale: Locale): Promise<string> {
  const landing = await loadLanding(locale);
  if (!landing) return renderUniverset(locale);
  const d = landing.data as Record<string, any>;
  const landingRef: CmsRef = { collection: "landing", slug: String(landing.slug), locale };
  const isEn = locale === "en";
  const seg = SOLUTIONS_SEGMENT[locale];
  const universetHref = isEn ? "/en/universe" : "/universet";
  const globalsDoc = await loadGlobals(locale);
  const globalsRef: CmsRef | undefined = globalsDoc ? { collection: "globals", slug: String(globalsDoc.slug), locale } : undefined;
  const globalsData = (globalsDoc?.data ?? {}) as Record<string, unknown>;
  const bookLabel = (typeof globalsData.bookingCtaLabel === "string" && globalsData.bookingCtaLabel) || (isEn ? "Book a meeting" : "Book et møde");
  // F157 Phase 2 — structural homepage labels now live on the landing doc (seeded)
  // so they're inline-editable. `t` reads the doc value with a locale fallback:
  // defensive only (docs are seeded), keeping the "no naked cutover" guarantee
  // without duplicating the fallback string at every call site.
  const t = (field: string, da: string, en: string): string =>
    (typeof d[field] === "string" && d[field]) || (isEn ? en : da);

  const solutions = await loadSolutions(locale);
  const randomNews = await loadRandomNews(locale, 3);
  const casePosts = await loadCategoryPosts(locale, "cases");
  const homeModel = await loadHome(locale);
  const about = homeModel?.sections.find((s) => s.kind === "about");
  const caseItems: CaseItem[] = casePosts.map((p) => {
    const pd = (p.data ?? {}) as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" ? v : "");
    const slug = String(p.slug);
    return {
      kicker: str(pd.client) || "Case",
      title: stripHtml(str(pd.title)),
      body: str(pd.excerpt),
      quote: str(pd.quote) || undefined,
      attr: str(pd.quote) ? str(pd.client) || str(pd.author) : undefined,
      slug,
      href: withLocale(locale, `/cases/${slug}`),
      cmsRef: { collection: "posts", slug, locale },
    };
  });
  const casesData: CasesData = {
    eyebrow: t("casesEyebrow", "Cases", "Cases"),
    headingHtml: t(
      "casesHeadingHtml",
      `Bygget <em class="o">lynhurtigt</em>. Bygget rigtigt.`,
      `Built <em class="o">fast</em>. Built right.`,
    ),
    lead: t(
      "casesLead",
      "Rigtige kunder fik rigtige resultater — leveret på en brøkdel af den normale tid, fordi fundamentet allerede lå klar.",
      "Real customers got real results — delivered in a fraction of the normal time, because the foundation was already in place.",
    ),
    items: caseItems,
    allLink: {
      label: t("casesAllLabel", "Se alle cases", "See all cases"),
      href: withLocale(locale, "/cases"),
      testid: "landing-cases-all-link",
      ghost: true,
      cmsRef: landingRef,
      labelField: "casesAllLabel",
    },
  };

  // Rotating hero messages (landing.heroSlides array field). None authored
  // yet -> single slide from heroHeadingHtml/heroLead, so nothing breaks
  // pre-seed. Shuffled per request (loadRandomNews pattern) so reload = new order.
  const heroSlidesRaw: Array<{ heading?: string; subheading?: string }> = Array.isArray(d.heroSlides) ? d.heroSlides : [];
  // Carry each slide's ORIGINAL cms field path so a per-request shuffle (below)
  // never mis-targets a save — the rendered order ≠ the stored order.
  const heroSlides = heroSlidesRaw.length
    ? heroSlidesRaw.map((s, i) => ({
        titleHtml: String(s.heading ?? ""),
        leadHtml: String(s.subheading ?? ""),
        headingPath: `heroSlides.${i}.heading`,
        leadPath: `heroSlides.${i}.subheading`,
      }))
    : [{ titleHtml: String(d.heroHeadingHtml ?? ""), leadHtml: String(d.heroLead ?? ""), headingPath: "heroHeadingHtml", leadPath: "heroLead" }];
  for (let i = heroSlides.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [heroSlides[i], heroSlides[j]] = [heroSlides[j]!, heroSlides[i]!];
  }
  const heroSlidesLabel = isEn ? "Messages" : "Budskaber";

  return await page(
    <>
      <section class="hero" id="top">
        <div class="wrap hero-grid">
          <div>
            <div class="eyebrow" {...cmsAttrs(landingRef, "heroEyebrow")}>{d.heroEyebrow}</div>
            <div class="hero-slide-stack" data-testid="hero-slideshow">
              {heroSlides.map((s, i) => (
                <div class={`hero-slide${i === 0 ? " active" : ""}`} data-testid={`hero-slide-${i}`} key={i}>
                  <h1 {...cmsHtmlAttrs(landingRef, s.headingPath)} dangerouslySetInnerHTML={{ __html: s.titleHtml }} />
                  <p class="lead" {...cmsHtmlAttrs(landingRef, s.leadPath)} dangerouslySetInnerHTML={{ __html: s.leadHtml }} />
                </div>
              ))}
            </div>
            {heroSlides.length > 1 && (
              <div class="hero-dots" data-testid="hero-dots" role="tablist" aria-label={heroSlidesLabel}>
                {heroSlides.map((_, i) => (
                  <button
                    type="button"
                    class={`hero-dot${i === 0 ? " active" : ""}`}
                    data-testid={`hero-dot-${i}`}
                    data-index={i}
                    role="tab"
                    aria-selected={i === 0 ? "true" : "false"}
                    aria-label={String(i + 1)}
                    key={i}
                  />
                ))}
              </div>
            )}
            <div class="cta-row">
              <a class="btn" href="#kontakt" data-testid="landing-cta-primary">
                <span {...cmsAttrs(globalsRef, "bookingCtaLabel")}>{bookLabel}</span> <span class="ar">→</span>
              </a>
              <a class="btn btn-ghost" href={universetHref} data-testid="landing-cta-secondary">
                <span {...cmsAttrs(landingRef, "secondaryCtaLabel")}>{t("secondaryCtaLabel", "Se hvordan vi bygger det", "See how we build it")}</span> <span class="ar">→</span>
              </a>
            </div>
          </div>
          <div class="hero-art">
            <svg class="svg-wrap" viewBox="0 0 400 340" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Forstærker — frekvens">
              <defs>
                <radialGradient id="hg2" cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stop-color="#00b2ff" stop-opacity=".22" />
                  <stop offset="100%" stop-color="#00b2ff" stop-opacity="0" />
                </radialGradient>
                <linearGradient id="hl2" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#00b2ff" />
                  <stop offset="100%" stop-color="#40c8ff" />
                </linearGradient>
                <clipPath id="cin2">
                  <rect x="8" y="120" width="96" height="100" />
                </clipPath>
              </defs>
              <circle class="sphere" cx="200" cy="170" r="150" fill="url(#hg2)" />
              <g clip-path="url(#cin2)">
                <path class="wIn" d="M-32 170 q10 -9 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="#F3522C" stroke-width="2.5" fill="none" />
              </g>
              <path d="M110 110 L110 230 L240 170 Z" fill="none" stroke="url(#hl2)" stroke-width="2" />
              <circle cx="158" cy="170" r="4" fill="#00b2ff" />
              <g>
                <path class="wOut" d="M236 170 q10 -42 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="url(#hl2)" stroke-width="3" fill="none" />
                <path class="wOut o2" d="M236 170 q10 -26 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="#00b2ff" stroke-width="2" fill="none" opacity=".5" />
                <path class="wOut o3" d="M236 170 q10 -58 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="#00b2ff" stroke-width="1.4" fill="none" opacity=".25" />
              </g>
            </svg>
          </div>
        </div>
      </section>

      <section style="background:var(--dark2)">
        <div class="wrap" style="max-width:720px">
          <h2 style="font-size:clamp(26px,3.4vw,38px)" {...cmsHtmlAttrs(landingRef, "problemHeading")} dangerouslySetInnerHTML={{ __html: d.problemHeading }} />
          <div class="divider" />
          {(d.problemP as string[]).map((p, i) => (
            <p class="lead" key={i} style={`max-width:none;${i < d.problemP.length - 1 ? "margin-bottom:16px" : ""}`} {...cmsHtmlAttrs(landingRef, `problemP.${i}`)} dangerouslySetInnerHTML={{ __html: p }} />
          ))}
          {d.problemCallout ? (
            <div class="card callout" style="margin-top:24px">
              <p style="color:var(--light);font-weight:600;font-size:15px" {...cmsHtmlAttrs(landingRef, "problemCallout")} dangerouslySetInnerHTML={{ __html: d.problemCallout }} />
            </div>
          ) : null}
        </div>
      </section>

      <section id="losninger">
        <div class="wrap">
          <div class="sec-head">
            <div class="eyebrow" {...cmsAttrs(landingRef, "solutionsEyebrow")}>{t("solutionsEyebrow", "Løsninger", "Solutions")}</div>
            <h2 {...cmsAttrs(landingRef, "solutionsHeading")}>{t("solutionsHeading", "Hvad kan vi bygge til dig?", "What can we build for you?")}</h2>
            <p
              class="lead"
              {...cmsHtmlAttrs(landingRef, "solutionsLead")}
              dangerouslySetInnerHTML={{
                __html: t(
                  "solutionsLead",
                  "Fire veje ind — vælg den der matcher hvor I er i dag. Hver løsning har sin egen side med dybere detaljer.",
                  "Four ways in — pick the one that matches where you are today. Each solution has its own page with more detail.",
                ),
              }}
            />
          </div>
          <div class="grid g4">
            {solutions.map((s) => (
              <a class="card card-glow" href={`/${seg}/${s.slug}`} key={s.slug} data-testid={`landing-solution-card-${s.slug}`}>
                <Icon name={SOLUTION_ICONS[s.slug] ?? "Sparkles"} />
                <div class="plat-h">
                  <div class="nm" {...cmsAttrs(s.cmsRef, "name")}>{s.name}</div>
                </div>
                <p {...cmsHtmlAttrs(s.cmsRef, "blurb")} dangerouslySetInnerHTML={{ __html: s.blurb }} />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section style="background:var(--dark2)">
        <div class="wrap">
          <div class="sec-head" style="text-align:center;margin-left:auto;margin-right:auto">
            <div class="eyebrow" style="justify-content:center" {...cmsAttrs(landingRef, "stepsEyebrow")}>{t("stepsEyebrow", "Sådan foregår det", "How it works")}</div>
            <h2 {...cmsAttrs(landingRef, "stepsHeading")}>{d.stepsHeading}</h2>
          </div>
          <div class="steps3">
            {(d.steps as [string, string][]).map(([title, desc], i) => (
              <div class="step3" key={i}>
                <div class="step3-num">{i + 1}</div>
                <div class="workstep-title" {...cmsAttrs(landingRef, `steps.${i}.0`)}>{title}</div>
                <p {...cmsHtmlAttrs(landingRef, `steps.${i}.1`)} dangerouslySetInnerHTML={{ __html: desc }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <Cases data={casesData} cmsRef={landingRef} fields={{ eyebrow: "casesEyebrow", heading: "casesHeadingHtml", lead: "casesLead" }} />

      <section>
        <div class="wrap" style="max-width:680px;text-align:center">
          <div class="eyebrow" style="justify-content:center" {...cmsAttrs(landingRef, "whyUsEyebrow")}>{t("whyUsEyebrow", "Hvorfor os", "Why us")}</div>
          <h2 {...cmsAttrs(landingRef, "whyUsHeading")}>{d.whyUsHeading}</h2>
          <p class="lead" style="max-width:none;margin:18px auto 30px" {...cmsHtmlAttrs(landingRef, "whyUsBody")} dangerouslySetInnerHTML={{ __html: d.whyUsBody }} />
          <a class="btn btn-ghost" href={universetHref} data-testid="landing-whyus-cta">
            <span {...cmsAttrs(landingRef, "whyUsCtaLabel")}>{t("whyUsCtaLabel", "Se hele maskinen", "See the whole machine")}</span> <span class="ar">→</span>
          </a>
        </div>
      </section>

      {about && about.kind === "about" ? <About data={about.data} cmsRef={about.cmsRef} globalsRef={globalsRef} /> : null}

      <Faq
        items={d.faq as [string, string][]}
        locale={locale}
        cmsRef={landingRef}
        eyebrow={t("faqEyebrow", "FAQ", "FAQ")}
        heading={t("faqHeading", "Ofte stillede spørgsmål", "Frequently asked questions")}
      />

      {randomNews.length ? (
        <Insights
          data={{
            eyebrow: t("insightsEyebrow", "Tanker", "Thoughts"),
            headingHtml: t(
              "insightsHeadingHtml",
              `Tanker fra <em class="o">maskinrummet</em>.`,
              `Thoughts from the <em class="o">engine room</em>.`,
            ),
            lead: t(
              "insightsLead",
              "Ugentlige nedslag om AI-native udvikling og automatisering — for builders, product managers og nysgerrige.",
              "Weekly notes on AI-native development and automation — for builders, product managers and the curious.",
            ),
            posts: randomNews,
          }}
          cmsRef={landingRef}
          fields={{ eyebrow: "insightsEyebrow", heading: "insightsHeadingHtml", lead: "insightsLead" }}
        />
      ) : null}

      <Contact
        data={{
          ctaHeadingHtml: d.ctaHeadingHtml,
          ctaLead: d.ctaLead,
          eyebrow: t("contactEyebrow", "Kontakt", "Contact"),
          form: (d.contactForm ?? undefined) as Record<string, string> | undefined,
        }}
        locale={locale}
        cmsRef={landingRef}
      />
    </>,
    {
      title: isEn ? "broberg.ai — AI-native websites, webshops & platforms" : "broberg.ai — AI-native websites, webshops & platforme",
      description: d.heroLead,
      locale,
      altHref: isEn ? "/" : "/en",
    },
  );
}

// "Tak" — dedicated post-submit confirmation page (F156.7). The contact form
// redirects here on success instead of showing an inline status message.
// "Fik du læst disse nyheder?" surfaces the latest post per category — 0..N
// cards depending on what's actually published (no hardcoded count; a
// category with nothing yet just doesn't get a card).
export async function renderThanks(locale: Locale): Promise<string> {
  const isEn = locale === "en";
  const news = await loadLatestNewsPerCategory(locale);
  const thanksSeg = isEn ? "thanks" : "tak";
  const { ref: globalsRef, g } = await globalsChrome(locale);

  return await page(
    <>
      <section id="top">
        <div class="wrap" style="padding-top:150px;text-align:center;max-width:640px">
          <div class="eyebrow" style="justify-content:center" {...cmsAttrs(globalsRef, "thanksEyebrow")}>{g("thanksEyebrow", isEn ? "Thank you" : "Tak")}</div>
          <h1 {...cmsAttrs(globalsRef, "thanksHeading")}>{g("thanksHeading", isEn ? "Thank you!" : "Tak!")}</h1>
          <p
            class="lead"
            style="margin:18px auto 0"
            {...cmsHtmlAttrs(globalsRef, "thanksLead")}
            dangerouslySetInnerHTML={{
              __html: g("thanksLead", isEn ? "We'll get back to you as soon as possible." : "Vi vender tilbage hurtigst muligt."),
            }}
          />
          <div class="cta-row" style="justify-content:center">
            <a class="btn btn-ghost" href={withLocale(locale, "/")} data-testid="thanks-home-link">
              {isEn ? "Back to the homepage" : "Til forsiden"} <span class="ar">→</span>
            </a>
          </div>
        </div>
      </section>

      {news.length ? (
        <section style="background:var(--dark2)">
          <div class="wrap">
            <div class="sec-head" style="text-align:center;margin-left:auto;margin-right:auto">
              <div class="eyebrow" style="justify-content:center" {...cmsAttrs(globalsRef, "thanksNewsEyebrow")}>{g("thanksNewsEyebrow", isEn ? "By the way" : "Forresten")}</div>
              <h2 {...cmsAttrs(globalsRef, "thanksNewsHeading")}>{g("thanksNewsHeading", isEn ? "Did you catch this news?" : "Fik du læst disse nyheder?")}</h2>
            </div>
            <div class="grid g3">
              {news.map((n, i) => (
                <a class="blogcard" href={n.href} key={i} data-testid={`thanks-news-${i}`}>
                  <div class="blogthumb">
                    <Illustration k={pickNewsIllustration(n.slug)} />
                  </div>
                  <div class="blogbody">
                    <span class="nyt">{n.categoryLabel}</span>
                    <h3>{n.title}</h3>
                    <p>{n.excerpt}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>,
    {
      title: isEn ? "Thank you — broberg.ai" : "Tak — broberg.ai",
      description: isEn ? "Your message has been sent." : "Din besked er sendt.",
      locale,
      canonical: withLocale(locale, `/${thanksSeg}`),
    },
  );
}

// Flagships index — a dedicated page for ALL platforms (Christian: "en
// selvstændig side om ALLE flagskibene"), rendered from the cms platforms.
export async function renderFlagships(locale: Locale): Promise<string> {
  const items = await loadPlatforms(locale);
  const seg = flagshipsSegment(locale);
  const isEn = locale !== "da";
  const { ref: globalsRef, g } = await globalsChrome(locale);
  const data: PlatformsData = {
    eyebrow: g("flagshipsEyebrow", isEn ? "Flagships" : "Flagskibe"),
    heading: g("flagshipsHeading", isEn ? "The engines behind it all." : "Motorerne bag det hele."),
    lead: g(
      "flagshipsLead",
      isEn
        ? "The AI-native platforms we built ourselves — and that every new customer solution stands on the shoulders of."
        : "De AI-native platforme vi selv har bygget — og som hver ny kundeløsning står på skuldrene af.",
    ),
    items: items.length ? items : [],
    pathPrefix: `/${seg}`,
    allLink: { label: isEn ? "Back to home" : "Til forsiden", href: isEn ? "/en" : "/", testid: "flagships-home-link" },
  };
  return await page(<Platforms data={data} cmsRef={globalsRef} fields={{ eyebrow: "flagshipsEyebrow", heading: "flagshipsHeading", lead: "flagshipsLead" }} />, {
    title: isEn ? "Flagships — broberg.ai" : "Flagskibe — broberg.ai",
    description: isEn
      ? "The AI-native platforms behind the broberg.ai universe."
      : "De AI-native platforme bag broberg.ai-universet.",
    locale,
    canonical: `/${seg}`,
    altHref: isEn ? "/flagskibe" : "/en/flagships",
  });
}

// Flagship detail — renders the cms platform doc in the brand design. `body` is
// richtext (Markdown) → richtextBlock. cms fills the content; this is the shell.
export async function renderFlagshipDetail(locale: Locale, slug: string): Promise<string | null> {
  // Slide pages: prefer the cms-authored copy (platforms doc `data.slides`, ICD'd
  // to our store); fall back to the in-code registry when cms has none/invalid.
  const fromCms = await loadFlagship(locale, slug);
  const fp = fromCms ?? flagshipFromRegistry(slug);
  // Flagship slugs are shared across locales (only the cms doc is prefixed
  // "en-<slug>"), so the alternate URL is a straight locale-segment swap.
  const altHref = locale === "en" ? `/flagskibe/${slug}` : `/en/flagships/${slug}`;
  if (fp) {
    // Only wire inline-edit when the page actually came from a cms doc — the
    // code-fallback registry (flagshipFromRegistry) has nothing to PATCH.
    const flagshipRef: CmsRef | undefined = fromCms
      ? { collection: "platforms", slug: locale === "en" ? `en-${slug}` : slug, locale }
      : undefined;
    return await page(<FlagshipSlides page={fp} locale={locale} cmsRef={flagshipRef} />, {
      title: `${fp.slug} — broberg.ai`,
      description: fp.description,
      locale,
      altHref,
    });
  }
  const doc = await loadPlatform(locale, slug);
  if (!doc) return null;
  const d = (doc.data ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const name = str(d.name) || slug;
  const status = str(d.status) || "live";
  const tagline = str(d.tagline);
  const platformRef: CmsRef = { collection: "platforms", slug: String(doc.slug), locale };
  const bodyHtml = richtextBlock(str(d.body));
  const links = Array.isArray(d.links) ? (d.links as { label: string; url: string }[]) : [];

  return await page(
    <section id="top">
      <div class="wrap reveal">
        <div class={hasIllustration(slug) ? "plat-detail-head" : "plat-detail-head one-col"}>
          <div class="plat-detail-text">
            <div class="logot logot-lg">
              <Logo k={slug.toLowerCase()} />
            </div>
            <div class="eyebrow">Flagskib · {status}</div>
            <h2 {...cmsAttrs(platformRef, "name")}>{name}</h2>
            {tagline ? <p class="lead" {...cmsAttrs(platformRef, "tagline")}>{tagline}</p> : null}
          </div>
          {hasIllustration(slug) ? (
            <div class="plat-illu">
              <Illustration k={slug} />
            </div>
          ) : null}
        </div>
        <div class="divider" />
        {bodyHtml ? <div class="richtext" {...cmsRichAttrs(platformRef, "body")} dangerouslySetInnerHTML={{ __html: bodyHtml }} /> : null}
        {links.length ? (
          <div class="cta-row" style="margin-top:22px">
            {links.map((l) => (
              <a class="btn btn-ghost" key={l.url} href={l.url} target="_blank" rel="noopener" data-testid="flagship-link">
                {l.label} <span class="ar">→</span>
              </a>
            ))}
          </div>
        ) : null}
        {/* Back link at the END — content first, "all flagships" last (cms #108). */}
        <div class="cta-row" style="margin-top:36px">
          <a class="btn btn-ghost" href="/flagskibe" data-testid="flagship-all">
            Alle flagskibe <span class="ar">→</span>
          </a>
        </div>
      </div>
    </section>,
    { title: `${name} — broberg.ai`, description: tagline || `${name} — et broberg.ai-flagskib.`, locale, altHref },
  );
}

// Løsninger index — a dedicated page for ALL 4 solutions (F156.2), same pattern
// as renderFlagships (card grid → detail pages) but without the logo/status
// concepts platforms have — solutions render a plain name/blurb card.
export async function renderSolutions(locale: Locale): Promise<string> {
  const items = await loadSolutions(locale);
  const seg = SOLUTIONS_SEGMENT[locale];
  const isEn = locale === "en";
  const { ref: globalsRef, g } = await globalsChrome(locale);
  return await page(
    <section>
      <div class="wrap reveal">
        <div class="sec-head">
          <div class="eyebrow" {...cmsAttrs(globalsRef, "solutionsPageEyebrow")}>{g("solutionsPageEyebrow", isEn ? "Solutions" : "Løsninger")}</div>
          <h2 {...cmsAttrs(globalsRef, "solutionsPageHeading")}>{g("solutionsPageHeading", isEn ? "What can we build for you?" : "Hvad kan vi bygge til dig?")}</h2>
          <div class="divider" />
          <p
            class="lead"
            {...cmsHtmlAttrs(globalsRef, "solutionsPageLead")}
            dangerouslySetInnerHTML={{
              __html: g("solutionsPageLead", isEn ? "Four ways in — pick the one that matches where you are today." : "Fire veje ind — vælg den der matcher hvor I er i dag."),
            }}
          />
        </div>
        <div class="grid g4">
          {items.map((s) => (
            <a class="card" href={`/${seg}/${s.slug}`} key={s.slug} data-testid={`solution-card-${s.slug}`}>
              <div class="plat-h">
                <div class="nm" {...cmsAttrs(s.cmsRef, "name")}>{s.name}</div>
              </div>
              <p {...cmsHtmlAttrs(s.cmsRef, "blurb")} dangerouslySetInnerHTML={{ __html: s.blurb }} />
            </a>
          ))}
        </div>
      </div>
    </section>,
    {
      title: isEn ? "Solutions — broberg.ai" : "Løsninger — broberg.ai",
      description: isEn
        ? "Websites, webshops, custom platforms and AI integration — built on the broberg.ai engine."
        : "Websites, webshops, skræddersyede platforme og AI-integration — bygget på broberg.ai-motoren.",
      locale,
      canonical: `/${seg}`,
      altHref: `/${SOLUTIONS_SEGMENT[isEn ? "da" : "en"]}`,
    },
  );
}

// Løsning detail — renders the cms solution doc (F156.2). 404 (null) when the
// slug isn't a known, published solution.
const SOLUTION_SECONDARY_CTA: Record<string, { da: { label: string; href: string }; en: { label: string; href: string } }> = {
  websites: { da: { label: "Se broberg.ai som eksempel", href: "#bevis" }, en: { label: "See broberg.ai as the example", href: "#bevis" } },
  webshops: { da: { label: "Se Sanne Andersens webshop", href: "#bevis" }, en: { label: "See Sanne Andersen's webshop", href: "#bevis" } },
  platforme: { da: { label: "Se hvordan vi bygger det", href: "/universet" }, en: { label: "See how we build it", href: "/en/universe" } },
  "ai-integration": { da: { label: "Se hele universet", href: "/universet" }, en: { label: "See the whole universe", href: "/en/universe" } },
};

export async function renderSolutionDetail(locale: Locale, slug: string): Promise<string | null> {
  const doc = await loadSolution(locale, slug);
  if (!doc) return null;
  const data = doc.data as unknown as SolutionData;
  const seg = SOLUTIONS_SEGMENT[locale];
  const altSeg = SOLUTIONS_SEGMENT[locale === "en" ? "da" : "en"];
  const mapCta = SOLUTION_SECONDARY_CTA[slug]?.[locale] ?? { label: locale === "en" ? "Book a meeting" : "Book et møde", href: "#kontakt" };
  // Label is inline-editable via solutions.secondaryCtaLabel (seeded); the href
  // stays code-owned (it's an in-page anchor / cross-page link, not content).
  const seededSecondaryLabel = (doc.data as Record<string, unknown>)?.secondaryCtaLabel;
  const secondaryCta = { label: (typeof seededSecondaryLabel === "string" && seededSecondaryLabel) || mapCta.label, href: mapCta.href };
  const solutionRef: CmsRef = { collection: "solutions", slug: String(doc.slug), locale };
  const globalsDoc = await loadGlobals(locale);
  const globalsRef: CmsRef | undefined = globalsDoc ? { collection: "globals", slug: String(globalsDoc.slug), locale } : undefined;
  const globalsData = (globalsDoc?.data ?? {}) as Record<string, unknown>;
  const bookLabel = (typeof globalsData.bookingCtaLabel === "string" && globalsData.bookingCtaLabel) || (locale === "en" ? "Book a meeting" : "Book et møde");
  const gv = (field: string, fallback: string): string => (typeof globalsData[field] === "string" && (globalsData[field] as string)) || fallback;
  const isEnSol = locale === "en";
  const labels = {
    losningerPrefix: gv("solLosningerPrefix", isEnSol ? "Solutions" : "Løsninger"),
    howEyebrow: gv("solHowEyebrow", isEnSol ? "How it works" : "Sådan virker det"),
    howHeading: gv("solHowHeading", isEnSol ? "From meeting to live" : "Fra møde til live"),
    featuresEyebrow: gv("solFeaturesEyebrow", isEnSol ? "Core features" : "Kernefunktioner"),
    featuresHeading: gv("solFeaturesHeading", isEnSol ? "Built into the platform." : "Bygget ind i platformen."),
    proofEyebrow: gv("solProofEyebrow", isEnSol ? "The proof" : "Beviset"),
  };

  return await page(<SolutionPage data={data} locale={locale} secondaryCta={secondaryCta} cmsRef={solutionRef} bookLabel={bookLabel} globalsRef={globalsRef} labels={labels} />, {
    title: `${data.name} — broberg.ai`,
    description: data.lead,
    locale,
    canonical: `/${seg}/${slug}`,
    altHref: `/${altSeg}/${slug}`,
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// The post title is an inline-editable RICH field (data-cms-html) so the editor
// gets the formatting toolbar on the headline. Once edited it's stored as HTML;
// legacy docs still hold a plain `title` + a `titleHighlight` accent word, which
// this reproduces as <em> so old and edited posts render byte-identically.
function titleToHtml(title: string, highlight: string): string {
  if (/<[a-z][\s\S]*>/i.test(title)) return title; // already HTML (edited) — render as-is
  const esc = escapeHtml(title);
  const h = highlight ? escapeHtml(highlight) : "";
  if (!h || !esc.includes(h)) return esc;
  const [before, ...after] = esc.split(h);
  return `${before}<em>${h}</em>${after.join(h)}`;
}

// Plain text of a title for the browser-tab title, social-share title, and card
// lists — strips the inline HTML an edited title now carries so those surfaces
// never leak <em> tags. A no-op on a legacy plain title.
function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "");
}

// Blog post detail — renders a cms post (posts collection, ICD'd to our store).
// `content` is markdown richtext with optional [block:<slug>] shortcodes that
// resolve against the `blocks` collection. 0 hardcoded copy. null → 404.
export async function renderBlogPost(locale: Locale, category: string, slug: string): Promise<string | null> {
  const doc = await loadPost(locale, slug);
  if (!doc) return null;
  const d = (doc.data ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

  const title = str(d.title) || slug.replace(/-/g, " ");
  const content = str(d.content);
  const tags = arr(d.tags);
  const postRef: CmsRef = { collection: "posts", slug: String(doc.slug), locale };

  // Resolve only the block-docs this post actually embeds.
  const slugs = extractBlockSlugs(content);
  const resolved = await Promise.all(slugs.map(async (s) => [s, await loadBlock(s)] as const));
  const blocks: Record<string, StoredDoc> = {};
  for (const [s, b] of resolved) if (b) blocks[s] = b;

  const twin = await loadPostTwin(doc);
  // categoryMeta (not categoryLabel) so we get the category doc's own slug and can
  // wire the eyebrow back to the `categories` collection for inline editing — same
  // `name` field the blog index already edits.
  const { name: catLabel, slug: catSlug } = await categoryMeta(category, locale);
  const catRef: CmsRef | undefined = catSlug ? { collection: "categories", slug: catSlug, locale } : undefined;
  const backLabel = locale === "en" ? `All ${catLabel}` : `Alle ${catLabel}`;
  const twinLabel = twin?.locale === "en" ? "Read in English" : "Læs på dansk";

  return await page(
    <article class="post">
      <div class="wrap reveal">
        <div class="plat-detail-head">
          <div class="plat-detail-text sec-head">
            <div class="eyebrow" {...cmsAttrs(catRef, "name")}>{catLabel}</div>
            <h1 class="post-title" {...cmsHtmlAttrs(postRef, "title")} dangerouslySetInnerHTML={{ __html: titleToHtml(title, str(d.titleHighlight)) }} />
            {(str(d.author) || d.date || str(d.readTime)) ? (
              <p class="post-meta">
                {str(d.author) ? <span {...cmsAttrs(postRef, "author")}>{str(d.author)}</span> : null}
                {str(d.author) && (d.date || str(d.readTime)) ? " · " : null}
                {d.date ? formatDate(str(d.date), locale) : null}
                {d.date && str(d.readTime) ? " · " : null}
                {str(d.readTime) ? <span {...cmsAttrs(postRef, "readTime")}>{str(d.readTime)}</span> : null}
              </p>
            ) : null}
            {tags.length ? (
              <div class="post-tags">
                {tags.map((t, i) => (
                  <a
                    class="pill taglink"
                    key={t}
                    href={withLocale(locale, `/tags/${slugifyTag(t)}`)}
                    data-testid={`tag-${slugifyTag(t)}`}
                    {...cmsAttrs(postRef, `tags.${i}`)}
                  >
                    {t}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
          <div class="plat-illu">
            <Illustration k={pickNewsIllustration(slug)} />
          </div>
        </div>
        <div class="divider" />
        <div class="post-body">
          <PostBody content={content} blocks={blocks} editable={{ collection: "posts", slug: String(doc.slug) }} />
        </div>
        {str(d.attribution) ? (
          <p class="post-attr" {...cmsRichAttrs(postRef, "attribution")} dangerouslySetInnerHTML={{ __html: richtextInline(str(d.attribution)) }} />
        ) : null}
        <div class="cta-row" style="margin-top:36px">
          {twin ? (
            <a
              class="btn btn-ghost"
              href={withLocale(twin.locale, `/${twin.category}/${twin.slug}`)}
              data-testid="post-lang-switch"
              hrefLang={twin.locale}
            >
              {twinLabel} <span class="ar">→</span>
            </a>
          ) : null}
          <a class="btn btn-ghost" href={withLocale(locale, `/${category}`)} data-testid="post-back-link">
            {backLabel} <span class="ar">→</span>
          </a>
        </div>
      </div>
    </article>,
    {
      title: `${stripHtml(title)} — broberg.ai`,
      description: str(d.excerpt) || `${stripHtml(title)} — en indsigt fra broberg.ai-maskinrummet.`,
      locale,
      canonical: withLocale(locale, `/${category}/${slug}`),
      altHref: twin ? withLocale(twin.locale, `/${twin.category}/${twin.slug}`) : undefined,
    },
  );
}

// Blog index — lists every published post in a category, newest first. null when
// the segment is not a real category (the route then renders a generic page).
export async function renderBlogIndex(locale: Locale, category: string): Promise<string | null> {
  if (!(await isCategory(category))) return null;
  const posts = await loadCategoryPosts(locale, category);
  const { name: catLabel, description, slug: catSlug } = await categoryMeta(category, locale);
  const { ref: globalsRef, g } = await globalsChrome(locale);
  const categoryRef: CmsRef | undefined = catSlug ? { collection: "categories", slug: catSlug, locale } : undefined;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const empty = locale === "en" ? "Articles on the way :)" : "Artikler på vej :)";

  return await page(
    <section id="indsigter">
      <div class="wrap reveal">
        <div class="sec-head">
          <div class="eyebrow" {...cmsAttrs(globalsRef, "blogIndexEyebrow")}>{g("blogIndexEyebrow", locale === "en" ? "Insights" : "Indsigter")}</div>
          <h2 {...cmsAttrs(categoryRef, "name")}>{catLabel}</h2>
          {description ? <p class="lead" {...cmsHtmlAttrs(categoryRef, "description")} dangerouslySetInnerHTML={{ __html: description }} /> : null}
          <div class="divider" />
        </div>
        {posts.length ? (
          <div class="grid g3">
            {posts.map((p) => {
              const pd = (p.data ?? {}) as Record<string, unknown>;
              const postRef: CmsRef = { collection: "posts", slug: String(p.slug), locale };
              return (
                <a
                  class="blogcard"
                  key={String(p.slug)}
                  href={withLocale(locale, `/${category}/${String(p.slug)}`)}
                  data-testid={`insight-card-${String(p.slug)}`}
                >
                  <div class="blogthumb">
                    <Illustration k={pickNewsIllustration(String(p.slug))} />
                  </div>
                  <div class="blogbody">
                    <span class="nyt">{str(pd.readTime) || (locale === "en" ? "Article" : "Artikel")}</span>
                    <h3 {...cmsAttrs(postRef, "title")}>{stripHtml(str(pd.title))}</h3>
                    <p {...cmsHtmlAttrs(postRef, "excerpt")} dangerouslySetInnerHTML={{ __html: str(pd.excerpt) }} />
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <p class="lead">{empty}</p>
        )}
      </div>
    </section>,
    {
      title: `${catLabel} — broberg.ai`,
      description: catLabel,
      locale,
      canonical: withLocale(locale, `/${category}`),
      altHref: withLocale(locale === "en" ? "da" : "en", `/${category}`),
    },
  );
}

// Tag page — every post AND flagship carrying a tag. null → unknown tag (404).
export async function renderTagPage(locale: Locale, tagSlug: string): Promise<string | null> {
  const { hits, label } = await loadPostsByTag(locale, tagSlug);
  if (!hits.length) return null;
  const n = hits.length;
  const count = locale === "en" ? `${n} ${n === 1 ? "page" : "pages"}` : `${n} ${n === 1 ? "side" : "sider"}`;
  const { ref: globalsRef, g } = await globalsChrome(locale);

  return await page(
    <section id="tag">
      <div class="wrap reveal">
        <div class="sec-head">
          <div class="eyebrow" {...cmsAttrs(globalsRef, "tagPageEyebrow")}>{g("tagPageEyebrow", "Tag")}</div>
          <h2>#{label}</h2>
          <p class="lead">{count}</p>
          <div class="divider" />
        </div>
        <div class="grid g3">
          {hits.map((h) => (
            <a class="blogcard" key={h.href} href={h.href} data-testid={`tagpost-${h.slug}`}>
              <div class="blogthumb">{h.illustrationKey ? <Illustration k={h.illustrationKey} /> : null}</div>
              <div class="blogbody">
                <span class="nyt">{h.meta}</span>
                <h3 {...cmsAttrs(h.cmsRef, h.titleField)}>{stripHtml(h.title)}</h3>
                <p {...cmsHtmlAttrs(h.cmsRef, h.excerptField)} dangerouslySetInnerHTML={{ __html: h.excerpt }} />
              </div>
            </a>
          ))}
        </div>
        <div class="cta-row" style="margin-top:32px">
          <a class="btn btn-ghost" href={withLocale(locale, "/tags")} data-testid="tags-all-link">
            {locale === "en" ? "All tags" : "Alle tags"} <span class="ar">→</span>
          </a>
        </div>
      </div>
    </section>,
    {
      title: `#${label} — broberg.ai`,
      description:
        locale === "en" ? `Articles tagged "${label}" on broberg.ai.` : `Artikler tagget "${label}" på broberg.ai.`,
      locale,
      canonical: withLocale(locale, `/tags/${tagSlug}`),
    },
  );
}

// Tag cloud — every distinct tag, sized nothing fancy, linking to its tag page.
export async function renderTagCloud(locale: Locale): Promise<string> {
  const tags = await buildTagCloud(locale);
  const { ref: globalsRef, g } = await globalsChrome(locale);
  const heading = g("tagCloudHeading", locale === "en" ? "Browse by tag" : "Find efter tag");
  const empty = locale === "en" ? "No tags yet." : "Ingen tags endnu.";

  return await page(
    <section id="tags">
      <div class="wrap reveal">
        <div class="sec-head">
          <div class="eyebrow" {...cmsAttrs(globalsRef, "tagCloudEyebrow")}>{g("tagCloudEyebrow", "Tags")}</div>
          <h2 {...cmsAttrs(globalsRef, "tagCloudHeading")}>{heading}</h2>
          <div class="divider" />
        </div>
        {tags.length ? (
          <div class="tagcloud">
            {tags.map((t) => (
              <a
                class="pill taglink"
                key={t.slug}
                href={withLocale(locale, `/tags/${t.slug}`)}
                data-testid={`tagcloud-${t.slug}`}
              >
                {t.tag} <span class="tagcount">{t.count}</span>
              </a>
            ))}
          </div>
        ) : (
          <p class="lead">{empty}</p>
        )}
      </div>
    </section>,
    {
      title: "Tags — broberg.ai",
      description: locale === "en" ? "Browse broberg.ai articles by tag." : "Find broberg.ai-artikler efter tag.",
      locale,
      canonical: withLocale(locale, "/tags"),
      altHref: withLocale(locale === "en" ? "da" : "en", "/tags"),
    },
  );
}

// Site index (Indeks) — one page linking to EVERY page on the site: main pages,
// all solutions, all flagships, every blog category + its articles, tags. Doubles
// as a human sitemap and a traversal aid. Linked from the footer's Navigation column.
export async function renderSiteIndex(locale: Locale): Promise<string> {
  const isEn = locale === "en";
  const seg = SOLUTIONS_SEGMENT[locale];
  const fseg = flagshipsSegment(locale);
  const { ref: globalsRef, g } = await globalsChrome(locale);
  const [solutions, platforms, categories] = await Promise.all([
    loadSolutions(locale),
    loadPlatforms(locale),
    loadCategories(locale),
  ]);
  const catPosts = await Promise.all(
    categories.map(async (c) => ({ ...c, posts: await loadCategoryPosts(locale, c.slug) })),
  );

  const mainPages: { label: string; href: string }[] = [
    { label: isEn ? "Home" : "Forsiden", href: withLocale(locale, "/") },
    { label: isEn ? "How we build it" : "Sådan bygger vi det", href: isEn ? "/en/universe" : "/universet" },
    { label: isEn ? "Solutions" : "Løsninger", href: `/${seg}` },
    { label: isEn ? "Flagships" : "Flagskibe", href: `/${fseg}` },
    { label: "Tags", href: withLocale(locale, "/tags") },
    { label: isEn ? "Thank you" : "Tak", href: withLocale(locale, isEn ? "/thanks" : "/tak") },
  ];

  // Every group of pages, in reading order. Rendered as one striped table so
  // it's easy to scan (Christian: "lækker tabel med farveskift").
  const groups: { title: string; links: { label: string; href: string }[] }[] = [
    { title: isEn ? "Main pages" : "Hovedsider", links: mainPages },
    { title: isEn ? "Solutions" : "Løsninger", links: solutions.map((s) => ({ label: s.name, href: `/${seg}/${s.slug}` })) },
    { title: isEn ? "Flagships" : "Flagskibe", links: platforms.map((p) => ({ label: p.name, href: withLocale(locale, `/${fseg}/${p.logoKey}`) })) },
    ...catPosts.map((c) => ({
      title: c.name,
      links: [
        { label: isEn ? `All ${c.name}` : `Alle ${c.name}`, href: withLocale(locale, `/${c.slug}`) },
        ...c.posts.map((p) => {
          const pt = (p.data as Record<string, unknown>)?.title;
          return { label: stripHtml((typeof pt === "string" && pt) || String(p.slug)), href: withLocale(locale, `/${c.slug}/${String(p.slug)}`) };
        }),
      ],
    })),
  ].filter((gr) => gr.links.length);

  // color-mix on var(--light) → a stripe that reads on BOTH the dark and light
  // themes (near-white foreground on dark, near-black on light) without a
  // per-theme override.
  const styles = `
    .si-table{width:100%;border-collapse:collapse;font-size:14px;margin-top:8px}
    .si-table td{padding:10px 16px;border-bottom:1px solid var(--card-border);vertical-align:baseline}
    .si-group td{background:color-mix(in srgb, var(--light) 9%, transparent);font-weight:600;color:var(--light);text-transform:uppercase;letter-spacing:.05em;font-size:11.5px;padding-top:13px;padding-bottom:13px}
    .si-row.odd td{background:color-mix(in srgb, var(--light) 4%, transparent)}
    .si-row td{transition:background .12s ease}
    .si-row:hover td{background:color-mix(in srgb, var(--light) 12%, transparent)}
    .si-row a{color:var(--light);font-weight:500;text-decoration:none}
    .si-row a:hover{color:#F3522C}
    .si-row .si-path{color:var(--muted);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;white-space:nowrap}
    @media(max-width:640px){.si-path{display:none}.si-table td{padding:9px 12px}}
  `;

  return await page(
    <section id="indeks">
      <div class="wrap reveal" style="max-width:900px">
        <div class="sec-head">
          <div class="eyebrow" {...cmsAttrs(globalsRef, "siteIndexEyebrow")}>{g("siteIndexEyebrow", isEn ? "Site index" : "Indeks")}</div>
          <h2 {...cmsAttrs(globalsRef, "siteIndexHeading")}>{g("siteIndexHeading", isEn ? "Every page on the site" : "Alle sider på sitet")}</h2>
          <div class="divider" />
        </div>
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        <table class="si-table" data-testid="site-index-table">
          <tbody>
            {groups.map((group) => (
              <>
                <tr class="si-group" key={`g-${group.title}`}>
                  <td colspan={2}>{group.title}</td>
                </tr>
                {group.links.map((l, i) => (
                  <tr class={`si-row${i % 2 ? " odd" : ""}`} key={l.href} data-testid={`siteindex-row-${l.href}`}>
                    <td>
                      <a href={l.href}>{l.label}</a>
                    </td>
                    <td class="si-path">{l.href}</td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </section>,
    {
      title: isEn ? "Site index — broberg.ai" : "Indeks — broberg.ai",
      description: isEn ? "Every page on broberg.ai in one place." : "Alle sider på broberg.ai ét sted.",
      locale,
      canonical: withLocale(locale, isEn ? "/index" : "/indeks"),
      altHref: withLocale(isEn ? "da" : "en", isEn ? "/indeks" : "/index"),
    },
  );
}

// Generic page — placeholder until cms `pages` are wired.
export async function renderGenericPage(locale: Locale, slug: string): Promise<string> {
  return await page(
    <section>
      <div class="wrap reveal">
        <div class="sec-head">
          <h2>{slug.replace(/-/g, " ")}</h2>
          <div class="divider" />
          <p class="lead">
            {locale === "en" ? "This page loads from cms once the content is wired." : "Denne side hentes fra cms når indholdet er wired."}
          </p>
        </div>
      </div>
    </section>,
    { title: `${slug} — broberg.ai`, description: "broberg.ai", locale },
  );
}
