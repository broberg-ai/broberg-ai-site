# F014 — Universet-siden: tags i bunden, og findbar i søgningen

**Christian, 8/9 2026:** *«Siden https://broberg.ai/universet skal også have siden
tags i bunden, og den skal kunne findes ved at søge på Agentic orkestration»*

## Målt før noget blev bygget

| | målt 8/9 2026 |
|---|---|
| `/search-index.json` | **44 poster** — alle er `flagship:*` eller `post:*`. **Ingen af dem peger på `/universet`.** |
| `/tags` | **102 tags** — ingen af dem hedder «Agentic orkestration». |
| `/tags/agentic-orkestration` | **404** |

Så begge halvdele af ønsket mangler reelt i dag, og de er ikke to formuleringer
af den samme mangel: siden har ingen tags, OG den findes ikke i søgeindekset.

## Hvorfor `/universet` er faldet ud af begge

`/universet` er en **statisk rute** (`renderUniverset` i `src/routes.tsx`), ikke
et dokument. Den samles af `loadHome()` ud af mange `sections`-dokumenter, og
har derfor ingen ejer-record med et `tags`-felt.

`buildSearchIndex()` bygger udelukkende ud fra `platforms` + `posts`. Det er
ikke en fejl nogen har lavet — det er en grænse ingen har flyttet: hver gang en
side var et dokument, kom den med af sig selv. `/universet` er ikke et dokument,
så den kom aldrig med.

## Den fælde denne opgave nemt går i

**Et tag-chip hvis `/tags/<slug>` giver 404 ser fuldstændig færdigt ud på
siden.** Man ser en pæn række tags i bunden, opgaven ligner løst, og linket er
dødt. Det er husets gennemgående fejlform: den grønne retning er den tavse.

Derfor er «tag-linkene svarer 200» et selvstændigt acceptkriterium, ikke en
detalje under «render tags».

## Scope

### F014.1 — tags i bunden af `/universet`, og linkene virker

- `globals.universetTags` (liste af strenge) bliver hjemmet for tagsene, på
  **begge** sprogdokumenter (`globals` + `en-globals`).
- `renderUniverset()` renderer dem nederst med **præcis den markup flagskibene
  allerede bruger** (`section > .wrap > .post-tags > a.pill.taglink`), så de ser
  ud som tags gør alle andre steder på sitet.
- Hvert chip får `data-testid="universet-tag-<slug>"` (Lens-anker) og
  `cmsAttrs(globalsRef, "universetTags.<i>")` + `data-cms-list-add`, så de kan
  inline-redigeres som flagskibenes tags.
- `loadPostsByTag()` og `buildTagCloud()` får `/universet` som **tredje kilde**,
  så chippene rammer en rigtig tag-side i stedet for 404, og tagget tælles med i
  tag-skyen.

### F014.2 — findbar på «Agentic orkestration»

- `buildSearchIndex()` får en **eksplicit lille liste af statiske flader**;
  i dag kun `/universet` (`/en/universe`).
- Posten bærer `keywords` — feltet der allerede findes til præcis dette
  («ekstra ord man kan findes på, aldrig vist», tilføjet 27/8 da en søgning på
  «Sanne» gav nul). Der ligger tagsene + «agentic orkestration».

## Non-goals

- **Ingen rute-crawler.** Fristelsen er at indeksere alle ruter automatisk. Det
  ville trække `/admin`, `/chat` og omdirigerings-stubbene med ind i ⌘K. En
  kort, eksplicit liste er den rigtige størrelse, indtil der er en tredje
  statisk side der skal med.
- **Ingen tags på andre statiske sider** endnu (`/tak`, `/kontakt`). Samme
  mekanisme kan bruges, men det er ikke det der blev bedt om.
- **Ingen migrering til `@broberg/cmdk`** — se Reuse.

## Reuse

Discovery-tjek kørt 8/9 2026 (`discovery.broberg.ai/api/search`):

| kapabilitet | fund | beslutning |
|---|---|---|
| tag-rendering / tag-sider | `?q=tagging` → **0 træf** | **byg** — ingen delt pakke ejer det; sitets egen `slugifyTag` + `.post-tags`-markup er allerede mønsteret. |
| kommandopalet (⌘K) | `@broberg/cmdk` **0.1.0, shipped** | **genbrug ikke i dette kort — og det er en reel gæld.** Sitet har sin egen `src/client/cmdk.tsx` og har aldrig adopteret pakken. Denne opgave rører kun *hvad der ligger i indekset*, ikke paletten der viser det, så en migrering hører ikke hjemme her. Gælden er noteret, ikke skjult. |
| SEO/meta | `@broberg/seo` **backlog, ikke udgivet** | intet at genbruge. |

## Bevisførelse (kravene her er ikke valgfri)

1. **Skriv** værdierne i CMS'et på begge sprog i **samme tur** som koden.
2. **Læs tilbage fra en frisk GET** og sammenlign med **streng lighed** — ikke
   «indeholder». En 200 er ikke et bevis på at feltet blev gemt.
3. **Negativ kontrol:** en tom `universetTags` må give **ingen** tag-sektion —
   ikke en tom kasse, og ikke en kode-reservetekst der lyver om at CMS'et har
   værdier. En reservetekst i koden ville gøre feltet usynligt for CMS-søgningen
   og uredigerbart i admin.
4. `/tags/<slug>` for **hvert** renderet chip svarer 200.
5. Enhedsprøver på `buildSearchIndex` + tag-kilderne, **mutations-tjekket**:
   fjernes `keywords`, eller fjernes `/universet` som tag-kilde, skal prøven gå rød.
