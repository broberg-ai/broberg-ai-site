/* cms → PageModel adapter. Builds the home model from the local content store
   per the composition cms locked (intercom #59–#62):
     - sections(kind) provide the frame (eyebrow/heading/subheading/ctas);
     - platforms collection fills the flagships grid + universe infra nodes;
     - posts(category=cases) fill the cases cards;
     - globals fills about/contact/nav/footer + universe customers/core + pill.
   Returns null when the store has no sections yet, so the route falls back to
   the mockup-v6 copy. Spec-driven; verified against live cms content once the
   read token + first ICD pushes land. Per-field fallbacks keep it resilient. */
import type { Locale } from "@/config.ts";
import { DEFAULT_LOCALE } from "@/config.ts";
import { list, get, type StoredDoc } from "@/content/store.ts";
import { validateFlagshipPage, type FlagshipPage } from "@/components/FlagshipSlides.tsx";
import type {
  PageModel,
  SectionData,
  Cta,
  HeroData,
  Platform,
  CaseItem,
  DiagramNode,
  Stat,
  PostCard,
} from "@/content/types.ts";
import { homeFallback } from "@/data/fallback.ts";
import { richtextInline } from "@/content/richtext.ts";
import { flagshipsSegment, withLocale } from "@/i18n.ts";

type Data = Record<string, unknown>;
const isPub = (d: StoredDoc) => d.status === "published";
const locOf = (d: StoredDoc) => ((d.locale as string) || DEFAULT_LOCALE) as Locale;
const dataOf = (d: StoredDoc): Data => (d.data as Data) || {};
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const num = (v: unknown): number => (typeof v === "number" ? v : Number(v) || 0);
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

function forLocale(docs: StoredDoc[], locale: Locale): StoredDoc[] {
  return docs.filter((d) => isPub(d) && locOf(d) === locale);
}

// A cms cta becomes either an in-page scroll (#id) or an href.
function cta(label: unknown, url: unknown, testid: string, ghost = false): Cta | null {
  const l = str(label);
  if (!l) return null;
  const u = str(url);
  if (u.startsWith("#")) return { label: l, scroll: u.slice(1), testid, ghost };
  return { label: l, href: u || undefined, testid, ghost };
}

function frameCtas(d: Data): Cta[] {
  return [
    cta(d.ctaPrimary, d.ctaPrimaryUrl, "section-cta-primary"),
    cta(d.ctaSecondary, d.ctaSecondaryUrl, "section-cta-secondary", true),
  ].filter((c): c is Cta => c !== null);
}

type Store = Record<string, StoredDoc[]>;

export function buildHomeModel(locale: Locale, store: Store): PageModel | null {
  const get = (c: string) => store[c] ?? [];
  const sections = forLocale(get("sections"), locale).sort((a, b) => num(dataOf(a).order) - num(dataOf(b).order));
  if (sections.length === 0) return null;

  const platforms = forLocale(get("platforms"), locale).sort((a, b) => num(dataOf(a).order) - num(dataOf(b).order));
  const categories = forLocale(get("categories"), locale);
  const posts = forLocale(get("posts"), locale);
  const globals = dataOf(forLocale(get("globals"), locale)[0] ?? ({} as StoredDoc));

  const platformItems: Platform[] = platforms.map((p) => {
    const d = dataOf(p);
    return {
      name: str(d.name),
      // Keyed by the stable slug, NOT the editable display name — a name
      // edit (e.g. "hosting" -> "drift") must never break the glyph lookup.
      logoKey: String(p.slug).toLowerCase(),
      blurb: str(d.blurb) || str(d.tagline),
      status: str(d.status) || "live",
    };
  });

  // Resolve posts by category — both cases cards and insights cards live in
  // `posts` (cms #62/#68); read them rather than the fallback copy.
  const postsInCategory = (name: string): StoredDoc[] => {
    const cat = categories.find((c) => {
      const d = dataOf(c);
      return String(c.slug).toLowerCase() === name || str(d.name).toLowerCase() === name;
    });
    const keys = cat ? [String(cat.slug), cat.id, dataOf(cat).name] : [name];
    return posts.filter((p) => keys.includes(dataOf(p).category as never));
  };
  const casePosts = postsInCategory("cases");
  const insightPosts = postsInCategory("indsigter");

  // Infra nodes = every platform as a blue building block, cardmem INCLUDED. The
  // brand mark ("b.") is the centre of the universe; cardmem is the core but
  // Christian wants it shown as a node too — "broberg.ai universet" has the brand
  // at the centre and every platform (cardmem included) orbiting it. Each links
  // to its INTERNAL flagship detail page (not the external site).
  const infra: DiagramNode[] = platforms.map((p) => {
    const d = dataOf(p);
    // href keyed by the stable slug, not the editable display name — a name
    // edit (e.g. "hosting" -> "drift") must never turn this into a dead link.
    return { label: str(d.name), href: `/${flagshipsSegment(locale)}/${String(p.slug).toLowerCase()}` };
  });
  // Customer nodes are their OWN list (globals.universeCustomers) — separate from
  // the About wall of brand clients (globals.clients), cms #68. They scroll to Cases.
  const customers: DiagramNode[] = arr<{ name?: string }>(globals.universeCustomers).map((c) => ({
    label: str(c.name),
    scroll: "cases",
  }));

  const built = sections
    .map((sec) => mapSection(dataOf(sec), { locale, globals, platformItems, casePosts, insightPosts, infra, customers }))
    .filter((s): s is SectionData => s !== null);

  return {
    title: str(globals.siteTitle) || homeFallback.title,
    description: str(globals.siteDescription) || homeFallback.description,
    sections: built.length ? built : homeFallback.sections,
  };
}

interface Ctx {
  locale: Locale;
  globals: Data;
  platformItems: Platform[];
  casePosts: StoredDoc[];
  insightPosts: StoredDoc[];
  infra: DiagramNode[];
  customers: DiagramNode[];
}

// Fallback section data by kind, so any field cms doesn't supply degrades to the
// approved copy rather than to blanks.
function fallbackFor(kind: string): SectionData | undefined {
  return homeFallback.sections.find((s) => s.kind === kind);
}

function mapSection(d: Data, ctx: Ctx): SectionData | null {
  const kind = str(d.kind);
  const fb = fallbackFor(kind);

  switch (kind) {
    case "hero": {
      const fbHero = fb?.kind === "hero" ? fb.data : undefined;
      const ctas = frameCtas(d);
      // Stat labels/targets/pre/suf authored in cms (section field or globals);
      // the live numbers come from our fleet aggregation at render time.
      const cmsStats = arr<Stat>(d.stats).length ? arr<Stat>(d.stats) : arr<Stat>(ctx.globals.stats);
      const hero: HeroData = {
        eyebrow: str(d.eyebrow) || fbHero?.eyebrow || "",
        titleHtml: str(d.heading) || fbHero?.titleHtml || "",
        leadHtml: str(d.subheading) || fbHero?.leadHtml || "",
        ctas: ctas.length ? ctas : (fbHero?.ctas ?? []),
        stats: cmsStats.length ? cmsStats : (fbHero?.stats ?? []),
        livePillLabel: str(ctx.globals.heroPillLabel) || fbHero?.livePillLabel || "Live",
      };
      return { kind: "hero", data: hero };
    }
    case "universe": {
      const fbU = fb?.kind === "universe" ? fb.data : undefined;
      // The 3 tiers come from the universe section's `blocks` as custom `tier`
      // blocks {_block:"tier", heading, body} (cms #63).
      const tiers = arr<Data>(d.blocks)
        .filter((b) => str(b._block) === "tier")
        .map((b) => ({ title: str(b.heading), body: richtextInline(str(b.body)) }));
      return {
        kind: "universe",
        data: {
          eyebrow: str(d.eyebrow) || fbU?.eyebrow || "",
          headingHtml: str(d.heading) || fbU?.headingHtml || "",
          lead: str(d.subheading) || fbU?.lead || "",
          // Dedicated field (cms #68) — NOT siteName, which is the wordmark.
          core: str(ctx.globals.universeCore) || fbU?.core || "cardmem",
          infra: ctx.infra.length ? ctx.infra : (fbU?.infra ?? []),
          customers: ctx.customers.length ? ctx.customers : (fbU?.customers ?? []),
          tiers: tiers.length ? tiers : (fbU?.tiers ?? []),
        },
      };
    }
    case "platforms": {
      const fbP = fb?.kind === "platforms" ? fb.data : undefined;
      return {
        kind: "platforms",
        data: {
          eyebrow: str(d.eyebrow) || fbP?.eyebrow || "",
          heading: str(d.heading) || fbP?.heading || "",
          lead: str(d.subheading) || fbP?.lead || "",
          items: ctx.platformItems.length ? ctx.platformItems : (fbP?.items ?? []),
          pathPrefix: `/${flagshipsSegment(ctx.locale)}`,
          allLink: cta(d.ctaPrimary, d.ctaPrimaryUrl, "platforme-all-link") ??
            fbP?.allLink ?? { label: "Se alle flagskibe", href: `/${flagshipsSegment(ctx.locale)}`, testid: "platforme-all-link" },
        },
      };
    }
    case "cases": {
      const fbC = fb?.kind === "cases" ? fb.data : undefined;
      const items: CaseItem[] = ctx.casePosts.map((p) => {
        const pd = dataOf(p);
        const slug = String(p.slug);
        return {
          kicker: str(pd.client) || "Case",
          title: str(pd.title),
          body: str(pd.excerpt),
          quote: str(pd.quote) || undefined,
          attr: str(pd.quote) ? str(pd.client) || str(pd.author) : undefined,
          slug,
          href: withLocale(ctx.locale, `/cases/${slug}`),
        };
      });
      return {
        kind: "cases",
        data: {
          eyebrow: str(d.eyebrow) || fbC?.eyebrow || "",
          headingHtml: str(d.heading) || fbC?.headingHtml || "",
          lead: str(d.subheading) || fbC?.lead || "",
          items: items.length ? items : (fbC?.items ?? []),
          allLink: {
            label: ctx.locale === "en" ? "See all cases" : "Se alle cases",
            href: withLocale(ctx.locale, "/cases"),
            testid: "cases-all-link",
            ghost: true,
          },
        },
      };
    }
    case "method": {
      const fbM = fb?.kind === "method" ? fb.data : undefined;
      // Flow steps + cards authored in cms (fields cms is adding); fall back to
      // the approved copy until they exist.
      const steps = arr<{ label: string; live?: boolean }>(d.steps);
      const cards = arr<{ html: string }>(d.cards);
      return {
        kind: "method",
        data: {
          eyebrow: str(d.eyebrow) || fbM?.eyebrow || "",
          headingHtml: str(d.heading) || fbM?.headingHtml || "",
          lead: str(d.subheading) || fbM?.lead || "",
          steps: steps.length ? steps : (fbM?.steps ?? []),
          cards: cards.length ? cards : (fbM?.cards ?? []),
        },
      };
    }
    case "insights": {
      const fbI = fb?.kind === "insights" ? fb.data : undefined;
      // Cards come from `posts` in the insights category (cms #68), not fallback.
      const posts: PostCard[] = ctx.insightPosts.map((p) => {
        const pd = dataOf(p);
        const slug = String(p.slug ?? "");
        return {
          tag: "Nyt",
          slug,
          category: "indsigter",
          title: str(pd.title),
          excerpt: str(pd.excerpt),
          href: withLocale(ctx.locale, `/indsigter/${slug}`),
        };
      });
      return {
        kind: "insights",
        data: {
          eyebrow: str(d.eyebrow) || fbI?.eyebrow || "",
          headingHtml: str(d.heading) || fbI?.headingHtml || "",
          lead: str(d.subheading) || fbI?.lead || "",
          posts: posts.length ? posts : (fbI?.posts ?? []),
        },
      };
    }
    case "about": {
      const fbA = fb?.kind === "about" ? fb.data : undefined;
      const g = ctx.globals;
      const clients = arr<{ name?: string }>(g.clients).map((c) => str(c.name)).filter(Boolean);
      return {
        kind: "about",
        data: {
          eyebrow: str(d.eyebrow) || fbA?.eyebrow || "Om",
          headingHtml: str(d.heading) || str(g.aboutHeading) || fbA?.headingHtml || "",
          leadHtml: richtextInline(str(g.aboutBio)) || fbA?.leadHtml || "",
          image: str(g.aboutImage) || fbA?.image || "",
          pills: arr<string>(g.skills).length ? arr<string>(g.skills) : (fbA?.pills ?? []),
          clientsLabel: str(d.subheading) || fbA?.clientsLabel || "",
          clients: clients.length ? clients : (fbA?.clients ?? []),
        },
      };
    }
    case "contact": {
      const fbCo = fb?.kind === "contact" ? fb.data : undefined;
      const g = ctx.globals;
      return {
        kind: "contact",
        data: {
          eyebrow: str(d.eyebrow) || fbCo?.eyebrow || "Kontakt",
          headingHtml: str(d.heading) || fbCo?.headingHtml || "",
          lead: str(d.subheading) || fbCo?.lead || "",
          email: str(g.contactEmail) || fbCo?.email || "hej@broberg.ai",
        },
      };
    }
    default:
      return fb ?? null;
  }
}

// A single platform (flagship) by slug, for the /flagskibe/:slug detail page.
// Returns the raw cms doc (data under .data) or null when missing/unpublished.
export async function loadPlatform(locale: Locale, slug: string): Promise<StoredDoc | null> {
  const doc = await get("platforms", slug);
  if (!doc || doc.status !== "published") return null;
  if (doc.locale && locOf(doc) !== locale) return null;
  return doc;
}

// Flagship slide-page data from cms (platforms doc `data.slides`), validated. Null
// when missing/unpublished/wrong-locale/malformed → renderer falls back to the
// in-code registry (no naked cutover; survives cms downtime).
//
// Non-default locales: cms docs are stored with slug "{locale}-{slug}" (e.g.
// "en-docs") so they coexist with the DA doc without overwriting it. We try
// the locale-prefixed key first, then fall back to the plain slug.
export async function loadFlagship(locale: Locale, slug: string): Promise<FlagshipPage | null> {
  if (locale !== DEFAULT_LOCALE) {
    const localised = await get("platforms", `${locale}-${slug}`);
    if (localised && localised.status === "published") {
      return validateFlagshipPage(slug, localised.data);
    }
  }
  const doc = await get("platforms", slug);
  if (!doc || doc.status !== "published") return null;
  if (doc.locale && locOf(doc) !== locale) return null;
  return validateFlagshipPage(slug, doc.data);
}

// All published platforms for the /flagskibe index, in order.
export async function loadPlatforms(locale: Locale): Promise<Platform[]> {
  return forLocale(await list("platforms"), locale)
    .sort((a, b) => num(dataOf(a).order) - num(dataOf(b).order))
    .map((p) => {
      const d = dataOf(p);
      return {
        name: str(d.name),
        logoKey: str(d.name).toLowerCase(),
        blurb: str(d.blurb) || str(d.tagline),
        status: str(d.status) || "live",
      };
    });
}

// ── Solutions (Løsninger, F156) ─────────────────────────────────────────────
// Same locale-prefixed-slug convention as platforms/loadFlagship: EN docs are
// stored as "en-<slug>" so they coexist with the DA doc without overwriting it.

export interface SolutionSummary {
  name: string;
  slug: string;
  blurb: string;
}

function stripLocalePrefix(slug: string, locale: Locale): string {
  const prefix = `${locale}-`;
  return locale !== DEFAULT_LOCALE && slug.startsWith(prefix) ? slug.slice(prefix.length) : slug;
}

// All published solutions for the /losninger index, in order.
export async function loadSolutions(locale: Locale): Promise<SolutionSummary[]> {
  return forLocale(await list("solutions"), locale)
    .sort((a, b) => num(dataOf(a).order) - num(dataOf(b).order))
    .map((p) => ({
      name: str(dataOf(p).name),
      slug: stripLocalePrefix(String(p.slug ?? ""), locale),
      blurb: str(dataOf(p).blurb),
    }));
}

// A single solution's full page data (data.headingHtml/steps/features/proof/...)
// for /losninger/:slug. Null when missing/unpublished/wrong-locale.
export async function loadSolution(locale: Locale, slug: string): Promise<StoredDoc | null> {
  if (locale !== DEFAULT_LOCALE) {
    const localised = await get("solutions", `${locale}-${slug}`);
    if (localised && localised.status === "published") return localised;
  }
  const doc = await get("solutions", slug);
  if (!doc || doc.status !== "published") return null;
  if (doc.locale && locOf(doc) !== locale) return null;
  return doc;
}

// The sales landing's own copy (hero/problem/steps/why-us/faq/cta) — a
// singleton doc, same locale-prefix convention ("en-landing") as the other
// F156 collections.
export async function loadLanding(locale: Locale): Promise<StoredDoc | null> {
  if (locale !== DEFAULT_LOCALE) {
    const localised = await get("landing", `${locale}-landing`);
    if (localised && localised.status === "published") return localised;
  }
  const doc = await get("landing", "landing");
  if (!doc || doc.status !== "published") return null;
  if (doc.locale && locOf(doc) !== locale) return null;
  return doc;
}

// Latest published post per category (F156 /tak "did you see these news?"
// strip) — one per category, newest first per category, categories with zero
// posts in this locale are simply skipped (works with 0..N categories filled,
// no hardcoded count).
export interface LatestNewsItem {
  categoryLabel: string;
  title: string;
  excerpt: string;
  href: string;
}

export async function loadLatestNewsPerCategory(locale: Locale): Promise<LatestNewsItem[]> {
  const cats = forLocale(await list("categories"), DEFAULT_LOCALE);
  const items: LatestNewsItem[] = [];
  for (const cat of cats) {
    const slug = String(cat.slug);
    const posts = await loadCategoryPosts(locale, slug);
    const latest = posts[0];
    if (!latest) continue;
    const pd = dataOf(latest);
    items.push({
      categoryLabel: await categoryLabel(slug, locale),
      title: str(pd.title),
      excerpt: str(pd.excerpt),
      href: withLocale(locale, `/${slug}/${String(latest.slug)}`),
    });
  }
  return items;
}

// Read a per-request snapshot of the store, then build the model from it. The
// snapshot is a local, so concurrent requests never share mutable state.
export async function loadHome(locale: Locale): Promise<PageModel | null> {
  const collections = ["sections", "platforms", "categories", "posts", "globals"];
  const entries = await Promise.all(collections.map(async (c) => [c, await list(c)] as const));
  const store: Store = Object.fromEntries(entries);
  return buildHomeModel(locale, store);
}

// ── Blog / posts ──────────────────────────────────────────────────────────────

// A single post by slug, for the /:category/:slug detail page. Returns the raw
// cms doc (data under .data) or null when missing/unpublished/wrong-locale.
export async function loadPost(locale: Locale, slug: string): Promise<StoredDoc | null> {
  const doc = await get("posts", slug);
  if (!doc || doc.status !== "published") return null;
  if (doc.locale && locOf(doc) !== locale) return null;
  return doc;
}

// A single embeddable block by slug (cms `blocks` collection), resolved for a
// post's [block:<slug>] shortcode. Locale-agnostic: the post references its own
// locale's block slug explicitly, so exact-slug lookup is correct.
export async function loadBlock(slug: string): Promise<StoredDoc | null> {
  const doc = await get("blocks", slug);
  if (!doc || doc.status !== "published") return null;
  return doc;
}

// The translation twin of a post, found by shared translationGroup across
// locales (cms i18n; per-locale slugs differ). Null when the post is monolingual.
export async function loadPostTwin(
  doc: StoredDoc,
): Promise<{ locale: Locale; slug: string; category: string } | null> {
  const tg = (doc as { translationGroup?: string }).translationGroup;
  if (!tg) return null;
  const twin = (await list("posts")).find(
    (p) => isPub(p) && (p as { translationGroup?: string }).translationGroup === tg && locOf(p) !== locOf(doc),
  );
  if (!twin) return null;
  return { locale: locOf(twin), slug: String(twin.slug), category: str(dataOf(twin).category) };
}

// Resolve a category slug to its cms doc. The url segment is locale-shared
// (e.g. "indsigter" for both /indsigter and /en/indsigter); a translated EN
// label/description lives in a separate doc keyed "en-<slug>" (same convention
// as platforms/loadFlagship) and is preferred when present.
async function categoryBySlug(category: string, locale: Locale = DEFAULT_LOCALE): Promise<StoredDoc | undefined> {
  const all = (await list("categories")).filter(isPub);
  if (locale !== DEFAULT_LOCALE) {
    const localised = all.find((c) => String(c.slug).toLowerCase() === `${locale}-${category}`.toLowerCase());
    if (localised) return localised;
  }
  return all.find((c) => String(c.slug).toLowerCase() === category.toLowerCase());
}

// True when `slug` names a real category — used by the single-segment route to
// decide category-index vs generic page.
export async function isCategory(slug: string): Promise<boolean> {
  return (await categoryBySlug(slug)) !== undefined;
}

// Display label for a category (its cms name), falling back to the slug.
export async function categoryLabel(category: string, locale: Locale = DEFAULT_LOCALE): Promise<string> {
  const cat = await categoryBySlug(category, locale);
  return cat ? str(dataOf(cat).name) || category : category;
}

// Category display name + description (cms-driven) for the category index page.
export async function categoryMeta(
  category: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<{ name: string; description: string }> {
  const cat = await categoryBySlug(category, locale);
  const d = cat ? dataOf(cat) : {};
  return { name: str(d.name) || category, description: str(d.description) };
}

// All published posts in a category for the given locale, newest first.
export async function loadCategoryPosts(locale: Locale, category: string): Promise<StoredDoc[]> {
  const posts = forLocale(await list("posts"), locale);
  const cat = await categoryBySlug(category);
  const keys = cat ? [String(cat.slug), cat.id, dataOf(cat).name] : [category];
  return posts
    .filter((p) => keys.includes(dataOf(p).category as never))
    .sort((a, b) => String(dataOf(b).date).localeCompare(String(dataOf(a).date)));
}

// ── Search index (⌘K) ─────────────────────────────────────────────────────────

// One CmdItem-shaped entry per searchable surface. Mirrors the cmdk-palette
// CmdItem shape (id/title/subtitle/badge/badgeTone/data=href) — the client casts
// the JSON straight into the palette, no /api/search needed. Content comes from
// the cms store (platforms + posts) so search stays 100% editable in cms.
export interface SearchEntry {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeTone: "clay" | "olive" | "oat" | "neutral";
  data: string;
}

export async function buildSearchIndex(locale: Locale): Promise<SearchEntry[]> {
  const seg = flagshipsSegment(locale);
  const out: SearchEntry[] = [];

  const platforms = forLocale(await list("platforms"), locale).sort(
    (a, b) => num(dataOf(a).order) - num(dataOf(b).order),
  );
  for (const p of platforms) {
    const d = dataOf(p);
    const slug = String(p.slug ?? str(d.name)).toLowerCase();
    out.push({
      id: `flagship:${slug}`,
      title: str(d.name) || slug,
      subtitle: str(d.blurb) || str(d.tagline),
      badge: "FLAGSKIB",
      badgeTone: "clay",
      data: withLocale(locale, `/${seg}/${slug}`),
    });
  }

  const posts = forLocale(await list("posts"), locale);
  for (const p of posts) {
    const d = dataOf(p);
    const cat = str(d.category);
    out.push({
      id: `post:${String(p.slug)}`,
      title: str(d.title),
      subtitle: str(d.excerpt),
      badge: cat === "cases" ? "CASE" : "INDSIGT",
      badgeTone: cat === "cases" ? "oat" : "olive",
      data: withLocale(locale, `/${cat}/${String(p.slug)}`),
    });
  }

  return out.filter((e) => e.title);
}

// ── Tags (clickable → /tags/<slug>, cloud at /tags) ───────────────────────────

// URL slug for a tag: lowercase, spaces/punctuation → dashes. Keeps æøå (real
// Danish, no transliteration) consistent with post slugs.
export function slugifyTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9æøå]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// All published posts (for the locale) carrying a tag whose slug matches, newest
// first, plus the tag's display label (original case). Empty posts → unknown tag.
export async function loadPostsByTag(
  locale: Locale,
  tagSlug: string,
): Promise<{ posts: StoredDoc[]; label: string }> {
  let label = tagSlug;
  const posts = forLocale(await list("posts"), locale)
    .filter((p) => {
      const hit = arr<string>(dataOf(p).tags).find((t) => slugifyTag(t) === tagSlug);
      if (hit) {
        label = hit;
        return true;
      }
      return false;
    })
    .sort((a, b) => String(dataOf(b).date).localeCompare(String(dataOf(a).date)));
  return { posts, label };
}

// Every distinct tag across the locale's posts, with usage counts (most-used first).
export interface TagCount {
  tag: string;
  slug: string;
  count: number;
}
export async function buildTagCloud(locale: Locale): Promise<TagCount[]> {
  const map = new Map<string, TagCount>();
  for (const p of forLocale(await list("posts"), locale)) {
    for (const t of arr<string>(dataOf(p).tags)) {
      const slug = slugifyTag(t);
      if (!slug) continue;
      const e = map.get(slug);
      if (e) e.count++;
      else map.set(slug, { tag: t, slug, count: 1 });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
