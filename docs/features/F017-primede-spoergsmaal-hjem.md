# F017 — de primede chat-spørgsmål skal have et rigtigt hjem

> **Status:** planlagt. Bevidst IKKE bygget endnu — se «Hvorfor ikke nu».

## Christians spørgsmål, ordret

> «Kan vi prime x antal beskeder der kan vælges mellem? Og hvor gør vi det for
> det lugter af noget der skal kunne genanvendes i det kommende HelpDesk system
> der helt overtager at styre vores chat-bots.»

Han har ret i lugten. Det er ikke en tekst der hører til på broberg.ai; det er
et **datasæt om hvilke spørgsmål et publikum stiller hvor** — og præcis dét er
HelpDesks fag.

## Hvor det ligger i dag, og hvad det koster

| | dansk | engelsk |
|---|---|---|
| dokument | `globals.aidanPills` | `en-globals.aidanPills` |
| linjer | 159 | 152 |
| ruter | 34 | 32 |

**311 linjer fordelt på to tekstfelter.** Formatet er én linje pr. forslag:

```
/flagskibe/cms | Har du brug for et AI-native CMS?
```

Det virker, det kan redigeres uden en udrulning, og det er et **dårligt
redigeringsrum**. Tre konkrete omkostninger, alle målt i denne runde:

1. **De to sprog driver fra hinanden i stilhed.** DA fik 145 linjer; EN blev
   glemt og stod med 17 i fire dage. Intet sagde fra. Det er F016.9.
2. **En manglende rute ser ud som en dækket rute.** `/platform`, `/ai-metode`
   og `/bag-om` havde nul egne spørgsmål og viste alligevel tre pæne generelle.
   Fundet ved at opregne ruterne manuelt, ikke af noget system.
3. **Ingen ved hvilke der virker.** Vi måler ikke hvilke forslag der bliver
   klikket. Uden det er 311 linjer et gæt vi vedligeholder i blinde.

## Hvad der er BÆRENDE, og hvad der er midlertidigt

**Bærende — flytter med, uanset hvor det ender:**

- Kontrakten `rute | spørgsmål`. Den er trivielt læsbar for HelpDesk.
- At udvælgelsen er **eksakt-match før præfiks** (F016.7): `/flagskibe` dækker
  `/flagskibe/cms` uden at sige et ord om cms. Enhver ny motor skal arve den
  regel, ellers genopstår den bug der kostede tre forsøg.
- At rotationen holder sig inde i den mest præcise gruppe (F016.8).
- At sproget vælges af ruten, ikke af et separat felt.

**Midlertidigt — CMS-tekstfeltet.** Det er et hjem valgt fordi det virker i dag,
ikke fordi det er rigtigt.

## Hvorfor ikke nu

**Fordi HelpDesk ikke har defineret kontrakten endnu.** Bygger vi en struktureret
model i denne uge, gætter vi formen — og så skal den laves om, samtidig med at
den er det sted 311 linjer indhold ligger. Et halvfærdigt skema med rigtigt
indhold i er dyrere at flytte end et tekstfelt med samme indhold.

Det her er derfor et **kort der venter på en beslutning**, ikke et kort der
venter på en ledig time.

## Hvad HelpDesk skal afgøre (de spørgsmål der låser designet op)

1. **Ejer HelpDesk spørgsmålene, eller ejer sitet dem?** Præcedens findes
   allerede i huset og peger på det sidste: podcast-motoren *validerer*
   udtale-ordbogen, den *ejer* den ikke — sitet sender sin egen med hvert kald.
   Samme form her ville betyde: HelpDesk leverer motoren og målingen, sitet
   leverer sine egne spørgsmål.
2. **Måler vi klik?** Uden det kan ingen sige hvilke af de 311 der virker.
3. **Er en rute den rigtige nøgle?** For et website ja. For en indbygget
   support-widget i en platform er konteksten måske et skærmbillede eller en
   brugerrolle, ikke en URL.
4. **Hvem oversætter?** I dag: en agent, i hånden, med den drift det gav.

## Ikke i scope

- At bygge en generisk «prompt-bibliotek»-service på forkant. Vi har ét
  forbrugssted i dag.
- At røre udvælgelses-logikken. Den er verificeret på produktion (F016.1–.9).
- At flytte spørgsmålene ud af CMS'et før HelpDesk kan tage imod dem.

## Reuse

Discovery-tjek: ingen `@broberg/*`-pakke ejer «primede kontekst-spørgsmål til en
chat». `@broberg/cms-chat-client` er transporten til chatten, ikke et hjem for
forslagene. Når HelpDesk definerer kontrakten, er DEN pakken der skal bære det —
ikke en ny lokal.
