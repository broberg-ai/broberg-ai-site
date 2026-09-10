# F021 — Book et møde uden at skulle skrive en besked først

> **Christian 10/9-2026:** «Vi skal også have mere fart på ift. at kunne booke
> til møder som syv.ai/agentic-engineering og /agentic-engineering#book»

## Målt på begge sites før planen

**Vores formular er allerede stærkere end deres.** Vi har navn, e-mail,
telefon, virksomhed, en besked-boks, nyhedsbrev-tilvalg, honeypot og Turnstile.
De har fire felter og ingen besked-boks.

Feltarbejdet er altså gjort. Vi mangler to andre ting.

### 1. Kalenderen — de har to spor, vi har ét

De stiller **book direkte i kalenderen** ved siden af **send en besked**.
Vi har kun det andet. Et menneske der er klar til at mødes, skal i dag skrive
en besked og så *vente*. Det er dér farten forsvinder.

### 2. Løfterne — de lover fem ting, vi lover nul

Fem korte sætninger står ved deres formular, og hver af dem fjerner en
bekymring:

| deres løfte | bekymringen det lukker |
|---|---|
| uforpligtende | *binder jeg mig til noget?* |
| 30-minutters møde | *hvad koster det mig af tid?* |
| med en af medstifterne | *ender jeg hos en junior?* |
| svar inden to timer | *hører jeg overhovedet fra dem?* |
| ingen sælger imellem | *bliver jeg solgt til?* |

Der står ingenting ved vores. Det er præcis samme mønster som deres
overskrifter — se `docs/analyse/syv-ai-sprogindeks.md`: navngiv modstanden,
og luk den i samme sætning.

## Reuse

Discovery-søgning på «booking», «calendar», «scheduling»: intet `@broberg/*`
ejer mødebooking i dag.

Til gengæld er der noget tættere på: **cms har et kalender-UI**
(`/admin/scheduled`), og `@broberg/ui-controls-core` fik i dag `buildMonthGrid`
som cms netop er blevet første forbruger af (F016.8). cardmem har desuden en
plan liggende for præcis dette — `cardmem/docs/kalender-fra-cms.md` — med
datakontrakten aftalt: `{ id, title, start_at, end_at?, timezone?, status,
source, external_uid? }`.

**Det ændrer rækkefølgen.** Bygger vi vores egen booking her, bør den bruge den
kontrakt, ikke opfinde en ny. Men *vores* behov er en enkelt person der skal
kunne modtage møder — ikke et bookingsystem.

**Beslutning: løfterne først (ingen afhængighed), kalenderen som et selvstændigt
valg bagefter.**

---

## F021.1 — Løfterne ved formularen

Det billigste og hurtigste. Ren tekst i CMS, kan stå live i dag, kræver ingen
integration og ingen beslutning.

Vores egne løfter skal være **sande for os**, ikke kopieret:

- vi svarer inden for … *(Christian sætter tallet — det skal kunne holdes)*
- du taler med den der bygger, ikke en account manager *(sandt: der er ingen
  andre)*
- uforpligtende
- varigheden

**Teksterne i CMS**, som al anden brugervendt tekst.

### Acceptkriterier
1. Løfterne står ved kontaktformularen på både dansk og engelsk, hentet fra
   `globals` — ikke som reservetekst i koden.
2. Skrevet og læst tilbage fra en frisk GET med streng lighed.
3. Lens-verificeret at de er **synlige** ved formularen på både desktop og
   mobil — ikke blot til stede i DOM'en.
4. Kontrasten holder 4,5:1. *(F013.3 kostede os en dumpet måling på præcis
   dette: hvid tekst gav 3,45:1.)*

---

## F021.2 — Book en tid direkte

**Åbent valg, og det er Christians:**

| mulighed | for | imod |
|---|---|---|
| **Cal.com** (hostet) | virker i dag, kendt flow | tredjepart ser mødedata; endnu en konto |
| **Cal.com self-hosted** | data bliver hos os | drift, opdateringer, endnu en Fly-app |
| **Vores egen** | ét hus, genbruger `buildMonthGrid`, matcher cardmems kontrakt | mest arbejde; skal håndtere ledige tider, aflysning, kalender-invitation, tidszoner |

**Tidszonen er ikke et sidespørgsmål.** F194 kostede os et døgn på præcis den
fejl i cms' kalender, og reglen er skrevet: `Europe/Copenhagen` ved navn,
aldrig et fast offset; lagring i UTC, zone kun på præsentationen. En
mødebooking med en kunde er værre end en udgivelse hvis den er en time forkert.

### Ikke-mål
- **Ingen betalingsintegration.** Et intromøde koster ingenting.
- **Ingen flerbrugerkalender.** Én person skal kunne modtage møder.
- **Ingen kopi af cms' bookinglag.** Kontrakten deles, koden gør ikke.

---

## Rækkefølge

1. **F021.1 straks** — teksten er hele forskellen mellem «send en besked og
   håb» og «jeg ved hvad jeg får». Ingen afhængigheder.
2. **F021.2 når Christian har valgt** — de tre veje ovenfor er reelt
   forskellige, og valget er hans, ikke et teknisk detaljespørgsmål.

*Målt 10. september 2026.*
