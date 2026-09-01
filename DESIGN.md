---
name: broberg-ai-site
description: >-
  GENERATED SEED — extracted from src/styles/brand.css. Correct it; do not assume it is right.
colors:
  blue: "#00b2ff"
  blue-light: "#40c8ff"
  blue-glow: "rgba(0, 178, 255, 0.13)"
  blue-glow2: "rgba(0, 178, 255, 0.06)"
  dark: "#23282f"
  dark2: "#1c2027"
  card: "rgba(255, 255, 255, 0.04)"
  card-border: "rgba(255, 255, 255, 0.08)"
  light: "#f0f4f8"
  muted: "rgba(240, 244, 248, 0.5)"
  orange: "#f3522c"
  orange-text: "#ff6a45"
  orange-soft: "rgba(243, 82, 44, 0.12)"
---
## This file was generated, and it is a starting point

Every value above was read out of `src/styles/brand.css` — 13 colour(s). Nothing here was chosen; it is a description of what this repo already looks like, written
down so there is something to correct.

**What to do with it.** Read the palette and delete what is not really part of it — a generated
list cannot tell a brand colour from a one-off. Then write the parts a stylesheet cannot know:
what the page shell is, which header a new route uses, whether buttons are round or square, and
which of these colours means "action" as opposed to "we happened to use it once".

**What this seed does NOT contain.** The extractor is a heuristic — which declarations
in a stylesheet are *tokens* is a judgement, not a fact — so it reports its own misses rather
than letting them read as absences. These are still in your stylesheet and still work:

- **2** · value is neither a colour nor a length this extractor can express (--fd, --fb)

A seed silent about this would look complete, and the next reader would conclude the project
has no shadows rather than that nobody extracted them.

## Why this file matters

`DESIGN.md` is the source a cardmem session is handed at start-up, so a rule written here reaches
the next agent without anyone remembering to open a file. It is also what the drift lint measures
against: a raw colour used where a token above exists becomes a finding rather than a
conversation with the owner.

## Overview

_Replace this with what the product actually looks like, in a sentence or two._

## Anti-patterns

*Applies to every change — these are not per-surface preferences. Each one below has been
shipped, reported by the owner, and fixed; they are here because they came back.*

### The wiggle — the page must NEVER scroll sideways at phone width

Christian's name for it, and he has reported it four times. **Wide content — a table, a
code block, a diagram, a revealed secret — scrolls inside its own `overflow-x: auto`
container. The page body does not move.**

Two traps make it hard to see from a desk:

- **`documentElement.scrollWidth` cannot see it.** Measured on Settings → Secrets: it
  read 393 on a 393px viewport while the content was 588px wide. Assert on element
  right-edges versus `innerWidth`, or on `max(documentElement.scrollWidth, body.scrollWidth)`.
- **A `width: 100%` table cannot shrink below its content's min-width.** One
  `white-space: nowrap` cell therefore sets the width of the whole page.

**What is mechanically checked, and what is not — the half worth knowing.** The Lens DOM
critic raises a `wiggle` finding (severity high, one per run, naming the widest offender)
on any capture at ≤820px **that passes `critic: "dom"`**. A high finding folds the F095
gate to fail, and the auto-review skill passes the critic on every verify — so a card
going THROUGH the gate is covered. **A `lens_capture` you write by hand is not**, because
the daemon's critic default is `off`. Content inside a deliberate horizontal scroller is
not flagged.

So: verify every new surface with a Lens run at phone width **and pass the critic**. Then
the gate tells you instead of the owner's thumb.

### A button label never wraps to a second line

Add `white-space: nowrap`. If it still does not fit, shorten the label — never let it
break. The portal's "Afslut preview" wrapping to two lines is the reported case; it reads
as broken, not as tight.

### No native dialog, and no native form control

`window.alert` / `confirm` / `prompt`, `<select>`, `<input type="date">`, `type="color"`,
`type="range"`. They ignore every token on this page, break dark mode, and render in the
OS's style rather than the product's. Reuse `components/ui/` or build it there. The one
exception is `beforeunload`, which the browser owns.
