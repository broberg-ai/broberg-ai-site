/* Segl for oplæsningen (F007.7) — den rene logik: tale-rensning + cache-nøgle. */
import { describe, test, expect } from "bun:test";
import { tilTale, laesCacheNoegle, udtaleFor, ordbogNoegle } from "./aidan-laes.ts";

describe("tilTale — det man gider høre", () => {
  test("links læses som deres tekst, aldrig URL'en", () => {
    const t = tilTale("Læs [hele casen](/cases/sanne) her.");
    expect(t).toBe("Læs hele casen her.");
    expect(t).not.toContain("/cases");
  });
  test("markdown-markører siges ikke højt", () => {
    const t = tilTale("# Overskrift\n\n- punkt et\n- punkt to\n\n**fed** og `kode`");
    expect(t).not.toContain("#");
    expect(t).not.toContain("- ");
    expect(t).not.toContain("*");
    expect(t).not.toContain("`");
    expect(t).toContain("Overskrift");
    expect(t).toContain("punkt et");
    expect(t).toContain("fed og kode");
  });
  test("loftet klipper meget lange artikler", () => {
    expect(tilTale("x".repeat(20_000)).length).toBe(12_000);
  });
});

describe("udtale-ordbogen (ai-sdk 0.39.0 pronunciations — Christians formål 5/9)", () => {
  test("teksten forvanskes IKKE længere — udtalen bor i pronunciations-feltet", () => {
    // PRINCIPPET STÅR, MEN ER INDSNÆVRET 7/9: udtalen bor stadig i
    // pronunciations-feltet, og tale-teksten omskrives ALDRIG for at ændre
    // hvordan et ord LYDER. Den ene undtagelse er bindestregen — og den er der
    // fordi ordbogen beviseligt ikke kan nå forbi den (ai-sdk matcher
    // `(?<![\w-])ord(?![\w-])`), ikke fordi vi foretrak en tekst-omskrivning.
    // Sikkert netop her: `tale` har ét kaldested og går udelukkende til
    // ai().tts — den når aldrig et menneske som tekst (mailen sender lydfilen).
    expect(tilTale("vores AI-assistent på broberg.ai")).toBe("vores AI assistent på broberg.ai");
    // Domænet er urørt — det er ordbogens arbejde, ikke tekstens.
    expect(tilTale("vores AI-assistent på broberg.ai")).toContain("broberg.ai");
    // Små bogstaver er ikke en forkortelse: «ai-native» er ét ord, ikke A I.
    expect(tilTale("en ai-native webhook")).toBe("en ai-native webhook");
  });
  test("udtaleFor: dansk får lydreglerne, engelsk får kun de fælles", () => {
    const da = udtaleFor("da");
    expect(da).toContainEqual({ word: "native", ipa: "ˈneɪtɪv" });
    expect(da).toContainEqual({ word: "AI", alias: "A I" });
    // Engelsk virker out-of-the-box (Christian 5/9): domæner, AI og webhook
    // er KUN danske regler — Andrew/Ava siger dem rigtigt selv.
    const en = udtaleFor("en");
    expect(en.find((r) => r.word === "native")).toBeUndefined();
    expect(en.find((r) => r.word === "broberg.ai")).toBeUndefined();
    expect(en.find((r) => r.word === "AI")).toBeUndefined();
    expect(en.find((r) => r.word === "webhook")).toBeUndefined();
  });
  test("en forkortelse foran en bindestreg når ordbogen — «AI-agenter» blev aldrig rørt", () => {
    // ai-sdk'ens substitution er `(?<![\w-])(ord)(?![\w-])` — et hele-ord-match
    // der udtrykkeligt afviser en bindestreg efter. Målt 7/9: 60+ forekomster i
    // vores danske artikler stod uden for ordbogens rækkevidde, «AI-agenter» 13
    // gange alene. Bindestregen fjernes derfor i tale-teksten, og så gør
    // ordbogen resten.
    expect(tilTale("15+ AI-agenter")).toBe("15+ AI agenter");
    expect(tilTale("en AI-native platform")).toBe("en AI native platform");
    expect(tilTale("ret HTML-filen")).toBe("ret HTML filen");
    // NEGATIVE KONTROLLER: kun foran et bogstav, og aldrig et ord vi ikke staver.
    expect(tilTale("AI-2 modellen")).toBe("AI-2 modellen");
    expect(tilTale("en fine-tuning af modellen")).toBe("en fine-tuning af modellen");
    expect(tilTale("SaaS-produktet")).toBe("SaaS-produktet");
  });
  test("forkortelser siges bogstav for bogstav — Jeppe læste «HTML» som ordet «HTLM»", () => {
    // Christian hørte den 7/9. Stemmen forsøger at udtale bogstavrækken som ét
    // ord og bytter om på dem der ikke danner en stavelse. Skrevet ud som
    // bogstaver kan det ikke ske.
    const da = udtaleFor("da");
    expect(da).toContainEqual({ word: "HTML", alias: "H T M L" });
    // Ikke kun HTML: samme form ramte hele familien, så de er taget med nu
    // frem for én ad gangen når han hører den næste.
    for (const w of ["CSS", "CMS", "API", "URL", "SEO", "GDPR", "SDK", "MCP", "PWA", "UI", "UX"]) {
      expect(da.find((r) => r.word === w)?.alias).toBe(w.split("").join(" "));
    }
    // SaaS er IKKE en bogstavrække — den udtales som et ord, og at stave den
    // ville gøre den værre. Den negative kontrol på reglen.
    expect(da).toContainEqual({ word: "SaaS", alias: "sas" });
    // Engelsk siger dem selv rigtigt; en dansk lydregel ville skade dem.
    const en = udtaleFor("en");
    expect(en.find((r) => r.word === "HTML")).toBeUndefined();
  });
  test("en ændret udtale giver en NY lyd-nøgle (ellers serverer lageret den gamle lyd for evigt)", () => {
    expect(ordbogNoegle("da")).toMatch(/^[0-9a-f]{8}$/);
    expect(ordbogNoegle("da")).not.toBe(ordbogNoegle("en")); // forskellige ordbøger → forskellige nøgler
  });
  test("bruttolisten (5/9): domæner som navne, bøjede låneord, www. siges aldrig", () => {
    expect(tilTale("Se www.trailmem.com her")).toBe("Se trailmem.com her");
    const da = udtaleFor("da");
    // matchInCompounds hører MED i den strenge sammenligning: bliver flaget
    // fjernet igen, skal denne prøve gå rød frem for at bestå på en delmængde.
    expect(da).toContainEqual({ word: "trailmem.com", alias: "trail mem punktum com", matchInCompounds: true });
    expect(da).toContainEqual({ word: "stylet", alias: "stajlet" });
    expect(da).toContainEqual({ word: "workflow", ipa: "ˈwɜːkfloʊ" });
    expect(da).toContainEqual({ word: "lens", ipa: "lɛnz" });
    // engelsk får domænerne men IKKE de danske bøjnings-lydord
    const en = udtaleFor("en");
    expect(en.find((r) => r.word === "stylet")).toBeUndefined();
    expect(en).toContainEqual({ word: "trailmem", alias: "trail mem" });
  });
  test("HTML-tags når ALDRIG stemmen — bæltet mod rå markup i felter (Christians fund 5/9)", () => {
    expect(tilTale("Grøn, <em>og alligevel i stykker</em>")).toBe("Grøn, og alligevel i stykker");
    expect(tilTale("tekst med <br> og <a href=\"/x\">link</a>")).toBe("tekst med og link");
  });
  test("[block:]-figurer og skillelinjer siges ikke", () => {
    const t = tilTale("Før.\n\n[block:min-figur]\n\n---\n\nEfter.");
    expect(t).not.toContain("block");
    expect(t).not.toContain("---");
    expect(t).toContain("Før.");
    expect(t).toContain("Efter.");
  });
});

describe("cache-nøglen", () => {
  test("samme tale+stemme = samme nøgle; ændret tale ELLER stemme = ny nøgle", () => {
    expect(laesCacheNoegle("abc", "jeppe")).toBe(laesCacheNoegle("abc", "jeppe"));
    expect(laesCacheNoegle("abc", "jeppe")).not.toBe(laesCacheNoegle("abd", "jeppe"));
    expect(laesCacheNoegle("abc", "jeppe")).not.toBe(laesCacheNoegle("abc", "christel"));
    expect(laesCacheNoegle("abc", "jeppe")).toMatch(/^[0-9a-f]{32}$/);
  });
});

/* ── domænerne siges også midt i et sammensat ord (11/9-2026) ────────────────
 *
 * Ordbogen springer som standard et ord over der står ved en bindestreg. Reglen
 * findes for at holde et kort almindeligt ord ude af en sammensætning («mail»
 * inde i «e-mail») — og den ramte 14 af 37 omtaler af vores EGET domæne.
 *
 * MÅLT, ikke valgt: begge udgaver blev genereret og transskriberet.
 *   uden flaget:  «…et brobjerg ejdrevet website»   ← domænet er væk
 *   med flaget:   «…et brobær. AI drevet website»   ← «A I» overlever
 */
describe("domæner udtales også i sammensætninger", () => {
  const domæner = ["broberg.ai", "trailmem.com", "webhouse.app", "xrt81.com", "fdsundhed.dk", "sanneandersen.dk"];

  test("hvert domæne bærer matchInCompounds", () => {
    const da = udtaleFor("da");
    for (const d of domæner) {
      expect(da.find((r) => r.word === d)?.matchInCompounds).toBe(true);
    }
  });

  test("KONTROL: de korte, almindelige ord gør IKKE", () => {
    // Uden denne ville «sæt flaget på alt» bestå prøven ovenfor — og så ville
    // «AI» blive stavet ud inde i «ai-sdk», hvor det er et pakkenavn.
    const da = udtaleFor("da");
    for (const w of ["AI", "CMS", "SDK", "UI"]) {
      expect(da.find((r) => r.word === w)?.matchInCompounds).toBeUndefined();
    }
  });

  test("et domæne UDEN alias ville være meningsløst — alle seks har et", () => {
    const da = udtaleFor("da");
    for (const d of domæner) expect(da.find((r) => r.word === d)?.alias).toBeTruthy();
  });
});
