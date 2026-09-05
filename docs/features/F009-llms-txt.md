# F009 — /llms.txt: AI-læsbar sideliste, auto-genereret

## Motivation

Ejerordre 5/9-2026: «Opdater /llms.txt og sørg for at det bliver genereret auto». Målt før: `https://broberg.ai/llms.txt` fandtes ikke — URL'en ramte sitets catch-all og returnerede almindelig HTML. En AI-læser (ChatGPT, Claude, Perplexity m.fl.) der slår sitet op fik altså ingen maskinlæsbar oversigt.

## Løsning

En live-rute `GET /llms.txt` (src/llms.ts + registrering i server.tsx) der renderer llms.txt-formatet:

- `# broberg.ai` + `> {siteDescription}` (CMS'ets globals — tekst bor i CMS)
- Én `##`-sektion pr. gruppe fra `siteIndexGroups(locale)`, begge sprog (EN-grupper mærket «(EN)»)
- `- [Titel](absolut URL)` pr. side

**Én kilde, ingen liste nr. 2.** `siteIndexGroups` i routes.tsx er allerede den ene kilde bag sitemap.xml og den menneskelige Indeks-side; llms.txt læser samme funktion. Præcedens: sanneandersen F054.1, hvor en håndrullet llms-liste viste 47 af 130 sider indtil sitemappet blev kilden.

**Auto-genereret pr. request.** Ruten læser CMS-storen ved hvert kald — en ny artikel, en ny featured-side eller en omdøbt titel optræder af sig selv. Intet build-step, ingen cron, intet der kan glemme at køre.

## Segl

`src/llms.test.ts`: (1) llms.ts importerer og kalder siteIndexGroups, (2) ingen hardkodet sideliste i llms.ts, (3) ruten er registreret i server.tsx.

## Non-goals

- llms-full.txt (side-indhold, ikke kun adresser) — kan tilføjes senere hvis AI-trafik berettiger det.
- Ændringer i sitemap.xml (uændret; deler blot kilde).

## Reuse

Genbruger siteIndexGroups (eksisterende én-kilde-mønster) og loadGlobals. Ingen nye pakker; Discovery-søgning ikke relevant for en 30-linjers renderer på en eksisterende kilde.
