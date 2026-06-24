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
import { loadHome } from "@/content/compose.ts";
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
// selvstændig side om ALLE flagskibene"). Reuses the platforms section for now.
export function renderFlagships(locale: Locale): string {
  const platforms = homeFallback.sections.find((s) => s.kind === "platforms");
  const seg = flagshipsSegment(locale);
  return page(platforms?.kind === "platforms" ? <Platforms data={platforms.data} /> : <></>, {
    title: "Flagskibe — broberg.ai",
    description: "De AI-native platforme bag broberg.ai-universet.",
    locale,
    canonical: `/${seg}`,
  });
}

export function renderFlagshipDetail(locale: Locale, slug: string): string | null {
  const platforms = homeFallback.sections.find((s) => s.kind === "platforms");
  if (platforms?.kind !== "platforms") return null;
  const item = platforms.data.items.find((p) => p.name.toLowerCase() === slug.toLowerCase());
  if (!item) return null;
  return page(
    <section>
      <div class="wrap reveal">
        <div class="sec-head">
          <div class="eyebrow">Flagskib</div>
          <h2>{item.name}</h2>
          <div class="divider" />
          <p class="lead">{item.blurb}</p>
        </div>
      </div>
    </section>,
    { title: `${item.name} — broberg.ai`, description: item.blurb, locale },
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
