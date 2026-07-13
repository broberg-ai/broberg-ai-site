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

// NOTE: the ~17 DA blog posts live at /{category}/{slug} (e.g.
// /indsigter/bevis-ikke-loefter) and ARE already fully editable — verified 0
// visible-text gaps (1399 fields). They are NOT scanned here YET: adding them
// surfaces 27 pre-existing schema-level gaps (custom case-blocks + category
// metadata + excerpt) that deserve a proper wire/classify pass, not a rushed
// baseline dump. Tracked as a follow-up story (F162.9). The bare top-level slugs
// a prior list used (/inline-redigering, /bevis-ikke-loefter, …) were WRONG —
// they resolve to a generic placeholder; the real article is the URL above.

export function publicRoutes() {
  return PUBLIC_ROUTES;
}
