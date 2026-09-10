// F020 — en sti der ikke findes skal SIGE det.
//
// Fejlen var ikke at 404-håndteringen manglede: to-segment-ruterne havde den
// allerede. Den var at de to SIDSTE ruter — ét-segment-fangerne — faldt tilbage
// på renderGenericPage(), som ikke slår noget op i cms. Den byggede en side af
// SELVE ADRESSEN og svarede 200, så «/findes-ikke-xyz» blev en side med
// overskriften «findes ikke xyz», klar til at blive indekseret.
//
// Porten her måler KILDEN. Den rigtige statuskode måles mod en kørende server
// (se F020.1's acceptkriterier) — en kildeprøve kan ikke svare på hvad HTTP gør.
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const read = (f: string) => readFileSync(new URL(`./${f}`, import.meta.url).pathname, "utf8");
const server = () => read("server.tsx");
/** server.tsx UDEN kommentarer. Kommentarerne CITERER det gamle mønster for at
 *  forklare hvad der stod — så en port der læser rå tekst fælder sin egen
 *  forklaring. (Det skete: første kørsel blev rød på ordet i en kommentar.) */
const serverKode = () =>
  server().replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const routes = () => read("routes.tsx");

test("porten måler den rigtige fil — ellers måler den ingenting", () => {
  const s = server();
  expect(s.length).toBeGreaterThan(5_000);
  expect(s).toContain('app.get("/:slug"');
  expect(s).toContain('app.get("/en/:slug"');
});

test("ingen af ét-segment-ruterne falder tilbage på pladsholderen", () => {
  const s = serverKode();
  // Præcis det mønster der bar fejlen: et `??` der gør en manglende side til
  // en 200. Begge sprog.
  expect(s).not.toMatch(/idx\s*\?\?\s*await\s+renderGenericPage/);
  expect(s).not.toMatch(/html\(\s*idx\s*\?\?/);
});

test("pladsholderen kaldes ikke længere fra nogen rute", () => {
  const kald = serverKode().match(/renderGenericPage\s*\(/g) ?? [];
  expect(kald).toEqual([]);
});

test("begge ét-segment-ruter svarer med render404 gennem notFound()", () => {
  const s = server();
  expect(s).toContain('return idx ? html(idx) : notFound(await render404("da", c.req.path));');
  expect(s).toContain('return idx ? html(idx) : notFound(await render404("en", c.req.path));');
});

test("notFound() sætter faktisk status 404 — ellers er resten teater", () => {
  // Den kontrol der gør de tre ovenfor til et resultat: hvis hjælperen
  // svarede 200, ville alle prøverne bestå på en fejl der stadig var der.
  expect(server()).toMatch(/const notFound = .*status:\s*404/s);
});

/** render404's egen krop — fra dens signatur til den NÆSTE eksport.
 *  Et afstands-mål ville være skrøbeligt: min første udgave gættede 3000 tegn
 *  hvor der var 3881, og den ville have brækket igen hver gang funktionen
 *  voksede. Grænsen er nu strukturel i stedet for numerisk. */
function render404Krop(): string {
  const r = routes();
  const start = r.indexOf("export async function render404");
  expect(start).toBeGreaterThan(-1);
  const næste = r.indexOf("\nexport ", start + 1);
  return r.slice(start, næste === -1 ? undefined : næste);
}

test("404-siden er noindex — en rigtig statuskode alene flytter kun problemet halvvejs", () => {
  expect(render404Krop()).toContain("noindex: true");
  expect(read("render/html.tsx")).toContain('<meta name="robots" content="noindex, follow" />');
});

test("KONTROL: en almindelig side er IKKE noindex", () => {
  // Uden denne ville en <head> der altid satte noindex bestå prøven ovenfor —
  // og hele sitet ville forsvinde ud af Google.
  const r = routes();
  const tak = r.slice(r.indexOf("export async function renderThanks"));
  expect(tak.slice(0, tak.indexOf("\nexport "))).not.toContain("noindex");
  expect(read("render/html.tsx")).toContain("meta.noindex ?");
});

test("teksterne læses fra cms, ikke kun fra koden", () => {
  const r = routes();
  // Hvert felt skal hentes med g(...) — reserveteksten er nødbremsen, ikke hjemmet.
  for (const felt of [
    "nf_overskrift", "nf_under",
    "nf_airinaReplik", "nf_aidanReplik", "nf_cbReplik",
    "nf_airinaRolle", "nf_aidanRolle", "nf_cbRolle",
  ]) {
    expect(r).toContain(`g("${felt}"`);
  }
});

test("de tre figurer kommer fra de kanoniske kilder", () => {
  const r = routes();
  expect(r).toContain("AIDAN_STILL");
  expect(r).toContain("AIRINA_STILL");
  expect(r).toContain("/media/cb.webp");
});

test("siden har testid'er så Lens kan finde den", () => {
  const r = routes();
  expect(r).toContain('data-testid="ikke-fundet-trio"');
  expect(r).toContain('data-testid="ikke-fundet-forsiden"');
  expect(r).toContain('data-testid="ikke-fundet-artikler"');
});

// ── F020.2 — Aidan taler ikke uopfordret om fejlsiden ────────────────────────
//
// Christian med skærmbillede: han stod som FIGUR på siden med sin egen replik,
// mens widgeten samtidig spurgte «Fortæl mig om «Siden findes ikke»».
// Sidetitel-forslaget er bygget til en artikel.
//
// Hans undtagelse er bygget ind frem for væk: han må gerne sige noget der
// UNDERSTØTTER budskabet. Siden lover at pege dig et sted hen hvor der står
// noget — det er dét han tilbyder.

test("widgeten kan gøres tavs, og tavs tømmer BEGGE de titel-drevne kilder", () => {
  const w = read("components/AidanWidget.tsx");
  // Kun den ene ville lukke halvdelen: forslaget ville tie, mens
  // kontekst-hilsnen stadig sagde sidens navn ved første åbning.
  expect(w).toContain('data-side-titel={tavs ? "" : (sideTitel ?? "")}');
  expect(w).toContain('data-hilsen-side={tavs ? "" : t.hilsenSide}');
});

test("404-siden slår den til", () => {
  expect(render404Krop()).toContain("aidanTavs: true");
});

test("KONTROL: en almindelig side er IKKE tavs", () => {
  // Uden denne ville en widget der ALTID tier bestå prøven ovenfor — og Aidan
  // ville holde op med at tale på hele sitet uden at nogen prøve blev rød.
  const r = routes();
  const tak = r.slice(r.indexOf("export async function renderThanks"));
  expect(tak.slice(0, tak.indexOf("\nexport "))).not.toContain("aidanTavs");
});

test("undtagelsen er bygget ind: han siger noget der passer, i stedet for intet", () => {
  const k = render404Krop();
  expect(k).toContain('g("nf_aidanBoble"');
  expect(k).toContain('g("nf_aidanPills"');
  // Og teksten kommer fra cms — reserveteksten er nødbremsen.
  expect(k).toContain("Skal jeg finde en der findes?");
});

test("en fast boble VINDER over det sti-baserede valg", () => {
  // Fejlsiden har ingen fast sti at skrive en sti-regel for.
  const e = read("client/enhance.ts");
  expect(e).toMatch(/bobleFast[\s\S]{0,200}?return;/);
});
