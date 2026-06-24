# F001 — broberg.ai website (universe-as-proof landing)

> **Epic.** Build the public website for **broberg.ai** — the home of Christian
> Broberg's AI-native universe. The site's core argument: *broberg.ai is not an
> agency; it is a technological amplifier* that ships cheap, fast, architecturally
> modern AI-native platforms — and the **proof is the universe itself**: a fleet
> of AI agents that build, review, remember and ship real customer products.

## Motivation

broberg.ai had no website — just an empty scaffold (see the earlier Branch-C
draft `docs/PLAN.md`). Christian dispatched this epic (Push→Plan&Build from an
inbox idea) to build the real thing. The positioning + visual language already
exist, proven, in his partner pitch *"broberg.ai × syttensyvogtres — AI som
Forstærker"* (Pitch Vault `PzRmq5iSh-GYfqpSIfuTf`): dark theme, electric-blue
`#00b2ff`, orange `.ai` accent, Cormorant Garamond + DM Sans, the line **"Ikke et
bureau. En teknologisk forstærker."** This site reuses that language almost
verbatim — minus the syttensyvogtres-specific partner framing.

The unique content engine: the website is **written by the universe it
describes**. A `broadcast_all` to the live fleet had every session author its own
branding-ready blurb (what it is, its superpower, its layer). 13+ sessions replied
(buddy, brain, cms, trail, ai-sdk, upmetrics, components, cronjobs, pitch-vault,
contract-manager + customer sites xrt81, FD Sport, sanneandersen). Discovery
(`discovery.broberg.ai/api/components`) supplies the live 50-component inventory.

## Mission & vision (the site's spine)

> Levere **billige, hurtige og arkitektonisk moderne AI-native** digitale
> løsninger og platforme. Ikke et bureau — en **teknologisk forstærker** for
> dem der bygger.

Proof points (from the pitch): 30+ år i digital platformsudvikling · 1.000+
websites & platforme leveret · 64 AI-værktøjer i CMS-platformen · 3 AI-native
platforme i produktion · klienter på 5 kontinenter (FIA, Ole Lynggaard, Lundbeck,
Grundfos, COWI, Cheminova/FMC, 40+ kommuner).

## The broberg.ai universe (content model)

Three concentric tiers — the site's central diagram:

- **Kernen / infra & support-tech** (rygraden): cardmem (SDLC PM), buddy (fleet
  nervesystem), brain (syntese-hub), trail (delt hukommelse/RAG), ai-sdk (LLM
  gateway), upmetrics (observability), components + Discovery (genbrug), cronjobs
  (scheduling), pitch-vault, contract-manager, @webhouse/cms (AI-native CMS).
- **Byggeklodser** (50 `@broberg/*` komponenter, L0–L4 + SDK'er — live fra
  Discovery): theme, mail, media, image-transform, apikey, lens, webpush, seti,
  fleet-client/contracts, ai-sdk, db-sdk, upmetrics-sdk …
- **Beviset / kunde-sites**: xrt81 (klubplatform), FD Sport (skade-app, App
  Store + Google Play), sanneandersen.dk (klinik + webshop + Qi Gong), fysiodk —
  hver "bygget lynhurtigt med broberg.ai-komponenter + cardmem-SDLC".

## Scope

**In:**
1. Harvest + curate fleet branding content (done via `broadcast_all`).
2. A markdown **content plan for ALL pages** (`docs/website-content-plan.md`).
3. A HiFi **design mockup in cardmem** (`cardmem_save_mockup`) — single-page
   landing in the pitch's brand language, with **original SVG illustrations**
   (logo, universe/axis diagram, layer icons, amplifier motif).
4. Brand system + original SVG illustration set.
5. Build the real site — **Stack A** (Next.js 16 / React 19 / TS / Tailwind v4 /
   shadcn), reusing `@broberg/theme`; data-testid on every interactive element.
6. Cases/testimonials section with real assets (Lens screenshots from
   xrt81/FD Sport/sanne; personal client quotes only with consent).
7. Deploy → Fly **arn**, domain broberg.ai, SEO/OG, Lens visual verification.

**Out / non-goals (v1):**
- Real photography — SVG/illustration only for now (Christian: "billeder senere").
- The syttensyvogtres-specific partner content.
- CMS-backed editing (could later be driven by @webhouse/cms — cms offered).
- EN translation (several sessions offered; queue as a follow-up).

## Architecture

- **Stack A** marketing site — SSR/SEO matters. Next.js 16, Tailwind v4 (CSS-first),
  shadcn/ui (new-york/neutral), Lucide. Reuse `@broberg/theme` design tokens so the
  site dogfoods the fleet's own design system.
- **Content as data**: section copy in typed content modules; the components grid
  can hydrate live from `discovery.broberg.ai/api/components` so the roster never
  drifts from reality (one source, no hardcode — components' suggestion).
- **Deploy** Fly.io region `arn`; domain broberg.ai.
- **Verification**: Lens visual-diff per surface (data-testid anchors) before Done.

## Stories

- **F001.1** — Fleet content harvest + curation *(done this run)*.
- **F001.2** — Content plan for ALL pages *(done this run — `docs/website-content-plan.md`)*.
- **F001.3** — HiFi design mockup in cardmem *(done this run)*.
- **F001.4** — Brand system + original SVG illustration set.
- **F001.5** — Build the Stack A site (scaffold + landing + sections, testids).
- **F001.6** — Cases/testimonials section with real (Lens) assets + consent gating.
- **F001.7** — Deploy to Fly arn + broberg.ai domain + SEO/OG + Lens verification.

F001.4–.7 are gated on Christian approving the mockup direction (the mockup is a
status-tracked proposal) — so they sit in Backlog until sign-off, then flip Ready.

## Acceptance criteria (epic)

- [ ] Fleet branding content harvested from the live sessions + Discovery inventory.
- [ ] `docs/website-content-plan.md` covers every page/section with real copy.
- [ ] A HiFi mockup exists in the cardmem Mockups surface, on-brand, with original
      SVG illustrations, cross-linked to this epic.
- [ ] Story breakdown (F001.1–.7) on the board with AC; build stories gated on
      mockup sign-off.
- [ ] Epic handed to Review with the mockup as evidence for Christian's sign-off.
