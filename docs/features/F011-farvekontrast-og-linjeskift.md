# F011 — Farvekontrast op til WCAG AA, og linjeskift som redaktøren skriver dem

## Hvorfor

Cardmem Lens' kompositions-kritiker målte **65 høje kontrastfejl** på `/flagskibe/lens`
og **84** på `/universet`. Alle i **lyst tema**, ingen i mørkt — og de kom ikke fra
mange forskellige farver, men fra to tokens brugt som tekstfarve.

Ingen fandt dem ved at kigge. Det er hele pointen: **3,06:1 ser ikke forkert ud.**
Teksten er læselig for et normalt syn på en god skærm, så ingen opdager at den ikke
er det for alle andre. Fejlen findes kun ved at regne på den.

Den anden halvdel kom af en konkret anmodning: Christian ville have et linjeskift i
et afsnit på `/flagskibe/cardmem` og **kunne ikke sætte det selv**. Teksten renderes
som ren tekst i et `<p>`, så et linjeskift i CMS-feltet kollapsede til et mellemrum.
Det er husets egen regel vendt mod os — *tekst hører hjemme i CMS'et* — for her kunne
teksten ikke styre sin egen form uden at en agent ændrede kode.

## Hvad der var galt — målt, ikke skønnet

| | før | krav |
|---|---|---|
| `--blue` som tekst, lyst (`#0096db` på `#f5f7fa`) | **3,06:1** | 4,5 |
| samme på hvidt kort | **3,29:1** | 4,5 |
| `--orange-text`, lyst (`#cf3f1b`) | **4,47:1** | 4,5 |
| kundeetiketter i universet, lyst | **3,23:1** | 4,5 |
| `--blue` som tekst, mørkt | 6,22:1 | ✓ |

`--orange-text` er den mest lærerige: **0,03 under kravet.** Den blev i sin tid
indført netop for at løse dette problem for orange — og ramte ved siden af med en
margin ingen kan se. Et tal der er *næsten* rigtigt er farligere end et der er
åbenlyst forkert, fordi det ser færdigt ud.

## Løsning

**Skil TEKST fra GRAFIK** — samme mønster som den eksisterende `--orange-text`:

```css
:root                { --blue-text: #00b2ff; }   /* = --blue; mørkt var allerede fint */
[data-theme="light"] { --blue-text: #0a6d9e; }   /* 5,30:1 */
[data-theme="light"] { --orange-text: #c93a16; } /* 4,77:1, var 4,47 */
```

Alle 21 `color: var(--blue)` peger nu på `--blue-text`. **Streger, baggrunde,
planeter og glow beholder `--blue`/`--orange`** — brandfarven skal ikke gøres
mørkere for at bestå et krav der ikke gælder grafik.

I `UniverseDiagram.tsx` er nodens farve delt i to: tekstfarve til etiketten og
`--node-glow` til glødet, så glødet ikke arver tekstens mørkere nuance.

**Linjeskift:** `.lead` får `white-space: pre-line` — den bevarer linjeskift og
kollapser almindelige mellemrum som hidtil. Målt før skiftet: **0 linjeskift** i
lead-indhold på forside, `/universet`, `/flagskibe` og en artikel, så eksisterende
tekster renderer identisk. Christian kan nu sætte sine egne afsnit i inline-editoren.

## Non-goals

- **`.btn`s blå baggrund** (3,06:1 mod lys tekst) er ikke rørt. Det er blå som
  *baggrund*, ikke som tekst, og en rettelse ville ændre den primære knaps brandfarve
  på hver side. Designbeslutning, ikke fejlrettelse — den ligger hos Christian.
- **Mørkt tema er ikke Lens-verificeret.** `lens_capture` har ingen parameter for
  farvetema, og sitet vælger ud fra browserens præference. De mørke tal er *regnet*
  med WCAG-formlen, ikke fotograferet. For blå kan mørkt ikke regressere
  (`--blue-text` **er** `--blue` dér); for orange er 4,28 → 5,23 regnet.

## Reuse

Ingen `@broberg/*`-pakke ejer farve-tokens eller kontrastregning — det er sitets egen
palet i dets eget stylesheet. Discovery søgt på "contrast" og "design tokens": ingen
delt primitiv at genbruge. WCAG-formlen er ~12 linjer og bor i testen, ikke i en pakke.

## Sådan er det forseglet

`src/css-tokens.test.ts` regner kontrasten på alle fire token/tema-kombinationer og
kræver ≥4,5:1, samt at `.lead` bærer `pre-line`. **Mutationsbevist:** sættes
`--orange-text` tilbage til `#cf3f1b`, går den rød med begge tal i meldingen
(`4.47:1` mod `4.50:1`); fjernes `white-space`, går linjeskift-testen rød.

Placeringen er bevidst: fejlen blev fundet ved at **regne**, så den bevogtes ved at
regne. Et øje der kigger på et skærmbillede er ingen holdbar detektor for 0,03.

## Resultat

| flade | høje fund før | efter |
|---|---|---|
| `/flagskibe/lens` | 65 | 1 (`.btn`, se non-goals) |
| `/universet` | 84 | 7 → forventet ~0 efter orange-tokenen |

## Stories

- **F011.1** — tekst-tokens op til WCAG AA + `.lead` respekterer linjeskift
