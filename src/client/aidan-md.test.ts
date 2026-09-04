/* Segl for Aidans svar-rendering. Første test ER Christians screenshot 4/9:
   flåde-listen med **fed** stod rå i panelet. */
import { describe, test, expect } from "bun:test";
import { aidanTilHtml, escHtml } from "./aidan-md.ts";

describe("hændelsen fra screenshottet", () => {
  test("punktliste med fed renderes som <ul> med <strong>, ingen rå stjerner", () => {
    const svar =
      "Hele processen kører på vores egne flagskibe:\n\n" +
      "- **cardmem** skriver og vedligeholder planen.\n" +
      "- **buddy** holder øje med kvaliteten i hvert trin.\n" +
      "- **Lens** åbner hver ændring i en browser og gemmer beviset.";
    const html = aidanTilHtml(svar);
    expect(html).toContain("<ul><li><strong>cardmem</strong>");
    expect(html).toContain("<strong>buddy</strong>");
    expect(html).not.toContain("**");
    expect(html).not.toContain("- <strong>"); // markøren er væk, ikke bare pakket ind
  });
});

describe("formerne", () => {
  test("afsnit + fed + kursiv + link", () => {
    const html = aidanTilHtml("Se **cases** her: [Cases](/cases).\n\nDet er *hurtigt*.");
    expect(html).toBe(
      '<p>Se <strong>cases</strong> her: <a href="/cases">Cases</a>.</p><p>Det er <em>hurtigt</em>.</p>',
    );
  });

  test("nummereret liste", () => {
    const html = aidanTilHtml("1. Første\n2. Anden");
    expect(html).toBe("<ol><li>Første</li><li>Anden</li></ol>");
  });

  test("en linje der STARTER med '- ' er et punkt — også efter en indledningslinje", () => {
    // Ændret 4/9 efter Christians screenshot: den gamle alt-eller-intet-regel
    // lod «Det indeholder:\n- x» stå som rå tekst. En bindestreg MIDT i en
    // sætning rammes stadig aldrig (reglen kræver linjestart).
    const html = aidanTilHtml("Vi bygger alt selv\n- og det kan ses.");
    expect(html).toContain("<p>Vi bygger alt selv</p>");
    expect(html).toContain("<ul><li>og det kan ses.</li></ul>");
    expect(aidanTilHtml("alt selv - og det kan ses")).not.toContain("<ul>");
  });

  test("kun relative og https-links slipper igennem", () => {
    expect(aidanTilHtml("[x](javascript:alert(1))")).not.toContain("<a");
    expect(aidanTilHtml("[x](http://usikker.dk)")).not.toContain("<a");
    expect(aidanTilHtml("[x](/cases)")).toContain('href="/cases"');
    expect(aidanTilHtml("[x](https://broberg.ai/)")).toContain('href="https://broberg.ai/"');
  });
});

describe("sikkerheden — HTML fra modellen når aldrig DOM'en", () => {
  test("script-tags og attributter escapes, også inde i lister og fed", () => {
    const html = aidanTilHtml('- **<script>alert(1)</script>**\n- <img src=x onerror=y>');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;");
  });

  test("escHtml dækker de fire farlige tegn", () => {
    expect(escHtml('<a b="c">&')).toBe("&lt;a b=&quot;c&quot;&gt;&amp;");
  });
});

describe("handlings-knapper (Eir-mønstret)", () => {
  test("[knap:…] renderes som knap med klasse + testid, kun relative/https-mål", () => {
    const html = aidanTilHtml("Vil du videre? [knap:Tal det igennem med Christian](/#kontakt)");
    expect(html).toContain('class="aidan-cta"');
    expect(html).toContain('data-testid="aidan-cta"');
    expect(html).toContain('href="/#kontakt"');
    expect(html).toContain(">Tal det igennem med Christian</a>");
    expect(aidanTilHtml("[knap:x](javascript:alert(1))")).not.toContain("aidan-cta");
  });
  test("loft på 2: tredje knap degraderer til almindeligt link", () => {
    const html = aidanTilHtml("[knap:En](/a) [knap:To](/b) [knap:Tre](/c)");
    expect(html.split('class="aidan-cta"').length - 1).toBe(2);
    expect(html).toContain('<a href="/c">Tre</a>');
  });
  test("et almindeligt link bliver ALDRIG til en knap", () => {
    expect(aidanTilHtml("Se [casen](/cases).")).not.toContain("aidan-cta");
  });
  test("sætningstegn lige efter en knap sluges — intet ensomt «.» under knappen (E2E-screenshot 4/9)", () => {
    const html = aidanTilHtml("Læs mere eller [knap:Tal med Christian](/kontakt).");
    expect(html).toContain(">Tal med Christian</a>");
    expect(html).not.toContain("</a>.");
    // Degraderet knap (over loftet) er et rent inline-link — dér hører punktummet med.
    const tre = aidanTilHtml("[knap:En](/a) [knap:To](/b) [knap:Tre](/c).");
    expect(tre).toContain('<a href="/c">Tre</a>.');
  });
});

describe("skillelinjer (E2E-screenshot 4/9 aften)", () => {
  test("--- på egen linje bliver en tynd <hr>, aldrig rå bindestreger", () => {
    const html = aidanTilHtml("FLAGSKIBE\n---\n9. contracts");
    expect(html).toContain('<hr class="aidan-hr">');
    expect(html).not.toContain("---");
  });
  test("en tankestreg midt i en sætning er stadig bare tekst", () => {
    expect(aidanTilHtml("cases — ét ad gangen")).not.toContain("<hr");
  });
});

describe("fremad-tolerance — gamle faner må aldrig se maskineri", () => {
  test("et UKENDT fremtidigt token renderes som rent link uden præfiks", () => {
    const html = aidanTilHtml("Se her: [kort:Læs casen](/cases)");
    expect(html).toContain('<a href="/cases">Læs casen</a>');
    expect(html).not.toContain("kort:");
  });
  test("[Knap:…] med stort K virker også som knap", () => {
    expect(aidanTilHtml("[Knap:Book](/kontakt)")).toContain('class="aidan-cta"');
  });
  test("prosa med kolon i link-tekst klippes IKKE (store bogstaver/lange ord)", () => {
    expect(aidanTilHtml("[NB: vigtigt](/x)")).toContain(">NB: vigtigt</a>");
    expect(aidanTilHtml("[Sådan bygger vi: metoden](/metode)")).toContain(">Sådan bygger vi: metoden</a>");
  });
});

describe("Christians screenshot 4/9 kl. 21 — rå markdown i svaret", () => {
  test("PRÆCIS den fejlende tekst renderes rent: liste efter indledning, fed med * i, kode-backticks", () => {
    const svar =
      "Det indeholder:\n" +
      "- **20+ `@broberg/*`-pakker** (fx `@broberg/ui`, `@broberg/auth`) — genbrugsklar kode.\n" +
      "- **UI-komponenter** (knapper, formularer) — designet til at passe sammen.";
    const html = aidanTilHtml(svar);
    expect(html).toContain("<p>Det indeholder:</p>");
    expect(html).toContain("<ul><li>");
    expect(html).toContain("<strong>20+ <code>@broberg/*</code>-pakker</strong>");
    expect(html).toContain("<code>@broberg/ui</code>");
    expect(html).not.toContain("**");
    expect(html).not.toContain("`");
    expect(html).not.toContain("- <strong>");
  });
  test("### overskrift bliver en fremhævet linje", () => {
    expect(aidanTilHtml("### Flagskibene\nDe bærer alt.")).toContain('<strong class="aidan-h">Flagskibene</strong>');
  });
  test("kode-indhold røres ALDRIG af fed/kursiv-regler", () => {
    expect(aidanTilHtml("`**ikke fed**`")).toContain("<code>**ikke fed**</code>");
  });
});
