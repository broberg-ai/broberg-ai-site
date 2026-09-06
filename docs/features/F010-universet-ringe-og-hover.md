# F010 — Universet: ingen node må forsvinde tavst

**Status:** bygget og udrullet 6/9-2026 (`9bb4aa1`, `891297e`, `259c486`, `d8f6914`).

## Motivation

Ejeren bad om tre små ting på /universet: indsæt FD Sundhed, ret to kundenavne,
og få planeterne til at gløde når man peger på dem. To af dem afslørede den
samme fejl to steder.

## Fejlen: en liste over PLADSER, ikke over indhold

Begge ringe var faste lister af koordinater, og diagrammet renderéde én node pr.
PLADS:

```tsx
CUSTOMER_SLOTS.map((s, i) => customers[i] ? <Node .../> : null)   // 4 pladser
INFRA_SLOTS.map((s, i)   => infra[i]     ? <Node .../> : null)   // 7 pladser
```

Målt da fejlen blev fundet:

| ring | dokumenter i CMS | pladser i koden | usynlige |
|---|---|---|---|
| kunder | 5 (efter FD Sundhed) | 4 | 1 |
| motorer | 13 | 7 | **6** |

Den femte kunde ville være blevet skrevet i CMS'et, gemt korrekt, og aldrig
vist. Ingen advarsel, intet hul i ringen — bare fire planeter som altid.
Hvilke seks motorer der faldt af afhang udelukkende af den rækkefølge samlingen
tilfældigvis blev læst i.

**Ejeren opdagede det som «tilføj upmetrics».** Den lå der allerede. Han lagde
mærke til én af seks.

Jeg rettede kunderingen først og lod motorringen stå — samme kode, samme
fejlform, én skærm længere inde. Det er den del der er værd at huske: en fejl
er sjældent ét sted.

## Løsning

**Pladserne regnes ud af antallet**, samme `ringPladser()` for begge ringe.
Som sidegevinst ligger kunderne nu PÅ deres ring; de fire håndsatte lå spredt
fra r=174 til r=207 og hverken jævnt eller på den.

**Egerne kommer fra SAMME udtræk som noderne.** De var syv hardkodede linjer.
Regnes de hver for sig, kan et tilfældigt udsnit give en ege der peger på en
node der ikke blev tegnet — en test tæller dem op mod hinanden.

**Over grænsen randomiseres udsnittet**, ejerens valg: *«når der er flere kunder
og der ikke er plads til flere så randomiserer vi bare kunderne»*. Grænserne er
målte, ikke runde: 8 kunder (149 px mellem naboer, længste navn 85) og 13
motorer (63 px, længste navn 55). Udsnittet skifter ved hver sidevisning, så
ingen er permanent usynlig — forskellen på at VÆLGE og at TABE.

**Hvem der vises ligger i CMS'et.** Nyt felt «Vis i universet» på flagskibe;
filteret er `!== false`. Den vej rundt med vilje: en ny platform kommer MED af
sig selv og skal aktivt slås fra, fordi den modsatte retning er præcis den der
lige kostede seks usynlige platforme.

Ejeren fravalgte fem: docs, consulting, contracts, drift, pitch vault — ydelser
og sideprodukter, ikke byggeklodser. De beholder deres flagskibs-sider.

**Hover gløder og pulserer.** Før voksede prikken fra 4 til 8 px og intet andet;
ejeren sendte et nærbillede af en helt flad cirkel. Nu puster en ring ud og
planeten får to lag skygge — ét tæt og skarpt, ét bredt og blødt, fordi ét
alene ser enten hårdt eller udvasket ud på en 4 px prik. Farven er nodens egen
via `currentColor`.

**CMS-tekst:** «Fysio DK Sport» → «FD Sport», «Fysio DK Aalborg» →
«FysioDanmark Aalborg», FD Sundhed tilføjet, og «Lens» → «lens» (den eneste af
13 platforme med stort forbogstav). Alt på begge sprog.

## Tre fejl i min egen fremgangsmåde

Værd at skrive ned, fordi de alle tre var TAVSE:

1. **En PATCH der svarede 200 og ikke skrev noget.** Jeg lagde feltet på
   topniveau i stedet for under `data`. Ruten merger `body.data` — var det
   undefined, blev intet ændret, og svaret var 200. Fanget udelukkende fordi
   værdien blev læst tilbage.
2. **Jeg kørte kun typecheck + tests lokalt.** Gate B stoppede et push på tre
   hardkodede ord i den nye tegning. Alle syv porte tager 20 sekunder.
3. **Deploy-vagten hentede «seneste kørsel»** og ramte den FORRIGE commits
   grønne kørsel, så en rød pipeline blev meldt som ventende. Den skal matche
   min egen sha.

## Åbent

De fem orange kunde-etiketter måler **4,28:1** i mørkt tema mod WCAG AA 4,5:1.
De blå motornavne består, fordi de står inde i den lyse glød om kernen. Dette
er et ÆGTE fund (rigtig HTML-tekst, rigtig baggrund) — til forskel fra det
samtidige 1,42:1-fund på SVG-tekst, hvor den EKSISTERENDE cardmem-tegning målte
netop samme tal og fundet dermed er kritikerens blindhed for hvad en SVG-tekst
står på.

Ejeren har godkendt udseendet («Det er godt sådan her»). Rettelsen er ét trin
lysere på `.lbl` og afventer hans ord.

## Non-goals

- **De fem fravalgte slettes ikke.** De er rigtige flagskibe med egne sider.
- **Ingen ny geometri for infra-ringen.** Den bliver på r=132 hvor den lå.
