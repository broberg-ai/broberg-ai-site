# F005 — En redigeret overskrift viste sine HTML-tags som tekst

**Rapporteret:** Christian, 31. august 2026, med skærmbillede fra nyhedslisten.
**Status:** rettet og udrullet samme dag.

## Hvad han så

```
Seletøjet, <em>ikke agenten</em>
```

Overskriften på nyhedslisten viste sine egne HTML-tags som bogstavelig tekst,
lige efter at artiklens overskrift var rettet inline på det live site.

## Hvorfor det skete

`posts.title` er ikke et almindeligt tekstfelt mere. Artiklens `<h1>` bærer
`data-cms-html`, altså er titlen et **rich** inline-redigerbart felt — og i det
øjeblik nogen retter en overskrift ude på sitet, gemmes den som HTML.

Derfor har hver flade præcis to lovlige måder at vise en titel på:

| Måde | Bruges hvor |
|---|---|
| `titleToHtml(...)` via `dangerouslySetInnerHTML` | artiklen, hvor kursiven SKAL ses |
| `stripHtml(...)` | kortlister, faneblads- og delingstitler |

Den tredje mulighed — at binde titlen rå ind i JSX — ser rigtig ud, typechecker,
og viser taggene som tekst til læseren.

**Det var ikke ét sted, men tre.** Christian så det ene; de to andre var latente
og ventede blot på at en redigeret titel blev trukket frem:

| Flade | Kilde | Tilstand før |
|---|---|---|
| `/nyheder`, `/en/news` | `loadAllNews` | rå — det han så |
| forsidens tre kort | `loadRandomNews` | rå — latent, kortene er tilfældige |
| tak-sidens nyhedskort | `loadLatestNewsPerCategory` | rå — latent |
| artiklen | rå dokument | korrekt (`titleToHtml`) |
| kategorisiden | rå dokument | korrekt (`stripHtml`) |

### Den strukturelle årsag, ikke bare den enkelte linje

`stripHtml` lå som en **privat funktion inde i `routes.tsx`**. `sections.tsx`
kunne ikke nå den. Forsidekortet kunne altså ikke gøre det rigtige uden først at
flytte hjælperen — så den manglende rettelse dér var ikke sjusk i den ene linje,
den var en konsekvens af hvor funktionen boede. Derfor flytter rettelsen
hjælperen frem for at kopiere den: en kopi nummer to ville have gjort præcis
samme fejl mulig igen, ét sted længere væk.

## Rettelsen

1. `stripHtml` flyttet til `src/content/richtext.ts` og eksporteret — **én kilde**.
   `routes.tsx` importerer den nu i stedet for at definere sin egen.
2. `stripHtml(...)` lagt på alle tre rå kaldsteder: nyhedslisten, forsidens kort,
   tak-sidens kort.
3. Artikelsiden er urørt — den skal blive ved med at vise kursiven.

## Forseglingen

`src/title-rendering.test.ts` scanner kilden (ikke det renderede) og kræver at
enhver titel i en JSX-tekstposition går gennem `stripHtml` eller `titleToHtml`.
Den læser kilden netop for at kunne fange **fremtidige** flader: en ny kortliste
skrevet om et halvt år bliver fanget uden at nogen husker at skrive en prøve for
netop den.

Tre kontroller, fordi en prøve der ikke kan gå rød er værdiløs:

- **Hovedprøven** — ingen rå post-titel i `routes.tsx`, `sections.tsx`,
  `FlagshipSlides.tsx`, `SolutionPage.tsx`.
- **Undtagelseslisten må ikke rådne** — `IKKE_POST_TITLER` rummer de titler der er
  almindelige `cmsAttrs`-felter (editoren gemmer dem som ren tekst, så de kan
  aldrig indeholde markup) eller hardkodede. Findes en undtagelse ikke længere i
  kilden, fejler prøven — ellers kunne en forældet undtagelse tavst dække over en
  ny fejl på samme udtryksnavn.
- **Negativ kontrol** — prøven skal kunne SE en rå titel. Uden den ville
  hovedprøven bestå selv hvis mønsteret aldrig matchede noget som helst.

**Mutationsbevist:** `stripHtml` fjernet fra forsidekortet → prøven gik rød og
navngav `components/sections.tsx:292 {p.title}`. Filen gendannet fra en kopi og
verificeret med checksum (ikke `git checkout`, som ville have hentet fra
indekset).

## Non-goals

- **Kategorisiden strippes fortsat med vilje.** Det er husets valg, skrevet ind i
  koden længe før denne fejl: kortlister viser ren tekst. Fremhævningen lever på
  artiklen.
- **En uoverensstemmelse er BEMÆRKET, ikke rettet:** forsidens kort markerer
  titlen med `cmsAttrs` (almindeligt felt) mens artiklen bruger `cmsHtmlAttrs`
  (rich). Retter man overskriften fra forsidekortet, gemmes den derfor som ren
  tekst, og en tidligere kursivering går tabt. Det er en selvstændig beslutning om
  hvorfra en overskrift må redigeres, og den er Christians — ikke noget der skal
  afgøres inde i en fejlrettelse.

## Historik

Samme familie som cms' egne fund i `@broberg/cms-inline-edit` (0.4.21 forløst
`<li>`, 0.4.23 top-niveau inline-markup): **en redigerbar tekst der skifter fra
ren tekst til markup, og en aftager der ikke fik besked.** Den fejl opdages kun
EFTER at nogen har redigeret, hvilket er præcis derfor den ikke bliver fanget af
at kigge på en frisk installation.
