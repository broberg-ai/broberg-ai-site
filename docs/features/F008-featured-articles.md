# F008 — Featured Articles + side-værktøjer i inline-edit-FAB

**Status: ALLE TRE mockups godkendt 5/9 (A 01a0711a-194a · B 01a0711a-2a64 · C 01a0711a-3d61) — elementer fra alle tre bygges.** Ejerens noter, ordret:

- **A:** «Her skal vi kun have et enkelt menupunkt der har stjernen og Featured, der viser en liste af alle Featured artikler og pages.»
- **B:** «Fra dette oplæg går vi med Featured banneret der kan vise flere features pages/news der skifter ... Læs knappen skal være en knap - ikke tekst links.»
- **C:** «Fra denne kan jeg rigtigt godt lide den store Featured sektion - det ville kræve nogle ekstra felter i CMS så du husker det, da den tekst bør være anderledes end det vi har til at stå i artiklen [...] En ide er at du gennemløber ALLE sider på sitet på DA/EN og genererer en featured tekst så vi backfiller på eksisterende og fremadrettet ved vi at det er et nødvendigt felt når en ny artikel/side oprettes. Så er de alle klar til at blive "Promoted." Sideværktøjer skal blot have et Tools lucide icon, brug wrench. I pop up skal der kun stå stjerne og Featured og i Tags skal der ikke stå de eksisterende men blot et + og en micro form hvor der kan skrives flere opdelt med komma (,).»

## Datamodel (F008.1)
- `featured: boolean` + `featuredText: string` (kort salgstekst, ANDEN end excerpt) på posts + pages, begge locales. Bor i CMS-dokumentet.
- **Backfill:** script gennemløber ALLE dokumenter (da+en) og AI-genererer featuredText via @broberg/ai-sdk (cheap-tier, EU) hvor feltet mangler — så alt er klar til «Promoted». Fremadrettet er feltet obligatorisk ved oprettelse.

## Fladerne
- **F008.2 — Bånd (B):** tyndt bånd under hovedmenuen på ALLE sider; roterer mellem alle featured; «Læs»-KNAP (ikke tekstlink); forsvinder når intet er featured.
- **F008.3 — Forside-boks (C):** stor sektion LIGE FØR «De fleste hjemmesider dør stille» med featuredText, ★-mærke og CTA-knap.
- **F008.4 — Menupunkt + listeside (A):** ét menupunkt «★ Featured» → /featured (da+en) med alle featured artikler+sider.
- **F008.5 — FAB-værktøjer (cms-inline-edit + cms-admin):** i redigering: wrench-ikon «Tools»; popup med KUN «★ Featured»-toggle; Tags-værktøj viser IKKE eksisterende — kun «+» og mikro-form med komma-separerede nye tags. Skrivning via editSession → allowlist-udvidelse i proxy.ts forsegles med test (F164.2-mønstret). Placering: venstre-pillen udbygges — kolliderer aldrig med Aidan i højre.

## Reuse
@broberg/ai-sdk (backfill), @broberg/cms-inline-edit (egen pakke, udvides), lucide (wrench). Ingen nye pakker.

## Verifikation
Felter skrevet + genlæst (streng lighed); backfill rapporterer antal; Lens på bånd/boks/listeside (da+en); allowlist-testen udvidet; testids på alt interaktivt.
