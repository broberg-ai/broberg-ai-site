# F018 — Aidan svarede uden at vide hvor du stod

> **Nummer-kollision, min fejl.** Commits `2a52503`, `70e7d30` og `3cce1a3`
> refererer F013.1-F013.6. F013.1 og F013.2 fandtes allerede på HelpDesk-
> flagskibs-epicen med helt andet indhold. Arbejdet hører hjemme her som
> F018.1-F018.5. Historikken skrives ikke om; kortene her er adressen.

## Meldingen

Christian klikkede forslaget «Skal vi bruge en widget fra jer?» på
`/flagskibe/helpdesk` og fik:

> «Vi sender aldrig en widget. Vores løsninger er native integrerede…»

Hans indvending: årsagen til at der ikke er en widget er at **vi leverer hele
platformen**. Separat salg af HelpDesk er ikke afvist — og så ville vejen ind
netop være et stykke JavaScript, som Intercom.

## Fem lag, hvert fundet fordi det forrige blev rettet

| | hvad | fundet fordi |
|---|---|---|
| F018.1 | copyen sagde det seks steder i CMS'et | han meldte det |
| F018.2 | spørgsmålet bar ingen sidekontekst | rettelsen hjalp ikke |
| F018.3 | vi fik 7 % af hver Trail-artikel | **Trail-sessionen sagde til** |
| F018.4 | dublet-spærren meldte alt fraværende | jeg gik samme felt efter |
| F018.5 | opslaget tidsudløb → Aidan **opfandt produktet** | tælleren fra F018.5 selv |

Det er samme fejlform hele vejen: **en manglende oplysning degraderer til et
selvsikkert svar.** Intet gik synligt i stykker på noget tidspunkt.

## Det dyreste fund

Tælleren, første måling på prod:

```
"trail":{"forsoeg":1,"svar":0,"tomme":0,"fejl":1,"sidsteMs":6001}
```

Opslaget tidsudløb. Aidan svarede med nul vidensbase og skrev:

> «tre automatiske lag: 1. AI-førstehjælp — en agent der kan svare på **80 %**…»

HelpDesk har **fem** niveauer. Ingen af begreberne findes. Hans egen kontrakt
forbyder ham at opfinde tal. **Sandheden stod på den side den besøgende havde
åben.**

## Rollefordelingen der manglede

| kilde | svartid | rolle |
|---|---|---|
| sidens egen tekst | 42 ms (3 ms cachet) | **gældende kilde** |
| Trail | 2.300-98.500 ms | forstærkning |

Trail-sessionen har selv målt hvorfor deres side er langsom: prisen er antallet
af database-rundture (11.017 vektorer / 200 pr. side = 56 rundture à ~1,7 s),
ikke vektor-matematikken. De retter det; vi skal ikke designe omkring det.

## Hvad Trail-samarbejdet gav os

De meldte selv regressionen, udrullede `?includeContent=true` samme dag, og
aflivede to af mine antagelser med målinger. Vi aflivede én af deres: deres
plan angreb vektor-matematikken, mens vores svartids-tal viste et fast gulv der
ikke afhænger af korpus-størrelse.

De bekræftede også vores designvalg med en begrundelse der er bedre end min
egen: at give top-3 fuld tekst var **at lade deres rangering bestemme hvad
Aidan må vide** — og den rangering er målt usikker.

## Åbent, og det er Christians

- **Skal HelpDesk kunne sælges separat?** Copyen afviser det ikke længere, men
  beslutningen er ikke truffet.
- **De engelske tvillinger i Trail.** Trail anbefaler at vi slet ikke sender
  dem («spring over hvis der findes en søskende på primærsproget» — ikke
  «spring alt engelsk over», så en engelsk-KUN side overlever). Prisen: Aidan
  kan da ikke citere den publicerede engelske ordlyd, men oversætter den danske.
  For fakta er det ligegyldigt; for salgstekst er det Christians kald.

## Reuse

Discovery-tjæk: ingen `@broberg/*`-pakke ejer «giv en chat-agent kontekst om den
side besøgende står på». Genbrugt sitets eget: `buildSearchIndex` (indekset) og
`tilTekst` fra `trail-clip.ts` — SAMME funktion vi bruger til Trail-upload, så
der ikke opstår to opfattelser af hvad der står på en side.
