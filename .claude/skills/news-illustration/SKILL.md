---
name: news-illustration
description: Design and wire up a bespoke SVG illustration for a specific broberg.ai news/insights article, in the same visual family as the 12 flagship illustrations in Illustrations.tsx. Use when Christian asks for "a new animation like the flagships" for a specific article (not the default — most articles just reuse the 12 flagship illustrations automatically as staffage via pickNewsIllustration()). Invoke as /news-illustration <post-slug> "<one-line concept>".
argument-hint: "<post-slug> \"<one-line concept for what the illustration should nail>\""
---

# news-illustration — bespoke per-article SVG illustration

Every news/insights post already gets a decorative illustration for free —
`pickNewsIllustration(slug)` in `src/components/Illustrations.tsx` deterministically
hash-picks one of the 12 flagship illustrations as "staffage". **This skill is for
the upgrade**: a bespoke illustration made *for this specific article's idea*,
which then automatically wins over the staffage pick (see "How the fallback works"
below) — no other file needs to change.

Reach for this when Christian names a specific article and wants a real, bespoke
illustration for it — not a batch job, not "all of them at once". One article at
a time, deliberately designed.

## 1. Read the visual language first — don't invent a new one

Open `src/components/Illustrations.tsx` top to bottom before drawing anything.
The file's own header comment is the spec:

> dark canvas, blue `var(--blue)` line work, orange `#F3522C` accent, subtle
> CSS/SMIL motion, shared viewBox 0 0 360 280

Concretely, from the 12 existing entries:

- **Canvas**: every illustration is `wrap(<g>...</g>)` — the `wrap()` helper sets
  `viewBox="0 0 360 280"` and `class="svg-wrap"`. Never touch `wrap()`, just call it.
- **Palette**: `var(--blue)` (primary line/fill), `var(--blue-light)` (accent glow),
  `#F3522C` (orange, sparing — one accent element, not the whole piece),
  occasional `#2ecc71`/`#34d399` green for a "live/done" signal, `var(--muted)`/
  `var(--light)` for text. Never a color outside this set.
- **Strokes over fills**: mostly `stroke`-based line work (`stroke-width` 1.4–2.4),
  filled shapes are low-opacity tints (`color-mix(in srgb,var(--blue) 10-18%,transparent)`
  or `rgba(243,82,44,.14-.16)` for the orange accent), not solid blocks.
  `color-mix()` is used deliberately — it means the shade adapts to light/dark theme
  automatically. Use it instead of a hardcoded rgba wherever you're tinting `var(--blue)`.
- **One real idea per illustration, not decoration.** Each of the 12 *nails a specific
  concept* (read the one-line comment above each const in the file): cardmem's
  illustration is the literal Idé→Plan→Board→Build→QA→Live loop with labelled
  stage nodes; upmetrics' is a heartbeat/watchdog motif. This is the bar — the
  illustration should make someone say "oh, that's exactly what the article is
  about", not "that's a nice abstract blob".
- **Motion is subtle and CSS-driven**, applied via existing utility classes
  already defined in `brand.css`, not new bespoke animations per illustration:
  - `.illu-flow` — a flowing dashed line (`stroke-dasharray` marching ants)
  - `.illu-glow` — a soft pulsing glow on a shape
  - `.illu-snap` — a subtle settle/snap-in motion
  - `.node` — a pulsing dot (see cardmem's stage nodes, `style="animation-delay:${i*0.5}s"` staggered)
  - SMIL `<animateTransform>` is used directly in a couple of illustrations for
    rotation/translation (e.g. docs' spinning "auto" refresh arc, docs' scanning
    sweep bar) — reach for this only when a CSS class doesn't already cover it.
  - **1–2 moving elements max.** These read as "quietly alive", not busy.
- **`prefers-reduced-motion` is handled globally already** (see `reducedMotion()`
  in `client/enhance.ts`, which pauses SMIL) — you don't need to add anything
  for that, just don't rely on motion to convey information that's otherwise lost.

## 2. Design the concept

Before writing SVG, write one sentence: *what is the ONE idea from this article
that a reader would recognize instantly if they saw it drawn?* Reread the
article (`content` field of the post — fetch via
`GET /api/cms/posts/<slug>?site=broberg-ai` if you don't already have it in
context) if you weren't given a concept, or if the given concept feels generic.

Bad: "AI and writing" (too abstract, could be any article).
Good (matches the existing bar): "an author's pen turning into an editor's red
pen mid-stroke" (for "Fra forfatter til redaktør"), or "a magnifying glass over
a checkmark that only lights up once something is actually clicked, not before"
(for "Bevis, ikke løfter").

## 3. Build it

In `src/components/Illustrations.tsx`:

1. Add a new `const <camelCaseName> = wrap(<g>...</g>);` near the other 12,
   with a one-line comment above it describing what it nails (matches the
   existing convention exactly).
2. Add it to `REGISTRY` **keyed by the post's own slug** (not a made-up name) —
   e.g. `"bevis-ikke-loefter": bevisIkkeLoefter,`. This is the key that makes
   the fallback logic below pick it up automatically.
3. Do NOT touch `FLAGSHIP_STAFFAGE_KEYS` — that list is deliberately fixed to
   the original 12 so a bespoke per-article illustration never gets hash-picked
   as filler for some unrelated post.

### How the fallback works (already wired, nothing else to change)

`pickNewsIllustration(slug)` checks `slug.toLowerCase() in REGISTRY` first — if
your new bespoke entry's key matches the post's slug, it wins everywhere that
already calls `pickNewsIllustration()`: the homepage Tanker/Insights section,
the `/tak` "did you catch this news" strip, the category listing page, the tag
page, AND the post's own detail-page header (`plat-illu` next to the title,
same layout as the flagship detail pages). One registry entry, every surface
picks it up.

## 4. Verify + ship

```bash
cd /Users/cb/Apps/broberg/broberg-ai-site
bun run typecheck
bun run build
```

Then the standard commit → push → `flyctl deploy --remote-only --depot=false -a broberg-ai`
→ Lens-verify (webkit/mobile) both the thumbnail card AND the post detail
page header render the new illustration, not the old staffage pick.
