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
