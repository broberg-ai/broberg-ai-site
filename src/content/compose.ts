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
import { list, type StoredDoc } from "@/content/store.ts";
import type {
  PageModel,
  SectionData,
  Cta,
  HeroData,
  Platform,
  CaseItem,
  DiagramNode,
} from "@/content/types.ts";
import { homeFallback } from "@/data/fallback.ts";

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
      logoKey: String(p.slug ?? str(d.name)).toLowerCase(),
      blurb: str(d.blurb) || str(d.tagline),
      status: str(d.status) || "live",
    };
  });

  // Resolve the "cases" category, then the posts that point at it.
  const casesCat = categories.find((c) => {
    const d = dataOf(c);
    return String(c.slug).toLowerCase() === "cases" || str(d.name).toLowerCase() === "cases";
  });
  const caseKey = casesCat ? [String(casesCat.slug), casesCat.id, dataOf(casesCat).name] : ["cases"];
  const casePosts = posts.filter((p) => caseKey.includes(dataOf(p).category as never));

  const infra: DiagramNode[] = platformItems.map((p) => ({ label: p.name }));
  const customers: DiagramNode[] = arr<{ name?: string }>(globals.clients).map((c) => ({ label: str(c.name) }));

  const built = sections.map((sec) => mapSection(dataOf(sec), { globals, platformItems, casePosts, infra, customers })).filter(
    (s): s is SectionData => s !== null,
  );

  return {
    title: str(globals.siteTitle) || homeFallback.title,
    description: str(globals.siteDescription) || homeFallback.description,
    sections: built.length ? built : homeFallback.sections,
  };
}

interface Ctx {
  globals: Data;
  platformItems: Platform[];
  casePosts: StoredDoc[];
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
      const hero: HeroData = {
        eyebrow: str(d.eyebrow) || fbHero?.eyebrow || "",
        titleHtml: str(d.heading) || fbHero?.titleHtml || "",
        leadHtml: str(d.subheading) || fbHero?.leadHtml || "",
        ctas: ctas.length ? ctas : (fbHero?.ctas ?? []),
        stats: fbHero?.stats ?? [], // our fleet aggregate; cms holds label/fallback
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
        .map((b) => ({ title: str(b.heading), body: str(b.body) }));
      return {
        kind: "universe",
        data: {
          eyebrow: str(d.eyebrow) || fbU?.eyebrow || "",
          headingHtml: str(d.heading) || fbU?.headingHtml || "",
          lead: str(d.subheading) || fbU?.lead || "",
          core: str(ctx.globals.siteName) || fbU?.core || "cardmem",
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
          allLink: cta(d.ctaPrimary, d.ctaPrimaryUrl, "platforme-all-link") ??
            fbP?.allLink ?? { label: "Se alle flagskibe", href: "/flagskibe", testid: "platforme-all-link" },
        },
      };
    }
    case "cases": {
      const fbC = fb?.kind === "cases" ? fb.data : undefined;
      const items: CaseItem[] = ctx.casePosts.map((p) => {
        const pd = dataOf(p);
        return {
          kicker: str(pd.client) || "Case",
          title: str(pd.title),
          body: str(pd.excerpt),
          quote: str(pd.quote) || undefined,
          attr: str(pd.quote) ? str(pd.client) || str(pd.author) : undefined,
        };
      });
      return {
        kind: "cases",
        data: {
          eyebrow: str(d.eyebrow) || fbC?.eyebrow || "",
          headingHtml: str(d.heading) || fbC?.headingHtml || "",
          lead: str(d.subheading) || fbC?.lead || "",
          items: items.length ? items : (fbC?.items ?? []),
        },
      };
    }
    case "method": {
      // Method copy (flow steps + cards) is authored; keep the approved fallback
      // and let cms override only the frame.
      const fbM = fb?.kind === "method" ? fb.data : undefined;
      if (!fbM) return null;
      return {
        kind: "method",
        data: {
          ...fbM,
          eyebrow: str(d.eyebrow) || fbM.eyebrow,
          headingHtml: str(d.heading) || fbM.headingHtml,
          lead: str(d.subheading) || fbM.lead,
        },
      };
    }
    case "insights": {
      const fbI = fb?.kind === "insights" ? fb.data : undefined;
      if (!fbI) return null;
      return {
        kind: "insights",
        data: {
          ...fbI,
          eyebrow: str(d.eyebrow) || fbI.eyebrow,
          headingHtml: str(d.heading) || fbI.headingHtml,
          lead: str(d.subheading) || fbI.lead,
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
          leadHtml: str(g.aboutBio) || fbA?.leadHtml || "",
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
          email: str(g.contactEmail) || fbCo?.email || "christian@broberg.ai",
        },
      };
    }
    default:
      return fb ?? null;
  }
}

// Read a per-request snapshot of the store, then build the model from it. The
// snapshot is a local, so concurrent requests never share mutable state.
export async function loadHome(locale: Locale): Promise<PageModel | null> {
  const collections = ["sections", "platforms", "categories", "posts", "globals"];
  const entries = await Promise.all(collections.map(async (c) => [c, await list(c)] as const));
  const store: Store = Object.fromEntries(entries);
  return buildHomeModel(locale, store);
}
