import { describe, test as it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renTrailTekst } from "@/aidan.ts";

/**
 * F013.3 — Aidan fik 7 % af sin egen vidensbase.
 *
 * MÅLT 9/9-2026: opslaget leverede 337 tegn for en Neuron på 4.441.
 *
 * ÅRSAGEN er husets fejlform i sin reneste form. Koden læste
 * `d.highlight ?? d.content`. Søge-API'et returnerer ALDRIG et content-felt —
 * så den læste altid highlight. Indtil samme dag VAR highlight hele
 * dokumentet, så vi fik artiklen ad en vej der aldrig havde lovet den.
 * Trail rettede highlight til et 40-tokens uddrag (deres F265.3, berettiget:
 * ét opslag kostede en agent ~3.770 tokens), og vi faldt til 7 % — uden at
 * noget gik synligt i stykker. Et svar blev bare tyndere.
 *
 * Trail-sessionen meldte selv regressionen. Det er værd at holde fast i:
 * fejlen blev fundet fordi en ANDEN part sagde til, ikke fordi vores egen
 * måling fangede den. Prøverne her er den måling vi manglede.
 */
const kilde = readFileSync(join(import.meta.dir, "aidan.ts"), "utf8");
const kode = kilde.split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");

describe("opslaget henter artiklen, ikke uddraget", () => {
  it("beder om indholdet i SELVE søgekaldet", () => {
    // trails F265.8 gav os includeContent=true, så artiklen kommer med i ét
    // kald. Uden flaget findes content-nøglen slet ikke i svaret — det er ikke
    // content:null, den er der bare ikke. Falder flaget ud af URL'en, læser vi
    // igen et uddrag uden at noget går i stykker synligt.
    expect(kode, "flaget mangler — så får vi kun uddraget igen").toContain("includeContent=true");
  });

  it("loftet er pr. ARTIKEL, ikke pr. plads i rangeringen", () => {
    // Målt: på «Hvordan eskalerer en sag til et menneske?» lå HelpDesk-artiklen
    // nr. 6 og fik 289 tegn, mens et CV lå nr. 3 og fik 1.631. En plads-baseret
    // afklipning stoler på en rangering vi ved er upålidelig (trail-F265.2).
    expect(kode, "plads-baseret afklipning er tilbage").not.toContain("TRAIL_HENT_TOP");
    expect(kode).toContain("TRAIL_MAKS_TEGN");
    // FORANKRET I trailOpslag, ikke i filen. Første udgave tog den første linje
    // i HELE filen der lignede — og pegede på en anden funktion, da sidekontekst
    // senere fik sin egen `const tekst =`. En vagt der matcher på form frem for
    // på sted flytter sig af sig selv.
    const _f = kode.slice(kode.indexOf("export async function trailOpslag"));
    const linje = _f.slice(0, _f.indexOf("\n}")).split("\n").find((l) => /^\s*const tekst =/.test(l)) ?? "";
    expect(linje, "loftet må ikke afhænge af pladsen").not.toContain("?");
  });

  it("degraderer til uddraget hvis hentningen fejler — aldrig til ingenting", () => {
    // Det er hele forskellen på en forstærkning og en afhængighed.
    //
    // Assertionen står på SELVE tildelingen af `tekst`, ikke på om ordparret
    // «fuld || uddrag» findes et sted i nærheden: første udgave gjorde det
    // sidste og overlevede en mutation der fjernede fald-tilbagen, fordi den
    // samme frase også står i linjen der udleder kilden. En vagt der matcher
    // på naboskab i stedet for på linjen er ikke en vagt.
    // FORANKRET I trailOpslag, ikke i filen. Første udgave tog den første linje
    // i HELE filen der lignede — og pegede på en anden funktion, da sidekontekst
    // senere fik sin egen `const tekst =`. En vagt der matcher på form frem for
    // på sted flytter sig af sig selv.
    const _f = kode.slice(kode.indexOf("export async function trailOpslag"));
    const linje = _f.slice(0, _f.indexOf("\n}")).split("\n").find((l) => /^\s*const tekst =/.test(l)) ?? "";
    expect(linje, "tildelingen af tekst findes ikke").not.toBe("");
    expect(linje, "fald-tilbage til uddraget er væk").toContain("fuld || uddrag");
  });

});

describe("teksten renses før modellen ser den", () => {
  it("frontmatter fjernes", () => {
    const ud = renTrailTekst("---\ntitle: HelpDesk\ntags: [a]\n---\n# HelpDesk\nRigtig prosa.");
    expect(ud).not.toContain("title:");
    expect(ud).toContain("Rigtig prosa.");
  });

  it("Trails claim-ankre fjernes", () => {
    expect(renTrailTekst("Support {#claim-9f4d1073} som infrastruktur")).toBe("Support som infrastruktur");
  });

  it("HTML-entiteter foldes ud — ellers læser modellen &quot; som tekst", () => {
    expect(renTrailTekst("Han sagde &quot;nej&quot; &amp; gik")).toBe('Han sagde "nej" & gik');
  });

  it("POSITIV KONTROL: ren prosa røres ikke", () => {
    // Uden denne ville en renTrailTekst der returnerer tom streng bestå alt ovenfor.
    expect(renTrailTekst("HelpDesk er support som infrastruktur.")).toBe(
      "HelpDesk er support som infrastruktur.",
    );
  });

  it("tåler tomt og skrald uden at kaste", () => {
    for (const x of ["", null, undefined, 42]) expect(renTrailTekst(x as unknown as string)).toBe(
      x === 42 ? "42" : "",
    );
  });
});

/**
 * F013.4 — dublet-spærren sagde NEJ om sider der ligger i KB'en.
 *
 * Samme feltskift, anden konsekvens: `trailHarSide` søgte efter «Kilde: <url>»
 * i `content ?? highlight`. Da highlight blev et uddrag, forsvandt markøren, og
 * spærren begyndte at melde enhver side fraværende — altså gen-upload ved hver
 * udgivelse. Målt på /flagskibe/helpdesk, som FINDES i KB'en.
 */
const clip = readFileSync(join(import.meta.dir, "trail-clip.ts"), "utf8");
const clipKode = clip.split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");

describe("dublet-spærren matcher på filnavn", () => {
  it("bruger filename, ikke tekstindholdet", () => {
    const i = clipKode.indexOf("export async function trailHarSide");
    const krop = clipKode.slice(i, clipKode.indexOf("\n}", i));
    expect(krop, "spærren læser stadig i et søgeuddrag").not.toContain("highlight");
    expect(krop).toContain("trailFilnavn(sourceUrl)");
    expect(krop).toContain("d.filename");
  });
});

/**
 * F013.5 — et opslag der aldrig når frem må ikke ligne et der intet fandt.
 *
 * MÅLT 9/9-2026: Trails søgning svinger 2,3-21 sekunder. Med vores grænse
 * tidsudløber en del af opslagene, `catch` returnerer "", og Aidan svarer uden
 * vidensbase. Svaret ser fuldstændig normalt ud. Vi opdagede det kun ved at
 * måle med fejlen synlig — og fandt det aldrig i månederne inden.
 */
describe("opslagets udfald er talt, ikke gættet", () => {
  it("tælleren skelner tomt svar fra fejlet opslag", () => {
    expect(kode).toContain("trailTaeller.tomme++");
    expect(kode).toContain("trailTaeller.fejl++");
    expect(kode, "et opslag der aldrig blev forsøgt ville ellers tælle som en succes")
      .toContain("trailTaeller.forsoeg++");
  });

  it("health-ruten udstiller tallet", () => {
    const i = kode.indexOf("export function handleAidanHealth");
    expect(i).toBeGreaterThan(-1);
    expect(kode.slice(i, i + 420)).toContain("trailTaeller");
  });

  it("tidsgrænsen er en navngivet konstant, ikke et tal i en linje", () => {
    expect(kode).toContain("TRAIL_TIMEOUT_MS");
  });
});
