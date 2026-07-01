/* Route handlers — return full HTML strings. The home page renders the complete
   landing from the model (fallback copy until cms is wired); the other routes
   render valid minimal pages so navigation never 404s before content lands.
   When cms is wired, each handler builds its model from the local store. */
import type { Locale } from "@/config.ts";
import { Nav } from "@/components/Nav.tsx";
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
  categoryLabel,
  categoryMeta,
  isCategory,
  slugifyTag,
  loadPostsByTag,
  buildTagCloud,
  loadSolutions,
  loadSolution,
  loadLanding,
  loadLatestNewsPerCategory,
  loadRandomNews,
  loadFooter,
} from "@/content/compose.ts";
import { richtextBlock, richtextInline } from "@/content/richtext.ts";
import { PostBody, extractBlockSlugs } from "@/render/postBody.tsx";
import { Logo } from "@/components/Logos.tsx";
import { Illustration, hasIllustration, pickNewsIllustration } from "@/components/Illustrations.tsx";
import { FlagshipSlides, flagshipFromRegistry } from "@/components/FlagshipSlides.tsx";
import { SolutionPage, type SolutionData } from "@/components/SolutionPage.tsx";
import { Cases, Insights } from "@/components/sections.tsx";
import { Faq } from "@/components/Faq.tsx";
import { Contact } from "@/components/Contact.tsx";
import type { PlatformsData, CasesData, CaseItem } from "@/content/types.ts";
import type { StoredDoc } from "@/content/store.ts";
import { flagshipsSegment, withLocale } from "@/i18n.ts";

const SOLUTIONS_SEGMENT: Record<Locale, string> = { da: "losninger", en: "solutions" };

async function page(
  children: any,
  meta: { title: string; description: string; locale: Locale; canonical?: string; altHref?: string },
) {
  const footerData = await loadFooter(meta.locale);
  return renderPage(
    <>
      <Nav locale={meta.locale} altHref={meta.altHref} />
      {children}
      <Footer data={footerData} />
    </>,
    meta,
    resolveAssets(),
  );
}

// "Sådan bygger vi det" (F156.4) — the ORIGINAL homepage content (universe
// diagram, all 12 flagship cards, SDLC method, full About bio), relocated
// unchanged from `/` to `/universet` (DA) / `/en/universe` (EN) when the new
// sales landing (renderHome below) took over the root routes. Content and
// rendering logic are byte-for-byte the same as before the move — only the
// URL + this function's name changed.
export async function renderUniverset(locale: Locale): Promise<string> {
  // Prefer live cms content from the local store; fall back to mockup-v6 copy
  // until the first ICD pushes / backfill land.
  const model = (await loadHome(locale)) ?? homeFallback;
  return await page(<RenderSections sections={model.sections} />, {
    title: model.title,
    description: model.description,
    locale,
    altHref: locale === "en" ? "/universet" : "/en/universe",
    canonical: locale === "en" ? "/en/universe" : "/universet",
  });
}

// New sales landing (F156.3) — Hero → Problem → Løsninger grid → Sådan
// foregår det → Cases (real, reused verbatim) → Hvorfor os → FAQ → Kontakt.
// Falls back to renderUniverset's content if the `landing` cms doc isn't
// there yet (no naked cutover — never a blank homepage).
export async function renderHome(locale: Locale): Promise<string> {
  const landing = await loadLanding(locale);
  if (!landing) return renderUniverset(locale);
  const d = landing.data as Record<string, any>;
  const isEn = locale === "en";
  const seg = SOLUTIONS_SEGMENT[locale];
  const universetHref = isEn ? "/en/universe" : "/universet";

  const solutions = await loadSolutions(locale);
  const randomNews = await loadRandomNews(locale, 3);
  const casePosts = await loadCategoryPosts(locale, "cases");
  const caseItems: CaseItem[] = casePosts.map((p) => {
    const pd = (p.data ?? {}) as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" ? v : "");
    const slug = String(p.slug);
    return {
      kicker: str(pd.client) || "Case",
      title: str(pd.title),
      body: str(pd.excerpt),
      quote: str(pd.quote) || undefined,
      attr: str(pd.quote) ? str(pd.client) || str(pd.author) : undefined,
      slug,
      href: withLocale(locale, `/cases/${slug}`),
    };
  });
  const casesData: CasesData = {
    eyebrow: "Cases",
    headingHtml: isEn
      ? `Built <em class="o">fast</em>. Built right.`
      : `Bygget <em class="o">lynhurtigt</em>. Bygget rigtigt.`,
    lead: isEn
      ? "Real customers got real results — delivered in a fraction of the normal time, because the foundation was already in place."
      : "Rigtige kunder fik rigtige resultater — leveret på en brøkdel af den normale tid, fordi fundamentet allerede lå klar.",
    items: caseItems,
    allLink: { label: isEn ? "See all cases" : "Se alle cases", href: withLocale(locale, "/cases"), testid: "landing-cases-all-link", ghost: true },
  };

  return await page(
    <>
      <section class="hero" id="top">
        <div class="wrap hero-grid">
          <div>
            <div class="eyebrow">{d.heroEyebrow}</div>
            <h1 dangerouslySetInnerHTML={{ __html: d.heroHeadingHtml }} />
            <p class="lead">{d.heroLead}</p>
            <div class="cta-row">
              <a class="btn" href="#kontakt" data-testid="landing-cta-primary">
                {isEn ? "Book a meeting" : "Book et møde"} <span class="ar">→</span>
              </a>
              <a class="btn btn-ghost" href={universetHref} data-testid="landing-cta-secondary">
                {isEn ? "See how we build it" : "Se hvordan vi bygger det"} <span class="ar">→</span>
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
          <h2 style="font-size:clamp(26px,3.4vw,38px)">{d.problemHeading}</h2>
          <div class="divider" />
          {(d.problemP as string[]).map((p, i) => (
            <p class="lead" key={i} style={`max-width:none;${i < d.problemP.length - 1 ? "margin-bottom:16px" : ""}`}>
              {p}
            </p>
          ))}
          {d.problemCallout ? (
            <div class="card callout" style="margin-top:24px">
              <p style="color:var(--light);font-weight:600;font-size:15px">{d.problemCallout}</p>
            </div>
          ) : null}
        </div>
      </section>

      <section id="losninger">
        <div class="wrap">
          <div class="sec-head">
            <div class="eyebrow">{isEn ? "Solutions" : "Løsninger"}</div>
            <h2>{isEn ? "What can we build for you?" : "Hvad kan vi bygge til dig?"}</h2>
            <p class="lead">
              {isEn
                ? "Four ways in — pick the one that matches where you are today. Each solution has its own page with more detail."
                : "Fire veje ind — vælg den der matcher hvor I er i dag. Hver løsning har sin egen side med dybere detaljer."}
            </p>
          </div>
          <div class="grid g4">
            {solutions.map((s) => (
              <a class="card" href={`/${seg}/${s.slug}`} key={s.slug} data-testid={`landing-solution-card-${s.slug}`}>
                <div class="plat-h">
                  <div class="nm">{s.name}</div>
                </div>
                <p>{s.blurb}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section style="background:var(--dark2)">
        <div class="wrap">
          <div class="sec-head" style="text-align:center;margin-left:auto;margin-right:auto">
            <div class="eyebrow" style="justify-content:center">{isEn ? "How it works" : "Sådan foregår det"}</div>
            <h2>{d.stepsHeading}</h2>
          </div>
          <div class="steps3">
            {(d.steps as [string, string][]).map(([title, desc], i) => (
              <div class="step3" key={title}>
                <div class="step3-num">{i + 1}</div>
                <div class="workstep-title">{title}</div>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Cases data={casesData} />

      <section>
        <div class="wrap" style="max-width:680px;text-align:center">
          <div class="eyebrow" style="justify-content:center">{isEn ? "Why us" : "Hvorfor os"}</div>
          <h2>{d.whyUsHeading}</h2>
          <p class="lead" style="max-width:none;margin:18px auto 30px">{d.whyUsBody}</p>
          <a class="btn btn-ghost" href={universetHref} data-testid="landing-whyus-cta">
            {isEn ? "See the whole machine" : "Se hele maskinen"} <span class="ar">→</span>
          </a>
        </div>
      </section>

      <Faq items={d.faq as [string, string][]} locale={locale} />

      {randomNews.length ? (
        <Insights
          data={{
            eyebrow: isEn ? "Thoughts" : "Tanker",
            headingHtml: isEn ? `Thoughts from the <em class="o">engine room</em>.` : `Tanker fra <em class="o">maskinrummet</em>.`,
            lead: isEn
              ? "Weekly notes on AI-native development and automation — for builders, product managers and the curious."
              : "Ugentlige nedslag om AI-native udvikling og automatisering — for builders, product managers og nysgerrige.",
            posts: randomNews,
          }}
        />
      ) : null}

      <Contact data={{ ctaHeadingHtml: d.ctaHeadingHtml, ctaLead: d.ctaLead }} locale={locale} />
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

  return await page(
    <>
      <section id="top">
        <div class="wrap" style="padding-top:150px;text-align:center;max-width:640px">
          <div class="eyebrow" style="justify-content:center">{isEn ? "Thank you" : "Tak"}</div>
          <h1>{isEn ? "Thank you!" : "Tak!"}</h1>
          <p class="lead" style="margin:18px auto 0">
            {isEn ? "We'll get back to you as soon as possible." : "Vi vender tilbage hurtigst muligt."}
          </p>
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
              <div class="eyebrow" style="justify-content:center">{isEn ? "By the way" : "Forresten"}</div>
              <h2>{isEn ? "Did you catch this news?" : "Fik du læst disse nyheder?"}</h2>
            </div>
            <div class="grid g3">
              {news.map((n, i) => (
                <a class="blogcard" href={n.href} key={i} data-testid={`thanks-news-${i}`}>
                  <div class="blogthumb">
                    {n.category !== "cases" ? <Illustration k={pickNewsIllustration(n.slug)} /> : null}
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
  const data: PlatformsData = {
    eyebrow: isEn ? "Flagships" : "Flagskibe",
    heading: isEn ? "The engines behind it all." : "Motorerne bag det hele.",
    lead: isEn
      ? "The AI-native platforms we built ourselves — and that every new customer solution stands on the shoulders of."
      : "De AI-native platforme vi selv har bygget — og som hver ny kundeløsning står på skuldrene af.",
    items: items.length ? items : [],
    pathPrefix: `/${seg}`,
    allLink: { label: isEn ? "Back to home" : "Til forsiden", href: isEn ? "/en" : "/", testid: "flagships-home-link" },
  };
  return await page(<Platforms data={data} />, {
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
  const fp = (await loadFlagship(locale, slug)) ?? flagshipFromRegistry(slug);
  // Flagship slugs are shared across locales (only the cms doc is prefixed
  // "en-<slug>"), so the alternate URL is a straight locale-segment swap.
  const altHref = locale === "en" ? `/flagskibe/${slug}` : `/en/flagships/${slug}`;
  if (fp) {
    return await page(<FlagshipSlides page={fp} locale={locale} />, {
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
  const bodyHtml = richtextBlock(str(d.body));
  const features = Array.isArray(d.features) ? (d.features as string[]) : [];
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
            <h2>{name}</h2>
            {tagline ? <p class="lead">{tagline}</p> : null}
          </div>
          {hasIllustration(slug) ? (
            <div class="plat-illu">
              <Illustration k={slug} />
            </div>
          ) : null}
        </div>
        <div class="divider" />
        {bodyHtml ? <div class="richtext" dangerouslySetInnerHTML={{ __html: bodyHtml }} /> : null}
        {features.length ? (
          <div style="margin-top:22px">
            {features.map((f) => (
              <span class="pill" key={f}>
                {f}
              </span>
            ))}
          </div>
        ) : null}
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
  return await page(
    <section>
      <div class="wrap reveal">
        <div class="sec-head">
          <div class="eyebrow">{isEn ? "Solutions" : "Løsninger"}</div>
          <h2>{isEn ? "What can we build for you?" : "Hvad kan vi bygge til dig?"}</h2>
          <div class="divider" />
          <p class="lead">
            {isEn
              ? "Four ways in — pick the one that matches where you are today."
              : "Fire veje ind — vælg den der matcher hvor I er i dag."}
          </p>
        </div>
        <div class="grid g4">
          {items.map((s) => (
            <a class="card" href={`/${seg}/${s.slug}`} key={s.slug} data-testid={`solution-card-${s.slug}`}>
              <div class="plat-h">
                <div class="nm">{s.name}</div>
              </div>
              <p>{s.blurb}</p>
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
  const secondaryCta = SOLUTION_SECONDARY_CTA[slug]?.[locale] ?? { label: locale === "en" ? "Book a meeting" : "Book et møde", href: "#kontakt" };

  return await page(<SolutionPage data={data} locale={locale} secondaryCta={secondaryCta} />, {
    title: `${data.name} — broberg.ai`,
    description: data.lead,
    locale,
    canonical: `/${seg}/${slug}`,
    altHref: `/${altSeg}/${slug}`,
  });
}

// Title with the cms `titleHighlight` word rendered as the <em> accent (mirrors
// the hero's accent). Falls back to the plain title when no highlight is set.
function titleWithAccent(title: string, highlight: string) {
  if (!highlight || !title.includes(highlight)) return <>{title}</>;
  const [before, ...after] = title.split(highlight);
  return (
    <>
      {before}
      <em>{highlight}</em>
      {after.join(highlight)}
    </>
  );
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
  const meta = [str(d.author), str(d.date), str(d.readTime)].filter(Boolean).join(" · ");

  // Resolve only the block-docs this post actually embeds.
  const slugs = extractBlockSlugs(content);
  const resolved = await Promise.all(slugs.map(async (s) => [s, await loadBlock(s)] as const));
  const blocks: Record<string, StoredDoc> = {};
  for (const [s, b] of resolved) if (b) blocks[s] = b;

  const twin = await loadPostTwin(doc);
  const catLabel = await categoryLabel(category, locale);
  const backLabel = locale === "en" ? `All ${catLabel}` : `Alle ${catLabel}`;
  const twinLabel = twin?.locale === "en" ? "Read in English" : "Læs på dansk";

  const showIllu = category !== "cases";

  return await page(
    <article class="post">
      <div class="wrap reveal">
        <div class={showIllu ? "plat-detail-head" : "plat-detail-head one-col"}>
          <div class="plat-detail-text sec-head">
            <div class="eyebrow">{catLabel}</div>
            <h1 class="post-title">{titleWithAccent(title, str(d.titleHighlight))}</h1>
            {meta ? <p class="post-meta">{meta}</p> : null}
            {tags.length ? (
              <div class="post-tags">
                {tags.map((t) => (
                  <a
                    class="pill taglink"
                    key={t}
                    href={withLocale(locale, `/tags/${slugifyTag(t)}`)}
                    data-testid={`tag-${slugifyTag(t)}`}
                  >
                    {t}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
          {showIllu ? (
            <div class="plat-illu">
              <Illustration k={pickNewsIllustration(slug)} />
            </div>
          ) : null}
        </div>
        <div class="divider" />
        <div class="post-body">
          <PostBody content={content} blocks={blocks} />
        </div>
        {str(d.attribution) ? (
          <p class="post-attr" dangerouslySetInnerHTML={{ __html: richtextInline(str(d.attribution)) }} />
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
      title: `${title} — broberg.ai`,
      description: str(d.excerpt) || `${title} — en indsigt fra broberg.ai-maskinrummet.`,
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
  const { name: catLabel, description } = await categoryMeta(category, locale);
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const empty = locale === "en" ? "Articles on the way :)" : "Artikler på vej :)";

  return await page(
    <section id="indsigter">
      <div class="wrap reveal">
        <div class="sec-head">
          <div class="eyebrow">{locale === "en" ? "Insights" : "Indsigter"}</div>
          <h2>{catLabel}</h2>
          {description ? <p class="lead">{description}</p> : null}
          <div class="divider" />
        </div>
        {posts.length ? (
          <div class="grid g3">
            {posts.map((p) => {
              const pd = (p.data ?? {}) as Record<string, unknown>;
              return (
                <a
                  class="blogcard"
                  key={String(p.slug)}
                  href={withLocale(locale, `/${category}/${String(p.slug)}`)}
                  data-testid={`insight-card-${String(p.slug)}`}
                >
                  <div class="blogthumb">
                    {category !== "cases" ? <Illustration k={pickNewsIllustration(String(p.slug))} /> : null}
                  </div>
                  <div class="blogbody">
                    <span class="nyt">{str(pd.readTime) || (locale === "en" ? "Article" : "Artikel")}</span>
                    <h3>{str(pd.title)}</h3>
                    <p>{str(pd.excerpt)}</p>
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

// Tag page — every post carrying a tag, across categories. null → unknown tag (404).
export async function renderTagPage(locale: Locale, tagSlug: string): Promise<string | null> {
  const { posts, label } = await loadPostsByTag(locale, tagSlug);
  if (!posts.length) return null;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const n = posts.length;
  const count = locale === "en" ? `${n} ${n === 1 ? "article" : "articles"}` : `${n} ${n === 1 ? "artikel" : "artikler"}`;

  return await page(
    <section id="tag">
      <div class="wrap reveal">
        <div class="sec-head">
          <div class="eyebrow">Tag</div>
          <h2>#{label}</h2>
          <p class="lead">{count}</p>
          <div class="divider" />
        </div>
        <div class="grid g3">
          {posts.map((p) => {
            const pd = (p.data ?? {}) as Record<string, unknown>;
            const cat = str(pd.category) || "indsigter";
            return (
              <a
                class="blogcard"
                key={String(p.slug)}
                href={withLocale(locale, `/${cat}/${String(p.slug)}`)}
                data-testid={`tagpost-${String(p.slug)}`}
              >
                <div class="blogthumb">
                  {cat !== "cases" ? <Illustration k={pickNewsIllustration(String(p.slug))} /> : null}
                </div>
                <div class="blogbody">
                  <span class="nyt">{str(pd.readTime) || (locale === "en" ? "Article" : "Artikel")}</span>
                  <h3>{str(pd.title)}</h3>
                  <p>{str(pd.excerpt)}</p>
                </div>
              </a>
            );
          })}
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
  const heading = locale === "en" ? "Browse by tag" : "Find efter tag";
  const empty = locale === "en" ? "No tags yet." : "Ingen tags endnu.";

  return await page(
    <section id="tags">
      <div class="wrap reveal">
        <div class="sec-head">
          <div class="eyebrow">Tags</div>
          <h2>{heading}</h2>
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
