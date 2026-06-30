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
} from "@/content/compose.ts";
import { richtextBlock, richtextInline } from "@/content/richtext.ts";
import { PostBody, extractBlockSlugs } from "@/render/postBody.tsx";
import { Logo } from "@/components/Logos.tsx";
import { Illustration, hasIllustration } from "@/components/Illustrations.tsx";
import { FlagshipSlides, flagshipFromRegistry } from "@/components/FlagshipSlides.tsx";
import type { PlatformsData } from "@/content/types.ts";
import type { StoredDoc } from "@/content/store.ts";
import { flagshipsSegment, withLocale } from "@/i18n.ts";

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
  // Slide pages: prefer the cms-authored copy (platforms doc `data.slides`, ICD'd
  // to our store); fall back to the in-code registry when cms has none/invalid.
  const fp = (await loadFlagship(locale, slug)) ?? flagshipFromRegistry(slug);
  if (fp) {
    return page(<FlagshipSlides page={fp} locale={locale} />, {
      title: `${fp.slug} — broberg.ai`,
      description: fp.description,
      locale,
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
  const catLabel = await categoryLabel(category);
  const backLabel = locale === "en" ? `All ${catLabel}` : `Alle ${catLabel}`;
  const twinLabel = twin?.locale === "en" ? "Read in English" : "Læs på dansk";

  return page(
    <article class="post">
      <div class="wrap reveal">
        <div class="sec-head">
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
          <div class="divider" />
        </div>
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
    },
  );
}

// Blog index — lists every published post in a category, newest first. null when
// the segment is not a real category (the route then renders a generic page).
export async function renderBlogIndex(locale: Locale, category: string): Promise<string | null> {
  if (!(await isCategory(category))) return null;
  const posts = await loadCategoryPosts(locale, category);
  const { name: catLabel, description } = await categoryMeta(category);
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const empty = locale === "en" ? "Articles on the way :)" : "Artikler på vej :)";

  return page(
    <section id="indsigter">
      <div class="wrap reveal">
        <div class="sec-head">
          <div class="eyebrow">Ressourcer</div>
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
                  <div class="blogthumb" />
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
    { title: `${catLabel} — broberg.ai`, description: catLabel, locale, canonical: withLocale(locale, `/${category}`) },
  );
}

// Tag page — every post carrying a tag, across categories. null → unknown tag (404).
export async function renderTagPage(locale: Locale, tagSlug: string): Promise<string | null> {
  const { posts, label } = await loadPostsByTag(locale, tagSlug);
  if (!posts.length) return null;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const n = posts.length;
  const count = locale === "en" ? `${n} ${n === 1 ? "article" : "articles"}` : `${n} ${n === 1 ? "artikel" : "artikler"}`;

  return page(
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
                <div class="blogthumb" />
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

  return page(
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
      title: locale === "en" ? "Tags — broberg.ai" : "Tags — broberg.ai",
      description: locale === "en" ? "Browse broberg.ai articles by tag." : "Find broberg.ai-artikler efter tag.",
      locale,
      canonical: withLocale(locale, "/tags"),
    },
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
