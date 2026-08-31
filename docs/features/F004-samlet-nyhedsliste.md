# F004 — En samlet nyhedsliste, i tidsrækkefølge

**Status:** I gang
**Bestilt:** Christian, 31. august 2026
**Repo:** broberg-ai/broberg-ai-site

---

## Bestillingen

> «Jeg mangler lidt en samlet liste over alle nyheder vi poster og at listen viser
> dem i tidsmæssig rækkefølge … på forsiden under de 3 tanker fra maskinrummet —
> være en knap/tekst med Læs flere nyheder. I menuen skal du nederst have en
> punkt der hedder Alle nyheder/All news der linker til selv samme liste.»

## Hvorfor den ikke findes i dag — målt, ikke antaget

Der er tre veje ind i indholdet, og ingen af dem er en kronologisk liste:

| Findes | Hvad den gør | Hvorfor den ikke løser det |
|---|---|---|
| forsidens tre kort | `loadRandomNews(locale, 3)` — **tilfældige** tre, blandet ved hver reload | viser tre ud af alt, og aldrig de samme |
| `/indsigter`, `/ai-metode` … | én side pr. **kategori** | man skal kende kategorien for at finde en artikel |
| `/indeks` | sitemap-agtig tabel over hver side, grupperet | en oversigt over SIDER, ikke en nyhedsstrøm med dato |

Så en læser der vil se «hvad har de skrevet for nylig» har ingen side at gå til.
De tre kort på forsiden er tilfældige med vilje — det er en teaser, ikke et arkiv.

## Løsningen

1. **`loadAllNews(locale)`** i `src/content/compose.ts` — alle `posts` for sproget,
   **undtagen `cases`**, sorteret på dato faldende.

   Udelukkelsen af `cases` er ikke en detalje: `loadRandomNews` udelader dem
   allerede med begrundelsen *«det er rigtige navngivne kunder, ikke nyheder»*.
   Bruger listen en anden regel end teaseren, siger de to flader forskellige ting
   om hvad en nyhed er — og det er den slags forskel ingen opdager.

2. **Rute `/nyheder` (DA) og `/en/news` (EN)** — kronologisk liste med dato,
   kategori, læsetid, titel og manchet.

3. **«Læs flere nyheder» / «Read more news»** under de tre kort på forsiden.
   `Insights` får et valgfrit `allLink`, samme form som flagskibssektionen
   allerede bruger (`allLink: { label, href, testid }`).

4. **«Alle nyheder» / «All news» nederst i Indsigter-menuen**, under de fem
   kategorier.

## Afgrænsning

**Ikke med:** paginering (der er 38 poster i alt — en side rækker, og en
paginering uden nok indhold er støj), filtrering pr. kategori på listen (det er
hvad kategorisiderne er), RSS, og at røre de tre tilfældige kort på forsiden.

## Risiko

Siden er **live**. Deploy sker fra `main`; en ældre note om at live-koden lå på
`f001-stack-b-build` er **forkert i dag** — målt 31/8: main er fra i dag,
f001-stack-b-build har stået stille siden 1. juli. Noten er rettet frem for at
blive fulgt.
