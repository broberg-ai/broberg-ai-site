# F003 — Inline-edit: fuld coverage (gold standard)

**Status:** In progress · **Priority:** High · Owner: cms session (driving broberg render changes directly, coordinating with the broberg-ai-site session).

## Why

Click-to-edit inline editing (`@broberg/cms-inline-edit`) is live on broberg.ai, but only a HANDFUL of elements are actually editable on the case pages (`/cases/sanne-andersen`, `/cases/x-rt-platform`). Christian wants EVERY visible CMS-backed field editable, built as a **reusable model / gold standard** for all future sites (Sanne next — bigger: many page types + a webshop + owner/admin-only gating).

The gap is structural, not a forgotten detail: today each editable element must be hand-tagged in the render code with `data-cms-collection` + `data-cms-slug` + `data-cms-field` (+ optional `data-cms-richtext`/`data-cms-html`). That does not scale and always leaves holes.

## Current coverage map (broberg-ai-site, from a full repo scan)

Helpers already exist in `src/components/sections.tsx`: `cmsAttrs` (plain), `cmsHtmlAttrs` (HTML), `cmsRichAttrs` (Markdown). The `CmsRef` `{collection,slug,locale}` plumbing is threaded to all homepage sections AND to the case/blog detail (`postRef`, `routes.tsx:711-721`). The gap is that renderers only CONSUME the ref for a few fields.

### Case page (`renderBlogPost`, routes.tsx:710-792) — the core complaint
- Editable today: H1 `title` (always); `attribution` (if present); body `content` ONLY when it is a single markdown segment.
- **Biggest hole:** `postBody.tsx:62` — the whole prose body drops `data-cms-field` the moment the content has ONE `[block:]` embed (`parts.length>1`), because a multi-segment body cannot be saved back as one `content` write. Any case with an embedded comparison/notice/carousel loses body editing entirely.
- Never editable: category eyebrow (`:739`), post meta (`:741`), tags (`:744-752`), CTA/back-link buttons (`:770-781`).
- Not rendered on the detail page at all: `client`, `excerpt`, `quote` (only on cards).
- Hardcoded (not data): comparison table headers "Før/Efter" (`postBlocks.tsx:32`); carousel image `alt` (`postBlocks.tsx:88-90`).

### Homepage / other
- `Method` section (`sections.tsx:253-276`) emits ZERO `cmsAttrs` — flow steps + 3 method cards fully non-editable.
- `src/render/blockRenderer.tsx` is dead code (12 builtins, zero tags, unimported).
- Footer, landing, index, tag pages: mostly wired; spot gaps.

## The reusable model (gold standard)

1. **Rendering = editable.** Apply the `cmsAttrs` trio wherever a CMS field value is rendered, so tagging is the default, not an afterthought. Longer-term: promote the helper into the `@broberg/cms-inline-edit` package so every site (Sanne) imports one shared primitive instead of re-inventing it.
2. **Multi-segment rich body** needs a save mode that replaces a SLICE of a text field (the edited prose segment) inside the full `content`, preserving the `[block:]` shortcodes — a generic "field-slice replace" capability (package feature). See F003.2.
3. **Coverage is measurable, not vibes.** A **Lens inline-edit coverage report** (requested to be built INTO Lens / the Lens NPM — cardmem/components, intercom 17186) enumerates `[data-cms-field]` present per page vs the site's `webhouse-schema.json` expected fields → lists MISSING fields per page. This is the reusable "did we get everything" proof for broberg AND every future site.
4. **Owner/admin-only gating** (Sanne): the edit token must be minted only for owner/admin — NOT for kursister/kunder who are also logged in. Server-side boundary, not a hidden button. (Sanne story, separate.)

## Toolbar (shipped in the package, batched with this)

Numbered + bullet list buttons added to the `@broberg/cms-inline-edit` rich toolbar (branch `inline-edit-toolbar-lists`, cms repo). The Markdown serializer already round-trips `<ul>`/`<ol>`. Ships together with broberg coverage in one batched package publish + broberg deploy (Christian's choice: batch, not two deploys).

## Stories
- **F003.1** — Case-page + Method full coverage (easy wins: wire every missing simple field). Low-risk pure additions.
- **F003.2** — Multi-segment rich body editable (field-slice save; fixes postBody.tsx:62). Package feature + render. Coordinate with broberg-ai-site session on the shortcode reassembly contract.

## Non-goals (this epic)
- Webshop/product editing (Sanne-specific, later).
- Structural edits (add/remove array items, reorder blocks).
- Redesigning the `[block:]` shortcode content model.

## Rollout
One batched ship when coverage is green: publish new `@broberg/cms-inline-edit` (toolbar lists + any helper move) → bump broberg dep → deploy broberg (needs Christian's GO + bas coordination) → Lens-verify coverage + list buttons live.
