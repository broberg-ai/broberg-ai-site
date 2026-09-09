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
