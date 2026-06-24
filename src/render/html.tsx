/* SSR document shell. Renders the full page to a string (Hono serves it), so the
   markup is crawlable for SEO — no client-only fetch. The enhance bundle + CSS
   are referenced via the Vite manifest in production; in dev they come from the
   Vite dev server / source paths. */
import { renderToString } from "preact-render-to-string";
import type { ComponentChildren } from "preact";
import type { Locale } from "@/config.ts";

export interface Assets {
  css: string;
  js: string;
}

export interface PageMeta {
  title: string;
  description: string;
  locale: Locale;
  canonical?: string;
}

export function renderPage(children: ComponentChildren, meta: PageMeta, assets: Assets): string {
  const body = renderToString(
    <html lang={meta.locale}>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:type" content="website" />
        {meta.canonical && <link rel="canonical" href={meta.canonical} />}
        <link rel="stylesheet" href={assets.css} />
      </head>
      <body>
        {children}
        <script type="module" src={assets.js} />
      </body>
    </html>,
  );
  return `<!doctype html>${body}`;
}
