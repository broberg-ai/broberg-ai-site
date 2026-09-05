# F008 — Featured Articles + side-værktøjer i inline-edit-FAB

## Motivation
Ejer-bestilling (Christian 5/9-2026): udvalgte nyheder ELLER almindelige sider skal kunne fremhæves som «Featured» på tværs af sitet, og redaktøren skal kunne gøre det direkte fra siden (inline-edit), uden at åbne CMS-admin.

## Scope

### 1. Featured-markering (data)
- Et `featured`-flag (+ evt. `featuredOrder`) på posts OG pages. Bor i CMS-dokumentet — aldrig i kode.
- Gælder både nyheder og almindelige sider.

### 2. Tre visnings-flader — ejeren vælger via mockups (status: afventer approve)
Tre SELVSTÆNDIGE mockups i cardmem Mockups, én pr. flade:
- **A. Top-menupunkt i Indsigter** — featured-artikler løftet øverst i Indsigter-menuen/-oversigten med markering.
- **B. Tyndt farvet banner/bånd** lige under hovedmenuen — roterer/viser aktuelle featured articles.
- **C. Featured-boks på forsiden** — sektion placeret LIGE FØR «De fleste hjemmesider dør stille.»
Den/de godkendte mockups promoveres til build-kort (Plan & Build).

### 3. Inline-edit: side-FAB med værktøjer (pakke-arbejde, @broberg/cms-inline-edit)
Når redigering er åben på en side: en FAB med værktøjer der vedrører DENNE side:
- Værktøj 1: «Gør denne side Featured» (toggle, skriver featured-flaget via edit-session).
- Værktøj 2: tags på siden direkte fra FAB'en (tilføj/fjern) uden at åbne CMS.
- **Placering (ejerkrav):** på broberg.ai bor Aidan i HØJRE side — FAB'en må ikke flyde ind under Aidan; enten vises den OVER Aidan-laget, eller også videreudvikles Rediger/Log ud-pillen i VENSTRE side (den er allerede en form for FAB) til at bære værktøjerne. Mockups viser venstre-varianten (udbygget pill), da højre side er optaget.
- Kræver formentlig: editSession-allowlist-udvidelse i cms-admin proxy (featured/tags-skrivning) — samme sikkerhedsmønster som F164.2 (allowlisten ER grænsen, forseglet med test).

## Reuse
- `@broberg/cms-inline-edit` (egen pakke) udvides — ingen ny pakke.
- Featured-flaget er et alm. CMS-felt; ingen ny infrastruktur. Ingen raw provider-integrationer.

## Første indhold
BI-dashboard-artiklen (bi-dashboards-fra-bunden / bi-dashboards-from-scratch, skrevet 5/9) er tiltænkt som første featured article.

## Rollout
1. Mockups A/B/C → ejer-approve (denne fase).
2. Godkendt(e) flade(r) promoveres til stories med AC (Plan & Build).
3. Featured-flag + visningsflade(r) på broberg-ai-site; FAB-værktøjer i cms-inline-edit + allowlist i cms-admin.
4. Lens-verifikation af alle nye flader; testid-konvention overholdes.

## Åbne spørgsmål
- Skal banneret (B) rotere ved flere featured, eller vise nyeste?
- Maks. antal featured ad gangen?
- FAB-placering: over Aidan (højre) vs udbygget Rediger-pill (venstre) — mockups viser venstre, ejeren afgør.
