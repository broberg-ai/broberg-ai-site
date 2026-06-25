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
import { loadHome, loadPlatform, loadPlatforms } from "@/content/compose.ts";
import { richtextBlock } from "@/content/richtext.ts";
import { Logo } from "@/components/Logos.tsx";
import { Illustration, hasIllustration } from "@/components/Illustrations.tsx";
import type { PlatformsData } from "@/content/types.ts";
import { flagshipsSegment } from "@/i18n.ts";

function page(children: any, meta: { title: string; description: string; locale: Locale; canonical?: string }) {
  return renderPage(
    <>
      <Nav />
      {children}
      <Footer />
    </>,
    meta,
    resolveAssets(),
  );
}

export async function renderHome(locale: Locale): Promise<string> {
  // Prefer live cms content from the local store; fall back to mockup-v6 copy
  // until the first ICD pushes / backfill land.
  const model = (await loadHome(locale)) ?? homeFallback;
  return page(<RenderSections sections={model.sections} />, {
    title: model.title,
    description: model.description,
    locale,
  });
}

// Flagships index — a dedicated page for ALL platforms (Christian: "en
// selvstændig side om ALLE flagskibene"), rendered from the cms platforms.
export async function renderFlagships(locale: Locale): Promise<string> {
  const items = await loadPlatforms(locale);
  const seg = flagshipsSegment(locale);
  const data: PlatformsData = {
    eyebrow: "Flagskibe",
    heading: "Motorerne bag det hele.",
    lead: "De AI-native platforme vi selv har bygget — og som hver ny kundeløsning står på skuldrene af.",
    items: items.length ? items : [],
    allLink: { label: "Til forsiden", href: "/", testid: "flagships-home-link" },
  };
  return page(<Platforms data={data} />, {
    title: "Flagskibe — broberg.ai",
    description: "De AI-native platforme bag broberg.ai-universet.",
    locale,
    canonical: `/${seg}`,
  });
}

// Flagship detail — renders the cms platform doc in the brand design. `body` is
// richtext (Markdown) → richtextBlock. cms fills the content; this is the shell.
export async function renderFlagshipDetail(locale: Locale, slug: string): Promise<string | null> {
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

  return page(
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
    { title: `${name} — broberg.ai`, description: tagline || `${name} — et broberg.ai-flagskib.`, locale },
  );
}

// Blog post — placeholder until cms posts/categories are wired.
export function renderBlogPost(locale: Locale, category: string, slug: string): string {
  return page(
    <section>
      <div class="wrap reveal">
        <div class="sec-head">
          <div class="eyebrow">{category}</div>
          <h2>{slug.replace(/-/g, " ")}</h2>
          <div class="divider" />
          <p class="lead">Dette indlæg hentes fra cms når blog-indholdet er wired.</p>
        </div>
      </div>
    </section>,
    { title: `${slug} — Indsigter`, description: "Indsigt fra broberg.ai-maskinrummet.", locale },
  );
}

// Generic page — placeholder until cms `pages` are wired.
export function renderGenericPage(locale: Locale, slug: string): string {
  return page(
    <section>
      <div class="wrap reveal">
        <div class="sec-head">
          <h2>{slug.replace(/-/g, " ")}</h2>
          <div class="divider" />
          <p class="lead">Denne side hentes fra cms når indholdet er wired.</p>
        </div>
      </div>
    </section>,
    { title: `${slug} — broberg.ai`, description: "broberg.ai", locale },
  );
}
