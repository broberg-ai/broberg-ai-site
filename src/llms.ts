// /llms.txt — the AI-readable page list, built from the SAME single source as
// /sitemap.xml and the human site-index (siteIndexGroups), so the three can
// never drift. Regenerated on every request straight from the CMS store — a
// new post or featured page appears here by itself, no build step, no second
// hand-maintained list (that pattern already failed once on sanneandersen:
// llms.txt listed 47 of 130 pages until the sitemap became the source).
import { LOCALES } from "@/config.ts";
import { siteIndexGroups } from "@/routes.tsx";
import { loadGlobals } from "@/content/compose.ts";

const str = (v: unknown): string => (typeof v === "string" ? v : "");

export async function renderLlmsTxt(baseUrl: string): Promise<string> {
  const base = baseUrl.replace(/\/$/, "");
  const globals = await loadGlobals("da");
  const desc = str((globals?.data as Record<string, unknown> | undefined)?.siteDescription);

  const out: string[] = ["# broberg.ai", ""];
  if (desc) out.push(`> ${desc}`, "");

  for (const locale of LOCALES) {
    const groups = await siteIndexGroups(locale);
    for (const grp of groups) {
      out.push(`## ${grp.title}${locale === "en" ? " (EN)" : ""}`, "");
      for (const link of grp.links) {
        const path = link.href.startsWith("/") ? link.href : `/${link.href}`;
        out.push(`- [${link.label}](${base}${path})`);
      }
      out.push("");
    }
  }
  return out.join("\n");
}
