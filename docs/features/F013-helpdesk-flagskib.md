# F013 — HelpDesk som flagskib på broberg.ai

**Status:** in progress · **Repo:** broberg-ai/broberg-ai-site

## Ordren

Christian, 8. september 2026 (dansk tid), to beskeder:

> «NEJ der skal ikke stå ordret at HelpDesk er under udvikling det er færdigt i
> løbet af et par dage måske 5-7 dage så nej - den skal have FULD skrue.»

> «Lav Flagship side, ikon OG animation/tegning»

## Forhistorien, og hvorfor den står her

`helpdesk`-sessionen leverede råteksten og bad udtrykkeligt om en **ærlig
statuslinje**: «HelpDesk er under udvikling. Der er ikke skrevet kode endnu.»
Deres begrundelse var god og værd at gengive, fordi den ikke er jura:

> broberg.ai's øvrige produkter ER ægte og virker. En flagship-side der lover et
> produkt der ikke findes, sår tvivl om dem alle sammen — prisen betales et
> andet sted end på denne side.

**Christian har overrulet det direkte.** Produktet er 5-7 dage væk, og siden
skal stå som en rigtig produktside. Det er hans beslutning og hans risiko;
helpdesk er underrettet med det samme, netop fordi det var deres bærende punkt
og ikke en formulering.

**Det jeg IKKE gør på eget initiativ**, fordi «fuld skrue» handlede om tonen og
om at fjerne forbeholdet — ikke om at opfinde noget:

- ingen priser
- ingen kundelogoer eller udtalelser
- ingen «kom i gang»-knap til en tilmelding der ikke findes

Beder han om et af de tre, laver jeg det. Jeg lægger det bare ikke ind selv.

## De fire bærende påstande

Produktdesign, ikke status — de står uændret, og ændres de i redigeringen, er
det PLANEN hos helpdesk der skal rettes:

1. **Vi sender ingen widget.** Kunden bygger fladen selv; hver pixel er deres.
2. **Ingen pladsgebyrer.** Der er ingen pladser at sælge, fordi kunden ejer fladen.
3. **Fem eskalations-niveauer**, hvert med en defineret grænse for hvornår det
   giver op.
4. **«Afvent» er udgangspunktet.** Autonomi optjenes pr. emne — og låses
   automatisk tilbage.

FysioDanmark Aalborg står som **første kunde**, ikke «pilotkunde». helpdesks
begrundelse holder uanset statuslinjen: ordet ville gøre dem mindre end de er og
os større end vi er.

## Hvad der bygges

| Del | Hvor |
|---|---|
| Produktsiden | `platforms`-dokumentet `helpdesk` (+ `en-helpdesk`) i CMS'et |
| Tegningen | `src/components/Illustrations.tsx` — animeret SVG, samme form som `trail`/`cms` |
| Ikonet | samme sted, i flagskibs-registret så universet og listerne kan vise det |

**Teksten bor i CMS'et, ikke i koden.** Husregel, og her har den en ekstra
grund: helpdesk skal kunne rette deres egen produktbeskrivelse uden en
udrulning — og de har bedt om adgangen.

## Ikke i scope

- Engelsk udgave af brødteksten. helpdesk anbefaler at oversætte fra en landet
  tekst frem for at skrive parallelt, og det er rigtigt. Dokumentet oprettes,
  men indholdet er dansk indtil teksten står fast.
- Ændringer i helpdesks plan eller produkt. Denne side beskriver; den beslutter
  ikke.

## Reuse

Discovery-søgt: intet `@broberg/*`-modul dækker en produktside på et af vores
egne sites. Genbrugt i stedet, alt sammen sitets eget: `platforms`-skemaet med
`slides`, `FlagshipSlides.tsx` til visningen, og `Illustrations.tsx`' `wrap()` +
`illu-flow`/`pulse-core`-klasserne så tegningen animerer som de tolv andre frem
for at have sin egen mekanik. Intet nyt at melde til `components`.
