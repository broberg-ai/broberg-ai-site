# broberg.ai — content-plan for ALLE sider

> Kilder: (1) fleet-`broadcast_all`-høst — 14 sessioner skrev deres egen branding-tekst;
> (2) produktioner-rapporten *Cardmem-produktioner — fuld fleet-rapport (F108)* (rigtige tal);
> (3) partner-pitchen *broberg.ai × syttensyvogtres — AI som Forstærker* (brand + positionering);
> (4) Discovery `discovery.broberg.ai/api/components` (live 50-komponent-inventar).
>
> **Stemme:** selvsikker, konkret, teknisk-troværdig men forretningsklar. Dansk (EN-version er en follow-up — flere sessioner tilbød oversættelse). **Kernepåstand:** *broberg.ai er ikke et bureau — det er en teknologisk forstærker, og beviset er universet selv.*

## Brand-system (fra pitchen — genbrug)
- **Farver:** baggrund mørk `#23282f` / `#1c2027`, electric-blue `#00b2ff` (primær), orange `#F3522C` (kun `.ai`-accent + få highlights), lys tekst `#f0f4f8`, dæmpet `rgba(240,244,248,.5)`.
- **Skrift:** Cormorant Garamond (display/overskrifter, italic-blå for emphasis) + DM Sans (brødtekst).
- **Stil:** glassmorphic cards, blå radial-glow, tags/pills, store stat-tal, rolige fade/slide-transitions. Originale SVG-illustrationer (ingen fotos i v1).

## Site-struktur
Primært **ét langt scrollende landing** (anker-nav) + dybere undersider hvor det giver mening. Sektioner = sider i nav: Forside · Universet · Platforme · Cases · Metoden · Om · Kontakt.

---

## 1. Forside / Hero
- **Eyebrow:** `broberg.ai · Aalborg`
- **H1:** "Ikke et bureau. En **teknologisk forstærker**."
- **Lead:** "Vi bygger billige, hurtige og arkitektonisk moderne **AI-native** digitale løsninger og platforme — og leverer dem i en brøkdel af tiden, fordi vi har bygget hele maskinen der bygger dem."
- **CTA:** primær "Se universet" (→ #universet) · sekundær "Lad os bygge" (→ #kontakt).
- **Proof-bar (RIGTIGE tal fra rapporten):**
  - **30+ år** i digital platformsudvikling
  - **1.000+** websites & platforme leveret
  - **16** AI-native produktioner i flåden
  - **~1.669** leverede arbejdskort (af ~3.871) — målbart flow
  - **64** AI-værktøjer i CMS-platformen · **70+** MCP-værktøjer i cardmem
  - **10** publicerede `@broberg/*` byggeklodser (50 på roadmap)

## 2. Universet (broberg.ai-aksen)
Det centrale differentiator-afsnit + hoved-SVG (koncentrisk "univers"-diagram: infra-kerne → byggeklodser → kunde-sites i kredsløb).
- **H2:** "Et **selv-byggende** AI-univers."
- **Lead:** "broberg.ai er ikke ét produkt — det er en flåde af AI-agenter der planlægger, bygger, reviewer, husker og deployer rigtige kundeprodukter. Tre lag arbejder sammen:"
- **Tier 1 — Kernen (infra & support-tech):**
  - **cardmem** — AI-native projektstyring & SDLC-rygrad: binder planlægning sammen med eksekvering; board, F-nummererede plan-docs, Lens-verifikation, Mockups, Inbox, cross-edge dispatch. *Det lag hele flåden bygger ovenpå.*
  - **buddy** — flådens altid-vågne nervesystem: adversariel kode-reviewer hver tur + intercom + cron-as-a-service + cross-host session-flytning.
  - **brain** — syntese-hub: samler signaler fra alle sessioner til ét klart svar.
  - **trail** — delt anden-hjerne / RAG: viden overlever som søgbare "Neuroner" med confidence + decay.
  - **upmetrics** — observability-rygrad: forvandler fejl-støj til signal; deploy↔fejl-korrelation.
  - **ai-sdk** — provider-agnostisk LLM-gateway: `createAI()` + tier-routing (`fast/smart/cheap/powerful`), cost-tracket, GDPR-gated.
  - **components + Discovery** — fælles inventar; *reuse > re-roll*; ét live opslag over alle pakker.
  - **cronjobs** — pålidelig, self-healing scheduling med per-repo scoped tokens.
  - **@webhouse/cms** — AI-native indholds-motor: én idé → færdigt deployet website.
  - **pitch-vault** — sikkert pitch-hvælv + read-only discovery-API (content-kilde).
  - **contract-manager** — AI-genererede kontrakter → brandede PDF'er + e-signatur.
- **Tier 2 — Byggeklodserne (50 `@broberg/*`, L0–L4 + SDK'er, live fra Discovery):** theme, mail, media, image-transform, apikey, lens, webpush, seti, config, secret-scan + SDK'er (ai-sdk, db-sdk, upmetrics-sdk, fleet-client/contracts, complimenta-sdk). Grid kan hydrere LIVE fra Discovery, så listen aldrig driver fra virkeligheden.
- **Tier 3 — Beviset (kunde-sites):** se Cases.

## 3. Platforme (flagskibene)
Kort-grid, hver med one-liner + "superkraft" + status-badge (shipped/aktiv):
- **cardmem** · AI-native PM & SDLC · 910 kort, ~half leveret
- **@webhouse/cms** · AI-native CMS der gør en idé til et live website uden en udvikler
- **trail (trailmem.com)** · flådens delte hukommelse
- **buddy** · fleet-orkestrator + adversariel reviewer
- **ai-sdk** · LLM-gateway hele flåden kører på
- **upmetrics** · observability ("Turns fleet noise into signal")
- **components / Discovery** · genbrugs-inventaret
> CTA: "Udforsk alle komponenter" → discovery.broberg.ai.

## 4. Cases (bygget lynhurtigt med broberg.ai)
"Built with broberg.ai"-væg med testimonials/builder-stemme:
- **X RT 81** (xrt81.com) · komplet klubplatform (møder, mediearkiv, sangbog, push, regnskab) bygget oven på @broberg/media-transform + cron + ai-sdk + webpush + Upmetrics. 199 kort leveret, Lens-verificeret. *Stack B (Bun/Hono/Preact).*
- **FD Sport** (sport.fdaalborg.dk) · skade-app, ÉN Next.js+Supabase-kodebase som PWA + App Store + Google Play (Capacitor). 95% web / 5% native. Testimonial: *"Fra idé til to app-stores uden et separat native-team — hele forløbet på broberg.ai-stakken og cardmem-SDLC'en."*
- **sanneandersen.dk** · klinik + Stripe-webshop + booking + medlems-login + AI-guide (Eir) + 80-lektioners Qi Gong-rejse. Lens-verificeret 100% hands-off Stripe-checkout. *Builder-stemme — personligt klient-citat kun med Sannes godkendelse (Christian afgør).*
- **fdaa / Fysio DK Aalborg** · klinik-platform; hjemsted for @broberg/complimenta-sdk (40-endpoint OpenAPI-SDK). 12/12 kort leveret.
- **(anonymiseret)** B2B-legetøjs-netbutik, 3 lande, ~2.000 varer — legacy ERP løftet til Stack B. *Under udvikling; kunde fortrolig — IKKE navngivet på offentlig side (vn-lekers forbehold).*
> **Governance:** kun navngivne/citerede klienter med eksplicit samtykke; default = builder-stemme + anonymiseret.

## 5. Metoden (cardmem SDLC — sådan forstærker vi)
- **H2:** "Hvorfor lynhurtigt? Fordi maskinen bygger sig selv."
- Flow-diagram (SVG): **Idé → F-nummereret plan-doc → board (kort) → AI-agent samler op → bygger → Lens visuel-verifikation → Review → Done.**
- 3 søjler: **Reuse > re-roll** (genbrug før gen-opfindelse) · **Plan før kode** (hver feature har en plan-doc) · **Verificeret før Done** (Lens + adversariel review). 
- Proof: "~1.669 leverede kort på tværs af 16 produktioner — samme metode hver gang."

## 6. Om Christian / WebHouse
- "Softwarearkitekt. Digital pioneer. AI-builder." Grundlagde **WebHouse ApS** i Aalborg **1995**. 30+ år, klienter på 5 kontinenter: **FIA, Ole Lynggaard Copenhagen, Lundbeck, Grundfos, COWI, Cheminova/FMC, 40+ kommuner.** I dag: AI-native platforme — et CMS der skriver sit eget indhold, en videnmotor, et orkestrationssystem der styrer 15+ AI-agenter simultant.

## 7. Kontakt / CTA
- **H2:** "Lad os bygge noget der ikke fandtes i går."
- Mail: christian@broberg.ai. CTA-knap. Kort form (navn/mail/besked) — Turnstile-beskyttet (@broberg-komponent) når bygget.

---

## Non-goals (v1) & follow-ups
- Fotos (kun SVG nu). · EN-oversættelse (sessioner tilbød — follow-up). · Live Discovery-hydrering af komponent-grid (kan starte statisk). · Real Lens-screenshots fra xrt81/FD Sport som case-visuals (tilbudt — F001.6). · Personlige klient-citater kræver samtykke.
