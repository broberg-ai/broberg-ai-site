# F012 — broberg.ai podcast: to værter, én artikel pr. afsnit, hver 14. dag

**Bestilt af:** Christian, 7. september 2026 · **Status:** oplæg

## Kort

Hver anden uge udkommer et afsnit hvor to værter taler sig igennem én af vores
artikler. Ikke en oplæsning — en samtale, hvor den ene forklarer og den anden
spørger på lytterens vegne.

## Det vigtigste fund: motoren findes allerede

Christian huskede en open source-pakke (podcastfy) og troede vi måske havde
prøvet noget med ai-sdk. Målt før noget blev planlagt:

**`ai.podcast()` er en førsteklasses funktion i `@broberg/ai-sdk`.**

```ts
ai.podcast({ script: [{ speaker: "vært1", text: "…" }, …], voices: {…} })
  → { audio, mimeType, usage }
```

Den kalder ElevenLabs' `text-to-dialogue` (`eleven_v3`) — en ægte
samtale-motor, ikke separate klip sat sammen. Turtagning, afbrydelser og
rytme kommer fra modellen. Det er den svære halvdel af en NotebookLM-agtig
podcast, og den er bygget og betalt for.

### Hvorfor ikke podcastfy

| | podcastfy | `ai.podcast` |
|---|---|---|
| Runtime | Python 3.11 + FFmpeg | vores egen stack |
| Dansk | ikke dokumenteret | 5 danske stemmer i rosteret |
| Samtale | TTS pr. replik, sammensat | ægte dialog-endpoint |
| Omkostning | ingen sporing | pr. kald, automatisk |
| Stemme-vagt | nej | `checkVoice` fejler hørbart hvis en stemme dør |

Podcastfy ville tilføje en Python-runtime for at gøre noget vi kan i forvejen,
og uden husets omkostnings- og stemme-vagter. **Afvist.**

## Målte tal

| | |
|---|---|
| ElevenLabs (dialog) | **$0,15 / 1.000 tegn** |
| Azure (én stemme) | $0,0167 / 1.000 tegn — **9× billigere, men kan IKKE dialog** |
| Et 12-min afsnit | ~10.000 tegn ≈ **$1,50** |
| 26 afsnit/år | **≈ $39** |
| Manuskript (`ai.chat`) | brøkdele af en cent pr. afsnit |

Azure er udelukket for dette formål: kun ElevenLabs implementerer `dialogue()`.
Det er derfor podcasten koster mere pr. minut end vores oplæsning — en bevidst
og billig afvejning ved 39 dollars om året.

## Arkitektur

```
artikel (CMS)
   │
   ├─ 1. MANUSKRIPT   ai.chat → [{speaker, text}] · gemmes i CMS som et dokument
   │                  (redigerbart FØR indspilning — se «Christian klipper»)
   ├─ 2. LYD          ai.podcast → én mp3 · gemmes på volumen, nøglet på
   │                  (manuskript + stemmer), så en rettelse = ny fil
   ├─ 3. SIDE         /podcast og /podcast/<slug> — afspiller + fuldt manuskript
   └─ 4. FEED         /podcast/feed.xml — RSS med <enclosure>, så Apple/Spotify
                      kan abonnere
```

### Manuskriptet er et CMS-dokument, ikke et mellemresultat

Den bærende beslutning. Et genereret manuskript der går direkte i studiet er
et afsnit ingen har læst. Manuskriptet lander som et dokument Christian kan
åbne, rette og godkende — og lyden laves først derefter.

Det giver også: manuskriptet ER undertekster (tilgængelighed), det er
søgbart, og det kan læses af en der ikke vil lytte.

### Stemmerne

To værter med hver sin rolle, ikke to der siger det samme:

- **Aidan** — forklarer. Samme identitet som sitets AI-guide, så lytteren
  møder et navn han kender.
- **Airina** — spørger på lytterens vegne. Hun må afbryde og bede om et
  eksempel når det bliver for abstrakt.

Rollerne står i manuskript-prompten, ikke i lyden — så de kan justeres uden
en udrulning.

De danske ElevenLabs-stemmer i rosteret i dag: `soren`, `jesper`, `mads`,
`noam`, `camilla`. Valget er Christians og træffes på en prøve-episode, ikke
på et navn.

## Kendte forhindringer, målt frem for opdaget senere

1. **ElevenLabs afviser IPA.** Adapteren kaster hvis en udtale-række bruger
   `ipa` — kun `alias` virker der. Vores ordbog har 6 IPA-rækker (`native`,
   `workflows`, `engineering`, `agentic`, `harness`, `lens`). Podcasten skal
   derfor bruge en alias-only udgave af ordbogen, eller de seks skal skrives
   om som lyd-alias. **Ikke løst — første tekniske opgave.**

2. **Bindestregs-hullet** (rettet 7/9 for oplæsningen) gælder også her:
   tale-teksten skal igennem samme `tilTale`-behandling, ellers siges
   «AI-agenter» forkert i podcasten også. Genbrug funktionen, kopiér den ikke.

3. **Længden.** ElevenLabs' dialog-endpoint har en grænse pr. kald. Et langt
   afsnit skal deles og sættes sammen — det er ikke målt endnu.

## Rullelag

- **F012.1** Manuskript-generator: artikel → `[{speaker,text}]` → CMS-dokument
- **F012.2** Studiet: godkendt manuskript → `ai.podcast` → mp3 på volumen
- **F012.3** Siderne: `/podcast` + afsnitsside med afspiller og manuskript
- **F012.4** RSS-feed så det kan abonneres i en rigtig podcast-app
- **F012.5** Hver 14. dag automatisk (cronjobs.webhouse.net vækker en agent
  der foreslår næste artikel — Christian godkender manuskriptet)

Første afsnit foreslås at være «AI'en byggede det på en eftermiddag» — den er
ny, den har en holdning, og den handler om noget to mennesker kan være
uenige om.

## Non-goals

- Video. En podcast er lyd.
- Engelsk udgave i første omgang. Manuskriptet er allerede tosproget i CMS;
  en engelsk stemmebesætning er en selvstændig beslutning.
- Live/uklippet. Hvert afsnit passerer et menneske.
