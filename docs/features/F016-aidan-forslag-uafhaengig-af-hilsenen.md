# F016 — forslagene hang på hilsen-kortets gate

**Christian, anden melding:** *«Aidan er SLET ikke adaptiv - hvorfor ikke - skal
du have tid til at analysere det bedre?»*

Andel meldt to gange. Første gang (8/9) rettede jeg **kortets tekst** — F007.19 —
og meldte det løst. Det var ikke årsagen.

## Diagnosen, målt før noget blev rørt

`visPills()` og `tilpasHilsen()` blev **kun kaldt inde i `if (skalVises(...))`**
— hilsen-kortets gate. Den gate er et engangs-vink til en **førstegangs-
besøgende** og siger nej på fire måder:

```
panelHarVaeretAabent   → nej
harTidligereSamtaler   → nej      ← Christians tilstand
afvistFoer             → nej
vistIDetteBesoeg       → nej
synligMs < 10 sek.     → nej
```

Forslagene arvede altså en livscyklus bygget til noget helt andet.

**Målt på produktion, iPhone/WebKit, med en tidligere samtale i localStorage:**

| | |
|---|---|
| `/` ved indlæsning | pills skjult, **0 stk.** — hilsen: «Jeg er Aidan. Hvordan kan jeg hjælpe dig?» |
| `/universet` efter **16 sekunder** | `pills-hidden=true`, **antal=0**, `hilsen-hidden=true` |

Det er ikke «sjældent». For en der har brugt Aidan én gang, findes der **ingen
rækkefølge af klik** der kan fremkalde forslagene.

## Hvorfor min verifikation i går bestod

En frisk Lens-browser har **tom hukommelse** og passerede alle fire nej'er, og
jeg ventede længe nok. Målingen svarede rigtigt på *«kan forslagene renderes?»*
og aldrig på *«vil en tilbagevendende besøgende se dem?»*

Det er tredje gang på to døgn jeg rammer den form: **et grønt der besvarer et
smallere spørgsmål end det stillede.** De to andre var HelpDesk-siden (200 før
tegningen var udrullet) og byggedata-stregen (ordet stod også i billedteksten).

## Rettelsen

Forslagene følger nu **chat-knappen** i stedet for hilsen-kortet. Knappen
afsløres ved første scroll; forslagene lægger sig oven over den — som i
Intercom-eksemplet der var forlægget.

Det giver den rigtige betingelse gratis: står knappen ikke der endnu, svæver
forslagene ikke over ingenting. Og en åben chat skjuler dem — de er en vej
**ind** i samtalen, ikke pynt ved siden af den.

Hilsen-kortet beholder sine fire nej'er uændret. Det ER et engangs-vink, og det
skal blive ved med at være det.

## Ikke i scope

- **Reglerne selv.** Hvilke forslag der vises på hvilke sider ligger i CMS'et
  (`aidanPills`) og ændres uden en udrulning.
- **Hilsen-kortets timing.** De 10 sekunder og de fire nej'er er uændrede.

## Reuse

Discovery-tjek: ingen `@broberg/*`-pakke ejer «vis kontekst-forslag ved en
chat-knap». Genbrugt sitets eget: `aidan-spor.ts`' udvælgelse (uberørt — den
virkede hele tiden), `visPills`/`skjulPills` (uberørt), og FAB'ens egen
scroll-afsløring som udløser.

## Bevisførelse

1. **Med Christians tilstand** (tidligere samtale i localStorage) skal
   forslagene VISES — det er hele meldingen.
2. **Adaptiviteten måles på to sider**, ikke én: samme besøg, to ruter,
   forskellige forslag. Én side beviser ingenting om tilpasning.
3. **Mutations-tjek:** rul rettelsen tilbage, og vagten skal gå rød.
4. **På WebKit og en telefon-viewport**, ikke Chromium på skrivebordet — det er
   dér meldingen kom fra.

---

## F016.9 — de engelske sider fik aldrig de nye spørgsmål, og tre rigtige sektioner havde ingen

**Selvmeldt, ikke ejer-meldt.** F016.6 skrev 145 linjer ind i `globals.aidanPills`
— det danske dokument. `en-globals.aidanPills` blev aldrig rørt og stod tilbage
med de oprindelige 17. Målt på produktion før rettelsen: DA 145 linjer, EN 17.

Det er den samme fejlform som resten af F016: **et grønt svar på et smallere
spørgsmål end det stillede.** Jeg målte «blev de 145 linjer skrevet» og fik ja.
Spørgsmålet der betød noget var «har hver besøgende nu sidens egne spørgsmål»,
og for en engelsktalende var svaret nej.

### Og to sektioner mere, fundet undervejs

Da jeg opregnede de engelske ruter for at oversætte reglerne, viste det sig at
**`/platform`, `/ai-metode` og `/bag-om` er rigtige sider på BEGGE sprog uden én
eneste egen regel.** De faldt tilbage på de tre generelle. Det havde ingen
opdaget, fordi en side uden egne forslag ser ud præcis som en side hvis forslag
ikke passer — den viser stadig tre pæne spørgsmål.

### Ruterne er de engelske slugs, ikke danske med præfiks

`normaliser()` skræller `/en` af, så en regel skrives `/flagships/cms` — ikke
`/en/flagships/cms` og ikke `/flagskibe/cms`. De 17 gamle EN-linjer brugte
allerede den form og virkede; det var kun indholdet der var forældet.

### Fundet, men IKKE rettet (uden for scope)

`/om`, `/kontakt` og `/priser` svarer 200 på begge sprog og renderer deres eget
slug som titel — «om — broberg.ai». Det er ikke rigtige sider. To af dem har
regler i den danske liste, som derfor aldrig kan ramme noget. Det er en separat
sag; jeg har ikke rørt den.

### Acceptkriterier

1. `en-globals.aidanPills` har ≥ 145 linjer, læst tilbage fra en frisk GET med
   streng lighed.
2. `/en/flagships/cms` viser mindst ét forslag der nævner CMS/website/content.
3. **Negativ kontrol:** en engelsk side viser INGEN danske spørgsmål.
4. `/platform` viser egne spørgsmål på begge sprog.
5. Feltantallet i begge globals-dokumenter er uændret før/efter skrivningen —
   `_lastEditedBy` er det eneste andet felt der må have flyttet sig.
