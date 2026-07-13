// /sitemap.xml — the machine-readable list of every page on the site, built from
// the SAME single source as the human site-index (siteIndexGroups), so the two can
// never drift. This is what @webhouse/cms-cli's coverage gates discover pages from
// (`cms coverage --sitemap` / `cms check-editable --sitemap`): the site owns its own
// page list, so a gate can never miss a page or hit a phantom slug.
import { LOCALES } from "@/config.ts";
import { siteIndexGroups } from "@/routes.tsx";

export async function renderSitemapXml(baseUrl: string): Promise<string> {
  const base = baseUrl.replace(/\/$/, "");
  const seen = new Set<string>();
  const locs: string[] = [];

  for (const locale of LOCALES) {
    const groups = await siteIndexGroups(locale);
    for (const grp of groups) {
      for (const link of grp.links) {
        const path = link.href.startsWith("/") ? link.href : `/${link.href}`;
        const url = base + path;
        if (seen.has(url)) continue;
        seen.add(url);
        locs.push(url);
      }
    }
  }

  const body = locs
    .map((u) => `  <url><loc>${encodeURI(u).replace(/&/g, "&amp;")}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
}
