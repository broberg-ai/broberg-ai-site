# F015 — Artikel: agentic orkestration fra projektstart til drift

**Christian, 9/9 2026:** *«Lav noget web research på Agentic Orchestration og
baseret på det research lav en artikel og hvordan vi implementerer AO fra
projektstart til drift og support i Cardmem, Trail og HelpDesk»*

## Hvad researchen faktisk sagde

Søgt 9. september 2026. De tal der bærer artiklen, med kilde — ingen af dem er
mine egne skøn:

| tal | kilde |
|---|---|
| **40 %+** af agentiske AI-projekter aflyses inden udgangen af 2027 — pga. omkostninger, uklar værdi eller utilstrækkelig risikostyring | Gartner (juni 2025) |
| **40 %** af virksomheder vil degradere eller nedlægge autonome agenter inden 2027 pga. governance-huller **der først blev fundet efter en produktionshændelse** | Gartner (maj 2026) |
| **60 %** af AI-fejl stammer fra governance-huller, ikke fra modellens ydeevne | IDC |
| Skiftet fra *human-in-the-loop* til *human-on-the-loop* | Deloitte |
| Tier-1-deflektion: median **41,2 %**, øverste kvartil **58,7 %**; refusion/kodeskift **70 %+**, nuancerede klager **under 25 %** | CX-benchmark 2026 |
| Eskalations-udløsere: lav konfidens **39 %**, brugeren beder om det **28 %**, stemning falder **17 %**, reguleret emne **16 %** | samme |
| **64 %** af CX-teams kørte en pilot i 2026 — kun **27 %** havde én kanal i fuld drift | samme |

To formuleringer fra researchen bærer hver sit afsnit, fordi de beskriver
præcis de to fejl vi har designet imod:

- **«Uden proveniens bliver hukommelse til et selvsikkert rygte.»** Det er
  Trails hele eksistensberettigelse sagt af en fremmed.
- **«Et system der lukker, omdirigerer eller deflekterer en sag, har ikke
  nødvendigvis løst kundens problem.»** Det er HelpDesks niveau 3 —
  bekræftelsen hos brugeren selv — sagt af en fremmed.

Og Gartners governance-pointe er den skarpeste af dem alle: **ensartet
governance på tværs af alle agenter er selv en fejlkilde.** Det der skal skelnes
er *en agents evne til at handle* fra *omfanget af den adgang den har fået*.

## Vinklen

Branchen er i 2026 konvergeret mod et **kontrolplan** med syv byggeklodser
(integrationer, kontekst, agent-register, måling, menneske-i-løkken, governance,
orkestrering). Artiklen viser den kæde vi rent faktisk kører, led for led, og
hvem der ejer hvert led:

| led | ejer |
|---|---|
| beslutning + genbrugstjek | Decision Register + Discovery |
| plan med testbare acceptkriterier | **Cardmem** |
| agenten samler kortet op og bygger | **Cardmem** |
| visuel verifikation | **Cardmem Lens** |
| porten der blokerer en udrulning | CI |
| hvorfor det blev bygget sådan | **Trail** |
| fejl i drift | Upmetrics |
| kundens spørgsmål | **HelpDesk** |

## Ikke i scope

- **Engelsk udgave.** Skrives når den danske er landet, ikke parallelt.
- **Nye påstande om produkterne.** Artiklen beskriver det der findes i dag.
  HelpDesk omtales som det er: første kunde FysioDanmark Aalborg, ikke en
  købsklar vare.

## Reuse

Discovery-tjek 9/9 2026: en artikel er indhold, ikke en kapabilitet — der er
intet `@broberg/*`-modul at genbruge eller bygge. Genbrugt i stedet sitets egen
`posts`-model (title / titleHighlight / excerpt / category / tags / content som
Markdown / _seo), så artiklen renderes og søges som alle andre.

## Bevisførelse

1. Skriv i CMS'et, læs tilbage fra en frisk GET med **streng lighed**.
2. Ruten svarer 200 på produktion, og posten står i ⌘K-søgeindekset.
3. **Kilde-kontrol:** hvert eksternt tal i teksten skal kunne findes i tabellen
   ovenfor. Et tal uden kilde er en påstand jeg har fundet på.
4. **Negativ kontrol på os selv:** hver påstand om vores egen mekanik skal kunne
   verificeres i repoet. Det er den kontrol der forhindrer at en artikel om
   governance selv bliver markedsføring.
