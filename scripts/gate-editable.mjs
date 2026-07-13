// Gate A.1 (F162.7) — every visible line of text a visitor reads must be
// inline-editable. Wraps `cms check-editable` (@webhouse/cms-cli), fed by the
// single-source route list. POST-deploy: scans the just-deployed live site.
// Closes A.2's union blind spot (a field rendered non-editably on ONE page).
import { spawnSync } from "node:child_process";
import { publicRoutes } from "./lib/public-routes.mjs";

const URL = process.argv[2] || process.env.COVERAGE_URL || "https://broberg.ai";

const res = spawnSync(
  "cms",
  ["check-editable", "--url", URL, "--pages", publicRoutes().join(",")],
  { stdio: "inherit" },
);
process.exit(res.status ?? 1);
