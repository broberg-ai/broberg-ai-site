// Gate A.2 (F162/.10 / F086 no-new-gaps) — every rendered CMS field must be
// inline-editable, measured against schema + baseline. Discovers pages from the
// site's OWN sitemap.xml (no hand-list). Fails only on a NEW field outside
// .cms-coverage-baseline and the IGNORE list (structural / non-prose fields
// edited in cms-admin, not inline).
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITEMAP = process.argv[2] || process.env.COVERAGE_SITEMAP || "https://broberg.ai/sitemap.xml";

const IGNORE = [
  "metaTitle", "metaDescription", "ogTitle", "ogDescription",
  "siteName", "siteTitle", "siteDescription",
  "navCtaUrl", "ctaPrimaryUrl", "ctaSecondaryUrl",
  "contactEmail", "order", "readTime", "url", "label",
  "accent", // category accent = a color token, not editable prose
].join(",");

const res = spawnSync(
  "cms",
  [
    "coverage",
    "--schema", join(ROOT, ".cms-coverage-schema.json"),
    "--sitemap", SITEMAP,
    "--ignore", IGNORE,
    "--baseline", join(ROOT, ".cms-coverage-baseline"),
  ],
  { stdio: "inherit" },
);
process.exit(res.status ?? 1);
