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
  /** Equivalent URL of this exact page in the other locale, for the nav DA/EN
      switch. Falls back to that locale's homepage when omitted. */
  altHref?: string;
}

export function renderPage(children: ComponentChildren, meta: PageMeta, assets: Assets): string {
  const body = renderToString(
    <html lang={meta.locale}>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {/* Theme before first paint — sets [data-theme] on <html> from the saved
            choice or prefers-color-scheme, so light mode never flashes dark (FOUC). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';document.documentElement.dataset.theme=t;}catch(e){}})()",
          }}
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="theme-color" content="#1c2027" />
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://broberg.ai/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://broberg.ai/og-image.png" />
        {meta.canonical && <link rel="canonical" href={meta.canonical} />}
        {meta.altHref && <link rel="alternate" hrefLang={meta.locale === "en" ? "da" : "en"} href={meta.altHref} />}
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
