// Resolve the CSS + JS asset URLs for the document shell.
//   prod: read the Vite manifest (hashed filenames in dist/client).
//   dev:  fixed URLs served on the fly by the server (no Vite process needed).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "@/config.ts";
import type { Assets } from "@/render/html.tsx";

let cached: Assets | null = null;

export function resolveAssets(): Assets {
  if (cached) return cached;

  if (!config.isProd) {
    cached = { css: "/assets/app.css", js: "/assets/enhance.js" };
    return cached;
  }

  try {
    const manifestPath = resolve("dist/client/.vite/manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<
      string,
      { file: string; css?: string[] }
    >;
    const enhance = manifest["src/client/enhance.ts"];
    const styles = manifest["src/styles/app.css"];
    cached = {
      js: "/" + (enhance?.file ?? "assets/enhance.js"),
      css: "/" + (styles?.file ?? enhance?.css?.[0] ?? "assets/styles.css"),
    };
  } catch {
    cached = { css: "/assets/styles.css", js: "/assets/enhance.js" };
  }
  return cached;
}
