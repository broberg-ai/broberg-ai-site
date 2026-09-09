import { describe, test as it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * F018.11 — lydafspilleren, og de to ting Christians skærmbillede afslørede.
 *
 * 9/9-2026 sendte han et billede af en knap der stod på «Henter oplæsningen…»
 * og aldrig kom videre: «Den gik kold - kom aldrig frem … husk at lave en
 * lækker lydafspiller inside Aidan også :)»
 *
 *  · INGEN TIDSGRÆNSE på hentningen. Svarede serveren aldrig, stod knappen
 *    sådan for evigt — der var ingen vej ud og ingen fejl at handle på.
 *  · ÉT STATISK ORD i op mod 30 sekunder (målt: 30,1 s for en artikel på
 *    10.764 tegn; 0,7 s når lyden findes). Det er ikke ventetid, det er en
 *    død skærm.
 *
 * Prøverne her holder på BEGGE dele — ikke kun på at der findes en afspiller.
 */
const kilde = readFileSync(join(import.meta.dir, "client/enhance.ts"), "utf8");
const css = readFileSync(join(import.meta.dir, "styles/brand.css"), "utf8");
const kode = kilde.split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
const krop = (() => {
  const i = kode.indexOf("const byggAfspiller =");
  return i < 0 ? "" : kode.slice(i, kode.indexOf("\n  };", i));
})();

describe("hentningen kan ikke hænge for evigt", () => {
  it("kaldet har en tidsgrænse", () => {
    expect(krop, "afspilleren findes ikke").not.toBe("");
    expect(krop, "ingen AbortController — knappen kan hænge igen").toContain("new AbortController()");
    expect(krop).toMatch(/setTimeout\(\(\) => ctl\.abort\(\), 90_000\)/);
    expect(krop, "signalet skal med i kaldet, ellers virker grænsen ikke").toContain("signal: ctl.signal");
  });

  it("en fejl giver en VEJ UD, ikke en blindgyde", () => {
    // Prøv-igen er hele forskellen på en fejl og en død knap.
    expect(krop).toContain("boks.replaceWith(byggAfspiller(boks, sti, d))");
    expect(krop, "fejlen skal kunne ses, ikke kun mærkes").toContain('boks.classList.add("fejl")');
  });

  it("BEGGE udgange rydder tidsgrænsen", () => {
    // En glemt clearTimeout ville afbryde en afspilning der allerede kørte.
    expect((krop.match(/clearTimeout\(frist\)/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });
});

describe("ventetiden er ærlig", () => {
  it("der er en synlig bevægelse mens der hentes", () => {
    expect(css).toContain(".aidan-afspiller.henter .aidan-spor");
    expect(css).toContain("@keyframes aidan-venter");
  });

  it("bevægelsen kan slås fra", () => {
    // En baggrund der bevæger sig og ikke kan stoppes er værre end ingen.
    const i = css.indexOf("@keyframes aidan-venter");
    expect(css.slice(i, i + 400)).toContain("prefers-reduced-motion");
  });
});

describe("afspilleren er en afspiller, ikke en knap", () => {
  it("tid og position kommer fra lyden selv, ikke fra et gæt", () => {
    expect(krop).toContain("a.currentTime");
    expect(krop).toContain("a.duration");
    expect(krop, "uden timeupdate står søjlen stille mens der spilles").toContain('a.addEventListener("timeupdate"');
  });

  it("man kan spole — og lyden følger med", () => {
    expect(krop).toContain('spor.addEventListener("input"');
    expect(krop).toMatch(/a\.currentTime = \(Number\(spor\.value\) \/ 100\) \* a\.duration/);
  });

  it("sporet er et rigtigt input, så tastatur og skærmlæser virker", () => {
    // Husreglen forbyder native UDSEENDE, ikke native semantik: appearance er
    // slået fra i CSS, men elementet er stadig et range-input.
    expect(krop).toContain('spor.type = "range"');
    expect(krop).toContain('spor.setAttribute("aria-label"');
    expect(css).toContain(".aidan-spor {");
    expect(css.slice(css.indexOf(".aidan-spor {"), css.indexOf(".aidan-spor {") + 200))
      .toContain("appearance: none");
  });

  it("hvert element har et testid, så Lens kan drive det", () => {
    for (const t of ["aidan-afspiller", "aidan-afspiller-knap", "aidan-afspiller-spor", "aidan-afspiller-tid", "aidan-afspiller-titel"]) {
      expect(krop, `mangler testid ${t}`).toContain(`"${t}"`);
    }
  });

  it("knappen bruger --paa-blaa, så teksten kan læses i lys tilstand", () => {
    // F011.2's lektie: en blå flade der bærer tekst har sit eget krav.
    const i = css.indexOf(".aidan-afspiller-knap {");
    expect(css.slice(i, i + 300)).toContain("color: var(--paa-blaa)");
  });
});

/**
 * F018.11.1 — en blokeret afspilning er ikke en hentefejl.
 *
 * MÅLT PÅ PRODUKTION 9/9-2026, på et skærmbillede fra selve afspilleren:
 * fejltilstanden sagde «Kunne ikke hente oplæsningen» — og viste samtidig
 * «0:00 / 6:15». Lyden VAR hentet, og dens længde var målt. Det der fejlede
 * var play(): en browser tillader kun afspilning i forlængelse af en
 * brugerhandling, og klikket lå 30 sekunder tilbage da hentningen var færdig.
 *
 * De to udfald ligner hinanden i koden og er modsatte for brugeren: den ene
 * betyder «prøv igen», den anden betyder «tryk på play». Fanget ved at LÆSE
 * skærmbilledet — tallet ved siden af fejlteksten modsagde den.
 */
describe("en blokeret afspilning er ikke en hentefejl", () => {
  it("play() har sin EGEN fejlhåndtering", () => {
    const i = krop.indexOf("await a.play()");
    expect(i, "play() kaldes ikke").toBeGreaterThan(-1);
    // Kaldet skal stå i sin egen try, ikke i den ydre der viser hentefejlen.
    expect(krop.slice(Math.max(0, i - 120), i), "play() ligger i den ydre try — en blokering ville melde hentefejl")
      .toContain("try {");
  });

  it("en blokeret afspilning efterlader en KLAR afspiller, ikke en fejl", () => {
    const i = krop.indexOf("await a.play()");
    const efter = krop.slice(i, i + 320);
    expect(efter, "der er ingen catch omkring play()").toContain("catch");
    expect(efter, "en blokering skal give play-ikonet tilbage").toContain('"\\u25B6"');
    expect(efter, "en blokering må ALDRIG kalde visFejl").not.toContain("visFejl");
  });
});
