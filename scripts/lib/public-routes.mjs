// Single source of broberg's public routes — imported by BOTH Gate A.1
// (scripts/gate-editable.mjs → `cms check-editable`) and Gate A.2
// (scripts/gate-coverage.mjs → `cms coverage`). Never duplicate the list in a
// package.json --pages arg again. broberg is Hono/Preact (programmatic routes),
// so this is a curated list — not a filesystem walk (cf. sanne's Next App Router
// derivation in her public-routes.mjs).

/** Real, content-bearing public pages — scanned by both gates. A.1 requires 0
 *  visible-text gaps here; A.2 requires no NEW schema-coverage gaps. */
export const PUBLIC_ROUTES = [
  "/",
  "/losninger",
  "/losninger/ai-integration",
  "/losninger/websites",
  "/losninger/webshops",
  "/losninger/platforme",
  "/universet",
  "/flagskibe",
];

/** Planned pages whose CMS content was never written — they resolve to the
 *  generic "content coming" placeholder (routes.tsx `renderGenericPage`) at
 *  HTTP 200, so every visible line on them is hardcoded + non-editable. Parked
 *  here (NOT scanned) until built, and tracked as a content to-do on the board
 *  (cardmem F162.8 finding). To retire one: write its CMS content, verify it
 *  renders real editable fields, then MOVE the slug up to PUBLIC_ROUTES. */
export const PENDING_CONTENT = [
  "/inline-redigering",
  "/own-your-own-data",
  "/sanne-andersen",
  "/tre-arkitekturer-agent-hukommelse",
  "/x-rt-platform",
  "/fysio-dk-sport",
  "/fysio-dk-aalborg",
  "/chat-med-dit-website",
  "/sft-vs-prompt-rag-trail",
  "/bevis-ikke-loefter",
  "/design-i-højere-luftlag",
  "/fra-forfatter-til-redaktoer",
];

export function publicRoutes() {
  return PUBLIC_ROUTES;
}
