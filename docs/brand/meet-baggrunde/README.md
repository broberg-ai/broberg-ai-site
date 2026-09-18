# Google Meet-baggrunde

Færdige baggrunde til Christians videomøder, og **kilden de er bygget af**.
Kilden er det vigtige: skal teksten skiftes, bygges de om på et minut frem for
at starte forfra.

```
en-the-edge.png     1920×1080 · «AI solutions that give you the edge.»
da-forspring.png    1920×1080 · «AI-løsninger, der giver dig et forspring.»
zone-kontrol.png    IKKE en baggrund — viser hvor der er plads
```

## Byg dem om

```bash
cd docs/brand/meet-baggrunde && python3 -m http.server 4321
# så, via Lens (ikke rå Playwright — husets regel):
#   lens_capture({ project:"broberg-ai-site",
#                  url:"http://127.0.0.1:4321/en-the-edge.html",
#                  mode:"viewport", viewport:{width:1920,height:1080} })
```

Teksten står i de to HTML-filer, typografien i `base.css`.

## De fire målinger layoutet hviler på

Alle fire er MÅLT, ikke skønnet — og de tre første blev fundet ved at rette en
fejl, ikke ved at planlægge.

**1 · Typografien er sitets egen.** Aflæst på broberg.ai/en med
`getComputedStyle`, ikke fra CSS-filen:

```
spalte   580px
eyebrow  DM Sans 11px/17.6 w600 ls1.98px
h1       Cormorant Garamond 76px/80.56 w500 ls-0.76px   ← IKKE DM Sans
lead     DM Sans 18px/31.5 w400
```

Blokken her er smallere end 580px, så alle tre er skaleret med SAMME faktor.
Forholdet 11 : 76 : 18 er det der skal holde — ikke de absolutte tal.

Farverne er den ene bevidste afvigelse: sitet måltes i lyst tema (næsten sort
overskrift), og baggrunden er mørk, så tekstfarverne er sitets MØRKE-tema-tokens.

**2 · MEET KLIPPER 10,7 % AF I HVER SIDE.** Den dyreste måling, og den blev
først fundet da en gæst så skærmen: underoverskriften løb ud over kanten.
Regnet baglæns med logoet som fast punkt — det står i filen på 67 % og vistes i
gæstens ramme på 71,6 %:

```
0,716 = (0,67 − c) / (1 − 2c)   →   c = 0,1065
```

Sikker zone: **x 10,7 % – 89,3 %**. Alt uden for den findes ikke for modtageren.

FORBEHOLD: målt i ÉT vindue. Beskæringen følger vinduets form, så et smallere
Meet-vindue klipper mere. Ryger teksten ud igen, er det her tallet skal måles om.

**3 · Person-zonen er ikke et rektangel.** Hovedet er smalt foroven, skuldrene
brede forneden. Et enkelt rektangel gjorde zonen unødigt lille og skubbede
teksten ud i det der bliver klippet bort:

```
hoved     x 36–64 %   y 15–73 %
skuldre   x 23–77 %   y 60–100 %
```

**4 · Meets egen krom.** Navneskilt øverst til venstre (x 0–20 %, y 4–12 %),
knapper nederst (y 85–100 %).

Tilbage bliver ét brugbart felt: **x 64,5–88,5 %, y 15–60 %.** Det er hele
grunden til at teksten er mindre end på sitet.

## Spejlvendingen — vend dem ALDRIG

Din egen selvvisning i Meet er spejlvendt, baggrunden med, så teksten står
bagvendt for dig selv. **De andre ser den rigtigt.** Verificeret 18/9 ved at
lade en gæst se skærmen fra et inkognitovindue.

Vender man filen for at «rette» det, bliver den bagvendt for alle andre end én.

## Hvad der ikke kunne holdes

Overskriftens linjeskift. I den smalle spalte brækker den til tre linjer frem
for Christians to. Alternativet var en skriftstørrelse hvor eyebrow'en blev
ulæselig.
