// Gate A.2 (F162 / F086 no-new-gaps) — every rendered CMS field must be
// inline-editable, measured against schema + baseline. Wraps `cms coverage`
// (@webhouse/cms-cli), fed by the SAME single-source route list as A.1.
// POST-deploy. Fails only on a NEW field outside .cms-coverage-baseline and the
// IGNORE list (structural / non-prose fields edited in cms-admin, not inline).
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { publicRoutes } from "./lib/public-routes.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const URL = process.argv[2] || process.env.COVERAGE_URL || "https://broberg.ai";

const IGNORE = [
  "metaTitle", "metaDescription", "ogTitle", "ogDescription",
  "siteName", "siteTitle", "siteDescription",
  "navCtaUrl", "ctaPrimaryUrl", "ctaSecondaryUrl",
  "contactEmail", "order", "readTime", "url", "label",
].join(",");

const res = spawnSync(
  "cms",
  [
    "coverage",
    "--schema", join(ROOT, ".cms-coverage-schema.json"),
    "--url", URL,
    "--pages", publicRoutes().join(","),
    "--ignore", IGNORE,
    "--baseline", join(ROOT, ".cms-coverage-baseline"),
  ],
  { stdio: "inherit" },
);
process.exit(res.status ?? 1);
