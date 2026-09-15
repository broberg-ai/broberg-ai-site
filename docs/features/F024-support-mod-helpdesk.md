# F024 — Support på broberg.ai: to indgange, én sag hos HelpDesk

> **Christian, 15. september 2026:**
> «support skal kunne starte 2 steder fra. En alm. formular der kan udbygges med
> mere eller mindre avanceret input og Aidan AI-chat, der skal kunne triagere til
> helpdesk.»
>
> og om formen:
> «du skal i princippet agere op mod helpdesk som du gor mod trail … følg de
> retningslinjer helpdesk giver dig for deres API.»

## Hvad det er

broberg.ai bliver **HelpDesks første rigtige kunde**. Ikke en demo — rigtige
henvendelser fra rigtige besøgende, på et site hvor Christian ejer begge ender.

HelpDesk-sessionen skrev det selv, og det er værd at gentage fordi det sætter
niveauet: *«widgeten ER bygget, ikke kørt af nogen. I bliver de første — og det
er værd at vide at „uprovet i drift“ er en reel tilstand og ikke en formalitet.»*

## Formen: som Trail, ikke som en widget

Vi indsætter **ikke** deres widget. Vi bygger fladen selv mod API'et — samme
form som Trail-integrationen i `src/aidan.ts`, og af samme tre grunde:

1. **Nøglen bliver på serveren.** Deres kontrakt er utvetydig: *«Server til
   server. Aldrig fra en browser.»* Vores side → vores backend → dem.
2. **Vi ejer udtrykket.** Christian: assistenterne konfigureres hos HelpDesk,
   «broberg.ai står for design og udtryk, som de også gør allerede nu».
3. **Vi står på noget der er målt.** Deres eget dokument: *«Bygger I fladen selv
   mod API'et, står I på noget der er målt.»* Widgeten er uprovet i drift.

Derfor skal vi **ikke** bruge det widget-token de tilbød, bundet til et origin.
Vi skal bruge **tenant-API-nøglen**, server-side.

## De to indgange

### 1. Formularen

En almindelig supportformular. Skal kunne **udbygges** — felterne i dag er det
mindste der duer, ikke den endelige form.

Husets regel gælder: **ingen mailto-links**. En knap der åbner brugerens
mailprogram gør ingenting på en arbejds-pc uden et, og den besøgende tror hun
har rakt ud mens vi aldrig ser det.

### 2. Aidan triagerer

Aidan svarer som i dag. Kan han ikke hjælpe — eller beder den besøgende om et
menneske — opretter han en sag og siger referencen højt.

**Triage er ikke det samme som at give op.** Aidan skal kunne oprette sagen MED
samtalen som krop, så mennesket i den anden ende ikke starter forfra.

## Kontrakten, kort — det der styrer designet

Alt herunder er **deres** krav, læst i `docs/API.md` i broberg-ai/helpdesk.

| | |
|---|---|
| base | `https://api.helpdesk.broberg.ai` |
| tenant | `broberg-ai` |
| auth | `Authorization: Bearer hd_live_…` — server-side, aldrig i JS |
| opret sag | `POST /v1/tenants/broberg-ai/tickets` |
| bekræftelse | `GET`/`POST /v1/resolutions` — **åbne ruter, ingen nøgle** |

**`intakeKey` er ikke valgfri for os.** Samme nøgle igen giver samme sag med
`created: false`. Uden den bliver hvert genkald en ny sag — og et genkald er
normal drift, ikke en fejl.

**Bekræftelsessiden skal ligge på VORES domæne, og knappen må aldrig ligge i en
mail.** Outlook og andre scannere forklikker links. Lå knappen i mailen, ville
vi registrere løsninger ingen bruger har bekræftet — og tallet ville ligne
succes mens det var forkert.

**Opslaget på `GET /v1/resolutions/{token}` bruger IKKE tokenet.** Gjorde det
det, ville en side der bare renderes forbruge bekræftelsen, og brugeren ville
møde «linket er allerede brugt» på sit første klik.

**`skipped`, ikke `ok`.** På mail-ruten betyder `ok: true` at kaldet lykkedes —
ikke at mailen blev sendt. `id: null` præcis når intet blev sendt.

## Ship dark — og den éne ting der ikke må være «ship dark»

Trail-mønstret: uden nøgle springes opslaget over, og Aidan kører videre. Det er
rigtigt for en **vidensbase** — et manglende opslag gør svaret fattigere.

**Det er forkert for en henvendelse.** Fejler sagsoprettelsen, må den besøgendes
ord ikke forsvinde. Uden nøgle, eller ved en fejl hos dem, skal formularen
falde tilbage til noget der stadig når et menneske — og sige det ærligt.

Det er forskellen på en manglende forstærkning og et tabt menneske.

## Hvad der IKKE er bygget hos dem — vi skal vide det før vi lover noget

| mangler | konsekvens for os |
|---|---|
| **Vedhæftninger** | Ingen rute til et skærmbillede. I support er det normen. |
| **Indgående mail** | De sender ud, læser ikke ind. Alt skal oprettes via API'et. |
| **Værktøjskald** | De kan forklare hvordan; de kan ikke gøre det. |
| **Widget i drift** | Nul kunder kører den. Vi bygger derfor selv. |

Og: **en mailadresse en besøgende taster er et HINT, ikke en modtager.** De
sender ikke til en adresse nogen bare har skrevet. Vi kan altså ikke love en
kvittering pr. mail til en anonym bruger.

## Fire beslutninger der er CHRISTIANS, ikke mine

HelpDesk beder om dem, og de kan ikke udledes af kode:

1. **`slaMinutes`** — hvor længe må en sag ligge før et menneske skal se den?
2. **Uden for åbningstid** — eskalerer vi straks, eller venter timeren?
3. **`guardrailTopics`** — hvad må Aidan aldrig svare på?
4. **Hvor lander eskaleringen?** Hvilken adresse, og hvem læser den?

Indtil de er svaret, kører vi med de mest forsigtige værdier og siger det.

## Non-goals

- **Ikke deres widget.** Vi bygger fladen selv.
- **Ikke @broberg/chat.** Christian: «vi kigger på at skifte til /chat senere».
  Aidan bliver hvor han er; det her lægger en udgang til ham.
- **Ingen flytning af prompt/tone til deres backend.** Det er en rigtig
  migrering (systemprompten står i vores kildekode) og hører til et andet kort.
- **Ingen vedhæftninger.** Ruten findes ikke hos dem.

## Reuse

- **HelpDesk API** — deres `docs/API.md` er kontrakten; vi skriver ingen egen
  klient-abstraktion ud over det tynde lag `src/helpdesk.ts`, samme facon som
  Trail-opslaget i `src/aidan.ts`.
- **@broberg/ai-sdk** — al AI går allerede gennem den. Triage tilføjer ikke en
  ny udbyder.
- **@broberg/mail** — røres ikke: HelpDesk ejer udgående mail på en sag, og
  deres afsenderdomæne (`send.broberg.ai`) er allerede sat op med spf/dkim/dmarc.
- Discovery-tjek på «support» / «ticket»: ingen `@broberg/*`-pakke dækker det —
  HelpDesk **er** flådens svar på den kapacitet.
