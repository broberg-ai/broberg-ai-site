# F020 — Sider der ikke findes skal sige det

> **Christian 10/9-2026:** *«4 lav 404 (mockup med mig, store avatarer af mig,
> mit billede sammen med Aidan og Airina, og lav den sjov)»* — og efter mockup
> v2: **«byg den»**.

## Årsagen, målt — og den er mindre end den så ud

Mit oprindelige udsagn var «broberg.ai svarer 200 på sider der ikke findes».
Sandt, men upræcist om hvor. Målt i `src/server.tsx`:

**To-segment-ruterne gør det allerede rigtigt.** `/:category/:slug`,
`/tags/:tag`, `/losninger/:slug`, `/flagskibe/:slug` bruger alle mønstret
`r ? html(r) : notFound(...)`.

**Fejlen er præcis de to SIDSTE ruter i filen** — ét-segment-fangerne:

```ts
app.get("/en/:slug", async (c) => {
  const idx = await renderBlogIndex("en", seg);
  return html(idx ?? await renderGenericPage("en", seg));   // ← altid 200
});
app.get("/:slug", async (c) => { /* samme, dansk */ });
```

### Og pladsholderen er værre end en tom side

`renderGenericPage` (`routes.tsx:1283`) slår **ikke op i CMS overhovedet**:

```tsx
<h2>{slug.replace(/-/g, " ")}</h2>
<p>Denne side hentes fra cms når indholdet er wired.</p>
```

Overskriften **er den adresse den besøgende skrev**. Så `/findes-slet-ikke-xyz`
bliver til en side med titlen «findes slet ikke xyz», status 200, klar til
indeksering. Det er en pladsholder fra sitets første dage der aldrig blev
fjernet.

### Er nogen rigtige sider afhængige af den?

Det var spørgsmålet der afgjorde om rettelsen var sikker, og det blev målt frem
for antaget. Sitemappet har **121 stier, hvoraf 13 er ét-segment** — netop dem
de to ruter fanger:

```
/ai-metode /bag-om /cases /en /featured /flagskibe /indsigter
/losninger /nyheder /platform /tags /tak /universet
```

Hver af dem hentet fra produktion og gennemsøgt for pladsholderens egen sætning:
**0 træf på alle.** De rammer enten en literal rute længere oppe eller
`renderBlogIndex`. `renderGenericPage` bruges altså **udelukkende** til stier der
ikke findes.

## Reuse

Discovery-søgning på «404», «not found», «error page»: intet `@broberg/*` ejer
fejlsider, og det er rigtigt — en 404 er sitets ansigt, ikke en delt primitiv.
Genbruges internt: `notFound()` (findes i `server.tsx:44`), sitets egne
brand-tokens, og `Figur.tsx`s `AIDAN_STILL` / `AIRINA_STILL`.

**Beslutning: ingen ny afhængighed, ingen ny hjælper. `notFound()` findes.**

## Hvad der bygges

`render404(locale)` i `routes.tsx`, serveret med status 404 fra begge
ét-segment-ruter. Indholdet er den godkendte mockup (v2):

- overskrift: «Den side findes ikke. Og ingen af os vil kendes ved den.»
- de tre med hver sin replik — Airina, Aidan, Christian
- tre veje videre: forsiden, artiklerne, spørg Aidan
- den sti brugeren faktisk bad om, vist som tekst

**Teksten hører hjemme i CMS, ikke i koden** (husets regel). Værdierne skrives
ind i `globals` i SAMME tur som koden der læser dem, og læses tilbage fra en
frisk GET.

## Ikke-mål

- **Ingen omdirigering til forsiden.** En 404 der sender folk til `/` skjuler
  at linket var forkert og er værre for både mennesket og Google.
- **`renderGenericPage` slettes ikke i denne omgang** — den nævnes her som
  død kode, og fjernes når 404'en har stået en uge uden overraskelser.
- **Ingen gætterier om «mente du…?»**. En søgefunktion på en fejlside er en
  anden feature.

## Acceptkriterier

Se kortet F020.1.
