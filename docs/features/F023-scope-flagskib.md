# F023 — scope: flagskib nr. 15

> **Bestilt af Christian 10/9-2026:** «DU skal lave et Flagship på løsningen —
> logo og animeret illustration og flagship page.»
> Kilde: `/Users/cb/Downloads/MEETING-CAPTURE-PLAN.md`. Selve motoren bygges af
> cardmem i repoet `broberg-ai/voice-engine`; **dette kort er ansigtet, ikke
> maskinen.**

## Motivation

broberg.ai's flagskibs-gitter er beviset for at vi bygger vores eget. Et nyt
produkt der er under opbygning skal stå dér FØR det er færdigt — det er sådan de
andre fjorten kom ind, og det er dét der gør «snart» til et løfte frem for en
hemmelighed.

## Navnet — og de to der blev vraget

Navnet er ejerens, og vejen dertil hører med, fordi den forklarer hvad mærket
skal sige.

| forslag | udfald |
|---|---|
| `optak` (mit) | **Vraget.** *«Det lyder som et IKEA møbel.»* Dansk, kort, betød både optagelse og optakt — og lød som en reol. |
| `brief` (min anbefaling af fire engelske) | Ikke valgt. Bar hele kæden, men var mit ord, ikke hans. |
| **`scope`** (hans) | **Valgt**, med hans egen begrundelse: *«periskop og kravspecen».* |

**Dobbeltbetydningen ER designbriefen.** `scope` er både instrumentet der kigger
ind i mødet (peri**skop**) og dokumentet der kommer ud (**scope** of work). Alt
visuelt arbejde på kortet skal bære begge; gør det kun det ene, er navnet spildt.

## Ejerens korrektion — og hvorfor den ændrede teksten, ikke bare navnet

Midtvejs: *«det er jo ikke kun et modul til optagelse af mødet men et starting
point til at få skrevet en automatisk kravspec og plan.»*

Det er ikke en navnepræference, det er en produktdefinition, og den var forkert i
den tekst jeg allerede havde skrevet. Konsekvenser, alle udført:

- Hvert «referat» i CMS-teksten er skiftet til «kravspec».
- Overskriften gik fra «Mødet blev til en **plan**» til «Mødet blev til en
  **kravspec**».
- **En helt ny slide** navngiver forskellen frem for at lade den være underforstået:
  *«Et referat siger hvad der blev sagt. En kravspec siger hvad der skal bygges.»*
- Illustrationens højre halvdel er kravspecen, ikke et referat.

## Scope (kortets eget)

**Med:**

1. `scope`-logo i `src/components/Logos.tsx` — skal bære ved **24 px** i
   flagskibs-gitteret, i lyst OG mørkt tema.
2. Animeret illustration i `src/components/Illustrations.tsx`, registreret i
   `REGISTRY` under nøglen `scope`.
3. CMS-dokumenterne `platforms/scope` (da) + `platforms/en-scope` (en) med
   `order: 15`, `status: "soon"`.
4. Den gamle `platforms/optak` ud af sitet.

**Ikke med (bevidst):**

- Selve mødeoptagelses-motoren. Den er `broberg-ai/voice-engine`, cardmems kort.
- Booking/kontakt fra siden. Det er F021's arbejde.
- Nogen ændring i de øvrige fjorten flagskibe.

## Arkitektur — hvor de fire dele bor

| del | fil | note |
|---|---|---|
| logo | `src/components/Logos.tsx` → `logos.scope` | 128-viewBox, renderes 24 px |
| illustration | `src/components/Illustrations.tsx` → `scope`, i `REGISTRY` | 360×280, `wrap()` |
| bevægelse | `src/styles/brand.css` → `.illu-ind` + `@keyframes illu-ind` | reduced-motion dækkes af den globale `*`-regel |
| tekst | CMS `platforms/scope`, `platforms/en-scope` | **al brugervendt tekst i CMS, ingen i koden** |

Siden selv kræver **ingen** ny rute: `renderPlatform` slår `slug` op i både
`REGISTRY` og CMS. `hasIllustration("scope")` afgør om hovedet får to kolonner —
en manglende registrering giver `one-col` og en side uden tegning, uden at noget
bliver rødt. Det er kortets stilleste fejlform og derfor et acceptkriterium.

## Designbeslutninger, med den måling der afgjorde dem

### Logoet blev tegnet fire gange

Første udgave var optageprik + bølge + tre tekstlinjer. Målt på gitteret ved
24 px blev den **det svageste mærke i rækken**: et lille flag med to streger.
Årsagen var at mærket forsøgte at sige to ting på 24 px.

De fire kandidater blev derefter tegnet op ved siden af hinanden i den størrelse
de skal virke i, i begge temaer:

| | resultat ved 24 px |
|---|---|
| A · tyndt rør + stor linse | forsvandt — for lidt masse |
| **B · tykt rør (21) + stor linse** | **valgt** — læsbar ved 24, holder ved 96 |
| C · sigtekorn | mest læsbar af alle — **men det er et riffelsigte, ikke et periskop**, og ville modsige flagskibets egen tegning |
| D · fyldt silhuet | blev en klump |

C er værd at notere fordi den vandt på det mål jeg målte og alligevel tabte:
læsbarhed alene er ikke briefen, når mærket skal stemme med en tegning ved siden
af.

### Logo og illustration vender samme vej

Begge: **linse mod venstre → rør ned → fod mod højre.** Vender de hver sin vej,
læses de som to forskellige produkter. Det er et acceptkriterium, ikke smag.

### Farvesporet er illustrationens egentlige påstand

Hver taler har sin egen farve, og farven følger med hele vejen: ind gennem
linsen, ned gennem røret, ud i kravspecens afsnit. **Uden det spor viser
tegningen bare «lyd bliver til tekst», som enhver diktafon kan.** Det er dét
produktet gør som en optager ikke gør.

### Linsen pulser ikke

Den havde `illu-glow`, som falder til 45 % opacitet. Et stillbillede af helten
rammer lige så ofte bunden som toppen, og dér stod linsen vasket ud ved siden af
de tre mættede stemmer. Bevægelsen bæres af de stiplede spor og de indgående
prikker; linsen står fast.

## Reuse

Discovery-tjek kørt pr. capability inden planen blev skrevet.

| capability | beslutning | hvorfor |
|---|---|---|
| Brugervendt tekst | **Genbrug** — CMS (`platforms`) | Husets hårde regel: tekst hører hjemme i CMS, aldrig kun i koden. Ingen ny mekanisme. |
| Ikon/illustration | **Byg lokalt** | Mærkerne er ejede aktiver pr. flagskib og bor i repoets egne `Logos.tsx`/`Illustrations.tsx`. Ingen `@broberg/*`-pakke ejer flagskibs-identitet, og en delt pakke for femten bespoke tegninger ville være en abstraktion for abstraktionens skyld. |
| Animation | **Genbrug mønster, ny klasse** | `.illu-flow`/`.illu-glow` findes allerede i `brand.css` og bruges. `.illu-ind` er ny, fordi ingen eksisterende klasse flytter noget langs to akser. Lagt samme sted, så reduced-motion-reglen dækker den uden ekstra ledning. |
| Visuel verifikation | **Genbrug** — Cardmem Lens | Kontraktkrav. Ingen rå Playwright. |
| Mødeoptagelse/transskription | **Ikke her** | `broberg-ai/voice-engine` ejer det. Dette kort må ikke bygge en tomme af den motor. |

## Rollout

1. CMS-dokumenter oprettet + **læst tilbage fra en frisk GET med streng lighed**.
2. `optak` sat til `draft` (ikke slettet — sletning af indhold kræver ejerens ord).
3. Kode + CSS, `tsc` grøn, 410 prøver grønne, fem porte grønne.
4. Lens-billeder **set**, ikke bare `pass`-status: gitteret, kortet, helten.
5. Commit + push. Grøn port ER ordren (F302).

## Åbne punkter til ejeren

- **`platforms/optak` ligger som `draft`.** Den er væk fra sitet, men ikke
  slettet. Ét ord, så ryger den.
- **Fundet undervejs, ikke rettet her:** Lens' kompositions-kritiker melder
  `high` på mobil (390 px) for `.foot-ticker` — båndet stikker ~5000 px ud og
  holdes kun af `overflow-x:hidden`. Det er **sidedækkende og ældre end dette
  kort**, så det hører ikke til her. Værd at rejse som sit eget.
