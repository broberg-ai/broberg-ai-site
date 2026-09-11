# F019 — Teksten lyser med mens den læses op

> **Christian 10/9-2026**, med to skærmbilleder fra medium.com:
> *«De har en oplæser der viser teksten highlighted mens den læser op. Lavet af
> speechify.com — men DU kan sagtens lave det samme. Du kender teksten, du kender
> content, lyden er lavet i forvejen … På broberg.ai — ikke i Aidan, men et sted
> i toppen af en side.»*
>
> **Status: kortet er skrevet mens konteksten var frisk, på hans opfordring.
> Ikke bestilt arbejde endnu.**

## Hvad skærmbillederne faktisk viser

To lag, ikke ét — og forskellen bærer hele designet:

| lag | udseende | hvor præcis skal den være |
|---|---|---|
| **sætningen** der læses nu | svag baggrund over hele linjen | eksakt |
| **ordet** der lyder nu | kraftigere baggrund | «tæt nok» |

Plus en flydende afspiller nederst til højre: `0:03 / 8:55`, forrige · pause ·
næste, `1.0×`, stemmevalg. Siden ruller med, så den aktive sætning bliver i syne.

## Målt før planen — og det ændrer opgaven

**1. Vores TTS giver ikke tidsstempler.**

```ts
tts(input: TtsInput): Promise<PodcastResult>
interface PodcastResult { audio: Uint8Array; mimeType: string; usage: Usage; }
```

Der er ingen `marks`, ingen `wordBoundaries`, ingen `alignment`. Christians
antagelse om at transskriptet «nemt kan laves» holder — men ikke ad den vej man
ville gå først.

**2. Vi deler allerede teksten op ved sætningsgrænser.**

`src/aidan-laes-opdeling.ts` gør det, fordi udbyderen har et tegnloft. Dens egen
prøve hedder *«INTET går tabt — teksten kan sys sammen igen»*.

### Derfor: tidslinjen er et biprodukt, ikke et projekt

Vi genererer lyden **stykvis i forvejen**. Måler vi hvert stykkes varighed i det
øjeblik det laves, har vi sætnings-tidsstemplerne — **eksakt, gratis, og uden en
eneste ny afhængighed**. Ingen forced alignment, ingen ekstra tjeneste, ingen
gætteri på den del der skal være præcis.

Det er den billigste udgave af featuren, og den er kun mulig fordi opdelingen
allerede findes. Havde vi genereret ét stykke lyd for hele artiklen, var dette
kort et helt andet og meget dyrere stykke arbejde.

## Ord-niveau er den ærlige undtagelse

Inden for en sætning har vi **ingen måling**. Ordet kan estimeres ved at fordele
sætningens varighed efter ordlængde. Det driver øjet fremad og ser rigtigt ud.

**Det skal stå i koden som et estimat, ikke som et tidsstempel.** Et felt der
hedder `startMs` og er gættet, bliver læst som målt af den næste — og så bygger
nogen noget ovenpå der kræver præcision. Navngiv det `anslaaetStartMs`, eller
læg ordene i en `estimat`-blok adskilt fra sætningens `maalt`-blok.

**Alternativet, hvis ord-niveau viser sig at være for skævt:** drop det. Ét lag
der er rigtigt slår to lag hvor det ene halter. Sætnings-highlight er det Medium
faktisk giver værdi med — den kraftige ordmarkering er pynt ovenpå.

## Ikke-mål

- **Ikke i Aidan.** Christian er eksplicit. Det er en læse-hjælp på artiklen, ikke
  en samtale-funktion.
- **Ingen browser-TTS** (`speechSynthesis`). Den lyder som en robot, den har ikke
  vores stemme, og den ville gøre lyden maskin-afhængig. Vi har allerede rigtig
  lyd.
- **Ingen ny udbyder.** Hvis noget mangler i `@broberg/ai-sdk`, filér det hos
  `ai-sdk` frem for at gå udenom — husets regel, og en TTS med ord-tidsstempler
  ville gavne hele flåden.
- **Ingen genberegning i browseren.** Tidslinjen laves når lyden laves, én gang,
  og gemmes ved siden af filen.

## Faser

**1 — Tidslinjen falder ud af noget vi allerede gør (½ dag).**
Når `aidan-laes.ts` genererer stykkerne, mål hvert stykkes varighed og skriv en
`{ tekst, startMs, sluttMs }[]` ved siden af lydfilen. Prøv at summen af
varigheder er lig hele filens længde — den kontrol er det der gør tidslinjen til
en måling frem for en påstand.

**2 — Afspilleren og markeringen (1 dag).**
Knap i toppen af artiklen. Flydende afspiller. `timeupdate` → find den aktive
sætning → markér. Rul med, men **kun når brugeren ikke selv har rullet** — en
side der river sig løs under fingeren er værre end ingen markering.

**3 — Ord-estimatet (½ dag, valgfrit).**
Kun hvis fase 2 står. Se afsnittet ovenfor.

## 11/9-2026 — bestilt, og vejen er fundet

**Christian: «gå i gang med F019».** Kortet er ikke længere et forslag.

### Azure KAN give ord-tidskoder, og det er én boolean

Verificeret i Microsofts egen dokumentation for **Batch synthesis**, citeret
ordret frem for husket:

> **`properties.wordBoundaryEnabled`** — *«Determines whether to generate word
> boundary data. This optional bool value is "false" by default. If word
> boundary data is requested, then a corresponding `[nnnn].word.json` file is
> included in the results data ZIP file.»*

Det er REST (`/texttospeech/batchsyntheses/`, api-version 2024-04-01) — ingen
Speech-SDK-afhængighed. Der findes en søskende, `sentenceBoundaryEnabled`, som
dækker det ANDET lag i tabellen ovenfor: sætningen skal være eksakt, ordet skal
bare være tæt nok.

**Det felt hele featuren hænger på er ikke tiden, men TEKST-offsettet** —
koblingen tilbage til vores eget manuskript. Uden den skal vi selv gætte hvilket
ord i teksten der svarer til hvilken lyd, og en gætning dér drifter usynligt i
starten og er grotesk efter fem minutter. Det er den ene ting der er spurgt om
og endnu ikke bekræftet.

### To sidegevinster, og de er ikke teoretiske

1. **Den lange artikel holder op med at vælte.** F018.10 målte på produktionen:
   8.447 tegn → 200 på 21 s; **10.764 tegn → 500 efter 5 s**, som en lukket
   socket. Derfor deler `delTale()` artiklen i stykker og syr MP3'erne sammen.
   Batch tager 2 MB og over ti minutters lyd i ét stykke.
2. **`concatenateResult: true` giver ÉT lydspor og ÉT sæt ord-grænser.** Vores
   nuværende stykning ville ellers give offsets pr. stykke, som nogen skal
   re-basere — præcis det regnestykke der ser rigtigt ud og er 40 ms forkert til
   sidst.

**Prisen, stillet op ærligt:** batch er asynkron (Microsoft opgiver 10–20 s for
50 %, op til 120 s for 95 %). For os er det uden betydning, fordi lyden allerede
tager ~21 s og cachelagres pr. indholds-hash — det er en engangsomkostning pr.
tekstversion, ikke pr. lytter.

### Afsendt, ikke bygget udenom

Capability-request sendt til **ai-sdk-sessionen** med målingen og et forslag til
form (`wordTimings: true` → valgfrit `words[]`). Vi kunne have kaldt Azures
batch-API direkte herfra — det ville virke i dag og være nøjagtig den
rå-provider-integration reuse-reglen findes for. Det er ikke gjort.

**Næste skridt afhænger af deres svar:** enten venter vi på pakken og bygger
UI-laget imens, eller vi prototyper målingen her og afleverer den til dem.

## Åbne spørgsmål

- ~~**Findes lyden allerede for alle artikler, eller laves den on-demand?**~~
  **BESVARET 11/9, og Christian bekræftede designet med sine egne ord:**
  *«første gang i bruger afspiller en side så genereres den OG GEMMES — næste
  gang så er filen HOT — ændrer jeg siden ja så bliver den nødt til at lave en ny
  TTS men FØRST når nogen requester den.»*

  Målt i koden: cache-nøglen er `laesCacheNoegle(tale, stemme:ordbog)`, altså en
  hash af selve TEKSTEN. En rettet artikel kan derfor aldrig servere forældet
  lyd — den gamle fil bliver liggende under en nøgle ingen spørger efter.

  **Forvarmning blev bygget og rullet tilbage samme time.** Jeg tilføjede et
  debouncet kald på indholds-webhooken, og Christian beskrev derefter den
  oprindelige plan, som er den modsatte: lyden laves først når nogen beder om
  den. Konsekvensen for tidskoderne er den samme — de skal gemmes SAMMEN med
  lydfilen, under samme indholds-hash, så de to aldrig kan komme i utakt.
  To filer med hver sin livscyklus ville være den tavse fejl her.
- **Hvor i toppen?** Christian sagde «et sted i toppen af en side». En knap ved
  forfatter/læsetid-linjen er det Medium gør, og den plads findes allerede på
  vores artikler.
- **Tilgængelighed:** markeringen må ikke være den eneste indikation.
  `aria-current` på den aktive sætning, og kontrasten skal holde 4,5:1 — vi har
  allerede dumpet én gang i dag på præcis det (F013.3, hvid tekst gav 3,45:1).
