import { describe, test as it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * F018.8 — samtykket skal beskrive det man faktisk siger ja til.
 *
 * Christian, 9/9-2026, med et skærmbillede af chat-formularen:
 *   «Jeg fik ikke en lydfil, den giver vist ikke helt mening, hvad skulle det
 *    være en lydfil af? Vores meget korte samtaler.»
 *
 * Formularen er delt mellem TRE ting: oplæsningen af en ARTIKEL (hvor der ER
 * en lydfil), et chat-SVAR, og et TRANSSKRIPT. Alle tre viste lyd-etiketten,
 * fordi den var den første der blev skrevet.
 *
 * Det er ikke kun en skæv formulering. Et samtykke er en aftale om HVAD man
 * modtager; står der «send mig lydfilen» og man får en tekst, er samtykket
 * afgivet på et forkert grundlag. Og fluebenet er samtidig et
 * markedsførings-samtykke, så det er den slags man skal kunne stå ved.
 *
 * Signalet fandtes allerede i koden — `last.sti` for lyd, `last.tekst` for
 * tekst — det blev bare ikke brugt.
 */
const kilde = readFileSync(join(import.meta.dir, "client/enhance.ts"), "utf8");
const widget = readFileSync(join(import.meta.dir, "components/AidanWidget.tsx"), "utf8");
const kode = (s: string) => s.split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");

describe("etiketten følger indholdet", () => {
  it("lyd og tekst har HVER sin etiket", () => {
    const k = kode(kilde);
    const i = k.indexOf("samtykke.append(");
    expect(i, "samtykke-etiketten sættes ikke").toBeGreaterThan(-1);
    const blok = k.slice(i, i + 260);
    expect(blok, "der vælges ikke mellem to etiketter").toContain("erLyd ? d.mailSamtykke : d.svarSamtykke");
  });

  it("valget træffes på om der ER en lydfil, ikke på et gæt", () => {
    const k = kode(kilde);
    expect(k).toContain('const erLyd = typeof last.sti === "string"');
  });

  it("teksten kommer fra CMS'et, ikke kun fra koden", () => {
    // Reservetekst er en nødbremse, ikke et hjem. Uden g(...) kan Christian
    // ikke rette et samtykke uden en udrulning.
    expect(kode(widget)).toContain('g("aidanSvarSamtykke"');
    expect(kode(widget)).toContain("data-svar-samtykke=");
  });

  it("NEGATIV KONTROL: lyd-etiketten findes stadig og nævner stadig lydfilen", () => {
    // Uden denne ville «fjern lyd-etiketten helt» bestå prøverne ovenfor — og
    // så ville ARTIKEL-oplæsningen, hvor der FAKTISK er en lydfil, miste sin
    // rigtige tekst.
    expect(kode(widget)).toContain('g("aidanMailSamtykke"');
    expect(widget).toMatch(/lydfilen/);
  });

  it("de to etiketter er ikke den samme streng", () => {
    const lyd = /g\("aidanMailSamtykke",[^)]*?:\s*"([^"]+)"/.exec(widget)?.[1] ?? "";
    const svar = /g\("aidanSvarSamtykke",[^)]*?:\s*"([^"]+)"/.exec(widget)?.[1] ?? "";
    expect(lyd, "lyd-etiketten blev ikke fundet").not.toBe("");
    expect(svar, "svar-etiketten blev ikke fundet").not.toBe("");
    expect(svar).not.toBe(lyd);
    expect(svar, "svar-etiketten lover stadig en lydfil").not.toMatch(/lydfil/);
  });
});
