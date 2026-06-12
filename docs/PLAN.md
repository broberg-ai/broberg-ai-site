# broberg.ai — PLAN (DRAFT)

> **Status: DRAFT — bootstrapped by the cardmem `adopt` flow (Branch C, 2026-06-12).**
> The repo was imported into cardmem as a bare scaffold — no application code, no
> feature plans, only a placeholder README. There was nothing real to adopt, so
> rather than invent a roadmap this draft captures *what is actually known* plus
> the **open questions** that only Christian can answer. **Review, edit, and
> merge this file**, then a follow-up session cuts it into epics + stories
> (cardmem `adopt` Branch B). Nothing below is committed product scope yet.

---

## Open questions (answer these first — they decide everything downstream)

1. **What is broberg.ai?** A personal/founder brand site for Christian Broberg?
   A landing page for the wider "broberg.ai universe" of projects (Trail,
   Cardmem, Pitch Vault, CPM, the MCP services…)? A product in its own right?
   The README says "the humble beginnings of the broberg.ai website universe" —
   universe of *what*?
2. **Primary audience & job.** Who lands here and what should they do — read
   about Christian, discover the projects, contact/hire, sign up for something?
3. **Stack.** Is this a marketing/SEO site (→ Stack A: Next.js) or a lightweight
   app (→ Stack B: Bun/Hono/Preact)? See "Candidate stack" below — needs a yes/no.
4. **Content source.** Static/hand-authored, or pulled from existing surfaces
   (Pitch Vault API, cardmem boards, project READMEs)?
5. **Scope of v1.** What is the smallest thing worth shipping at broberg.ai?

---

## Purpose (best honest inference — confirm or correct)

`broberg.ai` is the web home for Christian Broberg's "AI universe." Exact intent
is unconfirmed; the placeholder README frames it as a greenfield brand/portfolio
surface for the broberg.ai family of projects. **This line is a guess and is the
single most important thing to correct in review.**

## Current state

- **Greenfield.** Zero application code. The repo holds only the cardmem
  scaffold (`CLAUDE.md`, `.claude/`, hooks, skills), pointer-stub `ROADMAP.md`
  and `FEATURES.md`, and a one-line `README.md`.
- No framework, no `package.json`, no `src/`, no deployment target chosen.

## Candidate stack (proposal — not yet chosen)

For a brand/portfolio/SEO surface, Christian's Stack A is the natural fit and the
working assumption unless overridden:

- **Next.js 16+ / React 19+ / TypeScript**, **Tailwind v4** (CSS-first),
  **shadcn/ui** (new-york / neutral), **Lucide** icons.
- Deploy region **`arn` (Stockholm)** per fleet convention.
- If broberg.ai turns out to be a small interactive app rather than a content
  site, Stack B (Bun / Hono / Preact / Vite) is the alternative.

## Likely surface areas (tentative — to be confirmed in review)

These are *candidate* areas to seed the discussion, **not** committed epics:

- **Home / hero** — who Christian is, the broberg.ai one-liner.
- **Projects / universe** — index of the broberg.ai projects (Trail, Cardmem,
  Pitch Vault, CPM, MCP services…), each linking out.
- **About** — founder background (WebHouse, Senti.Cloud).
- **Contact** — how to reach Christian.

## What's next (honest)

1. Christian answers the open questions above and edits this draft into a real
   `PLAN.md` (purpose, audience, v1 scope, confirmed stack).
2. Merge this branch.
3. A follow-up cardmem session runs **adopt Branch B**: cut the agreed `PLAN.md`
   into epics (`F<n>`) with stories + acceptance criteria, on the board.
4. First epic gets picked up and the actual site scaffold (framework + first
   route) lands.

---

_This draft intentionally contains no `F`-numbered epics. Epics are created only
after the plan is human-reviewed (cardmem `adopt` §8 — "Do not auto-cut the draft
into epics")._
