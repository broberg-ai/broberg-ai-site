// Gate A.1 (F162.7/.10) — every visible line a visitor reads must be inline-editable.
// Discovers pages from the site's OWN sitemap.xml (no hand-list) and scans them all.
import { spawnSync } from "node:child_process";

const SITEMAP = process.argv[2] || process.env.COVERAGE_SITEMAP || "https://broberg.ai/sitemap.xml";

const res = spawnSync("cms", ["check-editable", "--sitemap", SITEMAP], { stdio: "inherit" });
process.exit(res.status ?? 1);
