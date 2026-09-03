# Mail-assets — stien er en KONTRAKT, ikke en almindelig fil

**Flyt aldrig filen her. Omdøb den aldrig. Hash aldrig filnavnet.**

En mail lever i en indbakke i årevis og henter sit billede **hver gang den
åbnes**. Flyttes filen, går mærket i stykker i hver eneste mail vi nogensinde
har sendt — bagudvirkende, hos modtageren, uden at nogen hos os får en fejl.
Det er den modsatte afvejning af resten af `public/`, hvor cache-busting er en
dyd.

Skal mærket se anderledes ud: **udskift filens indhold på samme sti.**

| Fil | Kilde | Størrelse |
|---|---|---|
| `broberg-ai-maerke.png` | `public/favicon.svg` | 480×480 |

**2× med vilje** — vises på 56 px i mailen, så den ikke er sløret på en telefon.
SVG'en er kilden; PNG'en er en afledning, så en ændring af mærket starter i
SVG'en og renderes herned.

## Krav der SKAL holdes

- **Offentlig uden auth.** Mailklienter henter anonymt gennem en proxy (Gmail
  cacher via googleusercontent). Bag login = tom firkant hos modtageren.
- **Ingen hotlink-beskyttelse / Referer-tjek.** Der er ingen referer på et hent
  fra en mailklient.
- **Content-type `image/png`.**

## Hvorfor PNG og ikke SVG

SVG er dårligt understøttet i mailklienter, og `data:`-URI'er strippes af flere
af dem. Mærket har mørk bund og lys glyf, så det bærer både et lyst og et mørkt
mailkort — prøvet på begge.

## Hvem læser adressen

`emailLogoUrl` i sitets CMS-config (webhouse.app → Indstillinger → Email).
Er feltet tomt, sendes mailen **uden** mærke — med vilje: et hul hvor logoet
skulle stå er værre end intet logo.
