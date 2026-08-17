/* Live page references (cms F164).
 *
 * A link an editor made with the inline editor's link button stores WHICH PAGE
 * it points at — `data-cms-ref="collection:slug"` — next to a real href. This
 * table answers "where does that page live now, and what is it called now", so
 * renderCmsLinks can re-point the link when a page moves or is renamed. Nothing
 * rewrites stored content; the correction happens at render time.
 *
 * ONE table covering BOTH locales, deliberately. A per-request, per-locale
 * lookup would be module-level state mutated by concurrent requests — the exact
 * race that makes one visitor's page borrow another's data. broberg's slugs
 * already carry the locale ("en-cms" vs "cms"), so a single map has no
 * ambiguity to resolve and nothing to mutate per request.
 *
 * Degrades quietly and safely: an empty or stale table simply leaves links as
 * they were stored, which is what the site did before this existed. The href in
 * the content is always a real address, so a miss is never a dead link.
 */
import { LOCALES } from "@/config.ts";
import type { Locale } from "@/config.ts";
import { flagshipsSegment, withLocale } from "@/i18n.ts";
import { loadCategories, loadCategoryPosts, loadPlatforms, loadSolutions } from "./compose.ts";
import type { StoredDoc } from "./store.ts";

export interface LinkTarget {
  url: string;
  title: string;
}

const SOLUTIONS_SEGMENT: Record<Locale, string> = { da: "losninger", en: "solutions" };
/** How long a built table is trusted before a refresh is kicked off. */
const TTL_MS = 60_000;

let table = new Map<string, LinkTarget>();
let builtAt = 0;
let building = false;

const key = (collection: string, slug: string) => `${collection}:${slug}`;

/** Sync lookup handed to resolveCmsLinks. Unknown reference → null (keep href). */
export function cmsLinkLookup(collection: string, slug: string): LinkTarget | null {
  return table.get(key(collection, slug)) ?? null;
}

function stripTags(v: string): string {
  return v.replace(/<[^>]*>/g, "").trim();
}

async function build(): Promise<Map<string, LinkTarget>> {
  const next = new Map<string, LinkTarget>();

  for (const locale of LOCALES) {
    const seg = SOLUTIONS_SEGMENT[locale];
    const fseg = flagshipsSegment(locale);
    const [solutions, platforms, categories] = await Promise.all([
      loadSolutions(locale),
      loadPlatforms(locale),
      loadCategories(locale),
    ]);

    for (const s of solutions) {
      if (!s.cmsRef) continue;
      next.set(key(s.cmsRef.collection, s.cmsRef.slug), {
        url: withLocale(locale, `/${seg}/${s.slug}`),
        title: stripTags(s.name),
      });
    }

    for (const p of platforms) {
      if (!p.cmsRef) continue;
      next.set(key(p.cmsRef.collection, p.cmsRef.slug), {
        url: withLocale(locale, `/${fseg}/${p.logoKey}`),
        title: stripTags(p.name),
      });
    }

    for (const c of categories) {
      const posts = await loadCategoryPosts(locale, c.slug);
      for (const post of posts as StoredDoc[]) {
        const slug = typeof post.slug === "string" ? post.slug : "";
        if (!slug) continue;
        const data = (post.data ?? {}) as Record<string, unknown>;
        const title = typeof data.title === "string" ? stripTags(data.title) : slug;
        next.set(key("posts", slug), {
          url: withLocale(locale, `/${c.slug}/${slug}`),
          title,
        });
      }
    }
  }

  return next;
}

/**
 * Kick off a refresh if the table has gone stale. Deliberately fire-and-forget:
 * rendering must never wait on this, and a render that lands mid-refresh uses
 * the previous table — correct, just a minute behind on a renamed title.
 */
export function ensureFreshLinkLookup(): void {
  if (building || Date.now() - builtAt < TTL_MS) return;
  building = true;
  void refreshLinkLookup().finally(() => {
    building = false;
  });
}

export async function refreshLinkLookup(): Promise<number> {
  try {
    table = await build();
    builtAt = Date.now();
  } catch {
    // Keep the previous table. A failed rebuild must not empty the site's links.
  }
  return table.size;
}
