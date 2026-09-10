# F022 — Agentic Engineering

> **Bestilt af Christian 10/9-2026:** *«vi udvider med en side om Agentic
> Engineering i første omgang med dine egne ord (ikke en afskrivning)»*, og
> 11/9 med referencen: *«Det er denne side vi skal have "vores" udgave af:
> https://syv.ai/agentic-engineering»*.
>
> **Denne plan er skrevet EFTER kortet blev oprettet.** Kortet stod i
> «In progress» i et døgn uden plan-doc og uden indhold, fordi flagskibs-ordren
> overhalede det. Det er husets regel om at plan-doc og F-nummer lander samme
> tur, brudt. Gælden er ikke betalt tilbage med tilbagevirkende kraft — den er
> gjort synlig her frem for at forsvinde.

## Beslutningen der bestemmer alt andet

Referencen sælger **en workshop**: to dage, 14 moduler, «lær jeres udviklere at
kode med AI-agenter». Vi er ikke i den forretning på samme måde — vi *gør* det.
Så spørgsmålet var hvad vores udgave skal sælge, og det blev forelagt ejeren
frem for gættet, fordi svaret ændrer hele sidens indhold.

**Christians valg: BEGGE.** Metoden først med beviset, og workshoppen som et
tilbud længere nede til dem der hellere vil lære det selv.

| vraget | hvorfor det ikke blev valgt |
|---|---|
| Kun metode | Lukker døren for dem der vil lære det selv — og workshoppen er efterspurgt nok til at referencen bygger en hel side på den |
| Kun workshop | Ville gøre os til en kursusudbyder og skjule det der faktisk er sjældent: at systemerne er bygget og driftet af agenter |

## Sproget — hvad der blev taget fra analysen, og hvad der ikke blev

Grundlaget er `docs/analyse/syv-ai-sprogindeks.md`. Målingen dér vendte
forventningen: vi skriver **kortere sætninger og tiltaler læseren næsten tre
gange så ofte** som dem. Forskellen lå ikke i sproget — den lå i at **deres
overskrifter navngiver en indvending og lukker den**.

**Taget med:**

- Overskrifter der lukker en indvending frem for at beskrive os selv.
  *«Det svære er ikke at få en AI til at skrive kode. Det er at turde udgive
  den.»* lukker «kan AI overhovedet det her?» ved at give den ret og flytte
  spørgsmålet.
- **Tal i stedet for tillægsord.** Hvert tal på siden er MÅLT 11/9, ikke husket:
  34 kodearkiver (cardmem), 15 flagskibe (live-gitteret), 49 delte pakker
  (Discovery), 123 sider (vores eget sitemap), 8 uger (fysiodanmark).
- FAQ der svarer på indvendinger frem for at forklare produktet.

**Ikke taget med:**

- Deres struktur. Vi har flagskibe og et univers; de har produkter og moduler.
- Deres ordlyd. Mønstre kan læres; sætninger er deres.
- Et pensum med modulnumre. Vi har ikke kørt workshoppen 14 gange, og at
  opfinde en modulliste ville være det første usande på siden.

## Arkitektur — genbrug af `solutions`, ikke en ny sidetype

Siden er et **dokument i den eksisterende `solutions`-samling**, ikke en ny rute
og ikke en bespoke renderer. Den arver dermed i18n, inline-redigering, SEO,
løsnings-oversigten og previews uden en linje ny infrastruktur.

`SolutionData` dækkede fire af de seks blokke i det valgte layout. De to sidste
er tilføjet som **VALGFRIE felter**, og valgfriheden er hele pointen: de fire
eksisterende løsningssider har dem ikke og skal rendere nøjagtig som før.

| ny blok | felt | genbrugt fra |
|---|---|---|
| Tallene | `stats?: [tal, tekst][]` | `.stat-card` + `.stat-num`, som flagskibs-sliderne allerede bruger |
| Workshop-tilbuddet | `workshop?: {…}` | `.cta-final` + `.flowchip` — **nul ny CSS** |
| FAQ | `faq?: [q, a][]` | `<Faq>` fra salgslandingen, uændret |

Dertil **per-side overskrifter** (`howHeading`, `featuresHeading`, …). De var
fælles i globals, og uden en overskrivning stod valget mellem en forkert
overskrift på den nye side («Kernefunktioner» over fem principper) eller en
ændring der ramte de fire andre sider. Feltet er tomt på alle eksisterende
dokumenter, så `gv()`-værdien er stadig den der vises overalt hvor ingen har
bedt om andet.

**Menupunktet er håndskrevet i `Nav.tsx`.** Dropdown'en er ikke datadrevet, så
en ny løsningsside dukker IKKE op i menuen af sig selv — den kan kun nås via
`/losninger`. Det blev fundet ved at måle, ikke ved at antage, og punktet er
tilføjet efter samme mønster som de fire andre: reservetekst i koden,
rigtig værdi i `globals.nav`. En datadrevet dropdown ville være det rigtige, men
det er en anden opgave end denne.

## Spærren

`src/loesningsside-valgfri.test.ts` måler **fraværet**, ikke tilstedeværelsen.
Den bærende prøve er den negative: et dokument uden de nye felter må ikke få
hverken et tomt bånd, en tom overskrift eller et ekstra afsnit. `stats: []`
tæller som fravær — det er hvad et CMS-felt giver når nogen rydder det, og en
sektion med nul kort ville efterlade luft der ser ud som en fejl.

**Mutations-bevist:** gøres tal-blokken og FAQ'en ubetingede, går **5 af 7
prøver røde**; gendannet er alle 7 grønne.

## Fejl fundet ved at KIGGE, ikke ved at køre prøver

Tre ting kom kun frem fordi billedet blev åbnet. Ingen af dem ville have gjort
noget rødt:

1. **Tre af seks ikoner renderede ingenting.** `ShieldCheck`, `Blocks` og
   `GitBranch` findes ikke i `Icons.tsx`, og et ukendt navn tegner tomhed uden
   at fejle. Rettet til `BarChart`, `Layers`, `Bot`.
2. **Fire trin i et gitter bygget til tre.** `.steps3` er `repeat(3, 1fr)` med
   en forbindelseslinje på tværs; det fjerde trin faldt ned i venstre kolonne og
   brød linjen. Skrevet om til tre trin — og de fire andre løsningssider har
   også præcis tre, hvilket var vinket jeg overså.
3. **Overskriften sagde «Fem ting» over seks kort.** Min egen fejl, indført da
   jeg tilføjede et sjette princip for at fylde gitteret.

Fem tal blev samtidig til tre, fordi `.stat-row` er `repeat(3, 1fr)` med
`max-width: 560px`. Tre er også de rigtige tre: skala, fart og troværdighed
frem for tre volumen-tal der siger det samme.

## Reuse

| capability | beslutning | hvorfor |
|---|---|---|
| Sidetype + rendering | **Genbrug** — `solutions` | En ny rute ville koste i18n, preview, inline-redigering og oversigt for at få den samme side |
| FAQ-accordion | **Genbrug** — `<Faq>` | Fandtes fra salgslandingen, uændret, inkl. klientside-udfoldning |
| Tal-visning | **Genbrug** — `.stat-card` | Findes i `brand.css` og bruges af flagskibs-sliderne. Ord-vs-tal-reglen er kopieret ORDRET derfra og prøvet, netop fordi en kopi kan drifte |
| Workshop-bånd | **Genbrug** — `.cta-final` + `.flowchip` | Nul ny CSS |
| Brugervendt tekst | **Genbrug** — CMS | Husets regel. Alle 25 felter × 2 sprog ligger i `solutions`, menuteksten i `globals.nav` |
| Booking i kalenderen | **Ikke her** | F021. Siden peger på `#kontakt` indtil den findes |

## Åbne punkter

- **Booking er stadig en formular, ikke en kalender.** Referencen tilbyder
  direkte booking i en kalender og lover svar «inden 2 timer i hverdage». Vi
  lover ikke en svartid, fordi tallet er Christians at give — det er F021.1's
  eneste manglende oplysning.
- **Et ukendt ikonnavn er en tavs fejl.** Det blev fanget med øjnene denne gang.
  Der er ingen port der fanger det, fordi indholdet bor i CMS og ikke i repoet,
  og en prøve må ikke ringe ud på nettet. Værd at rejse som sit eget.
- **Dropdown'en er håndskrevet.** Næste løsningsside rammer samme fælde.
