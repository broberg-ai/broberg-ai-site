# F007 — Aidan: besøgs-AI på broberg.ai

**Status:** bygget og udrullet 4/9-2026 (commit e32388e i broberg-ai-site) — kortet er lagt samtidig med leverancen, fordi promote-vejen fra den godkendte mockup var brudt (en mockup SK AL hænge på et kort). Ordren var Christians egen, direkte, i kørende session — F180.6-undtagelsen.

## Motivation

Christian 4/9: «så snart man scroller på forsiden eller andre sider man er landet på så dukker Aidan op bottom-right og vinker — klikkes den åbner dens chat interface … lav en mockup på reveal og chat interface først.» Mockup 01a06cbf blev godkendt samme dag.

## Scope

- **Reveal:** FAB skjult indtil første scroll (HoW-pitchens .asst-fab-mønster), figuren i blå ring, vinke-klip én gang, boble «Hej — jeg er Aidan». Tema-bagte klip (g2-*-mp4, allerede i drift) i rund maske, kanonisk SVG som poster; prefers-reduced-motion → stillbillede.
- **Chat:** panel per mockup (header m. figur/online-prik/luk, hilsen, chips, input). SSE fra sitets egen rute /api/aidan/chat via @broberg/ai-sdk 0.38, tier «smart» (Mistral Large, EU — besøgende kan skrive personoplysninger). Samtale i sessionStorage. Sikker rendering: alt escapes, kun afsnit + markdown-links (relative/https).
- **Primeren, tre lag:** (1) kontrakten — aidan-agent-spec §5 i HJEMME-form + de fire vaner; (2) selvforståelsen — backstoryen vendoreret fra supers Assets (src/data/, proveniens-header, kanonisk hjem er supers Assets); (3) levende viden — sitets søgeindeks på svartidspunktet (backstoryens egen advarsel: markedsføringstallene deri er ikke fakta).
- **Tekster i CMS:** 7 aidan*-felter i begge sprogs globals, skrevet + læst tilbage med streng lighed + fundet af CMS-søgningen. Felterne bærer data-cms-attrs (inline-edit).
- **Ship-dark:** uden MISTRAL_API_KEY → rute 503 og widget renderes ikke (bevist på rigtig sideindlæsning). Nøglen sat på Fly-appen 4/9.
- **Rate-limit** pr. IP-hash (8/min) — offentligt LLM-endpoint.

## Non-goals (dette kort)

- **Trail-hjernen** (spec §3): næste skridt, Christians egen ordre — «dernæst skal vi se på at få koblet en eller flere trails på». Når broberg.ai's Trail-KB kobles på, afløser den søgeindekset som lag 3. Eget story-kort når det arbejde starter.
- Transparente vinke-klip (webm/HEVC fra supers Assets) som opgradering af de tema-bagte — kan gøres senere, ændrer ikke adfærd.
- Værktøjer/kort i svarene (à la Eirs treatment-cards) — v2.

## Reuse

Discovery-tjek: @broberg/ai-sdk (chatStream, EU-tiers, promptCache 0.31+) — genbrugt som eneste LLM-vej. Husets chat-mønster (Eir/cms/trail: egen server-rute + SSE) genbrugt; @broberg/cms-chat-client var allerede dependency (admin-chatten) men besøgs-chatten behøvede kun mønsteret, ikke pakken. Ingen rå provider-SDK.

## Verifikation (udført)

- aidan.test.ts: 7 tests — ship-dark, SSE-form, tom/forkert historik, rate-limit (ramt + nabo-IP fri), primer-lagene. Mutations-bevist: ship-dark-vagt, rate-limit og backstory-lag hver især røde når de fjernes.
- Lens: fuld E2E med ÆGTE streamet modelsvar i karakter; 393px uden sidelæns rulning (målt, projektbeslutningen); webkit-run; luk/genåbn.
- Gates: typecheck 0 fejl, 27 tests, tekst-gate, testid-gate, vite build — alle grønne.
