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

// ── F007.13: markør-protokollen (resultat-tilstande 3-20). Hver markør har en
// FORM-test og en ESCAPE-test: ondsindet indhold i felterne må aldrig nå DOM'en
// som HTML. Escape-først-princippet er hele sikkerhedsmodellen.
describe("F007.13 markører", () => {
  test("[case:] → kort med monogram, titel og pil", () => {
    const h = aidanTilHtml("[case:/cases/sanne-andersen|Sanne Andersen|Booking på 14 dage]");
    expect(h).toContain('class="aidan-case"');
    expect(h).toContain('href="/cases/sanne-andersen"');
    expect(h).toContain("<b>Sanne Andersen</b>");
    expect(h).toContain("SA");
  });
  test("[case:] med scriptet titel er ufarlig", () => {
    const h = aidanTilHtml('[case:/x|<script>alert(1)</script>|y]');
    expect(h).not.toContain("<script>");
  });
  test("[case:] afviser ekstern/skæv sti", () => {
    expect(aidanTilHtml("[case:https://ondt.dk|T|x]")).not.toContain("aidan-case");
  });
  test("markdown-tabel → <table>, skillerække droppes", () => {
    const h = aidanTilHtml("| Ting | Pris |\n|---|---|\n| Byg | 0 kr |");
    expect(h).toContain("<table>");
    expect(h).toContain("<th>Ting</th>");
    expect(h).toContain("<td>0 kr</td>");
    expect(h).not.toContain("---");
  });
  test("[graf:] → sparkline; under 2 tal renderes intet", () => {
    expect(aidanTilHtml("[graf:1, 5, 3, 8]")).toContain("aidan-graf");
    expect(aidanTilHtml("[graf:7]")).not.toContain("aidan-graf");
  });
  test("[kilder:] → kun relative stier kommer med", () => {
    const h = aidanTilHtml("[kilder:/indsigter/x|Indsigten;https://ondt.dk|Ond]");
    expect(h).toContain('href="/indsigter/x"');
    expect(h).not.toContain("ondt.dk");
  });
  test("[tider], [status], [fejr] → tomme værts-elementer klienten fylder", () => {
    expect(aidanTilHtml("[tider]")).toContain("aidan-tider");
    expect(aidanTilHtml("[status]")).toContain("aidan-status");
    expect(aidanTilHtml("[fejr]")).toContain("aidan-fejr");
  });
  test("[vis:] → knap med data-anker, escaped", () => {
    const h = aidanTilHtml('[vis:Dine data i EU]');
    expect(h).toContain('data-anker="Dine data i EU"');
    expect(aidanTilHtml('[vis:"><img onerror=x>]')).not.toContain("<img");
  });
  test("[valg:] → chips, loft på 4, kræver mindst 2", () => {
    const h = aidanTilHtml("[valg:Website|Interne værktøjer]");
    expect(h.match(/<button/g)?.length).toBe(2);
    expect(aidanTilHtml("[valg:Kun én]")).not.toContain("aidan-valg");
    expect(aidanTilHtml("[valg:a|b|c|d|e|f]").match(/<button/g)?.length).toBe(4);
  });
  test("[video:] tager KUN /uploads/*.mp4", () => {
    expect(aidanTilHtml("[video:/uploads/trail-90s.mp4]")).toContain("aidan-video");
    expect(aidanTilHtml("[video:https://ondt.dk/x.mp4]")).not.toContain("aidan-video");
    expect(aidanTilHtml("[video:/etc/passwd]")).not.toContain("aidan-video");
  });
  test("[sprog:] → skjult skifte-node, kun da/en", () => {
    expect(aidanTilHtml("[sprog:en]")).toContain('data-sprog="en"');
    expect(aidanTilHtml("[sprog:tysk]")).not.toContain("data-sprog");
  });
  test("markør-linje sluges ikke af et afsnit", () => {
    const h = aidanTilHtml("Se casen her:\n[case:/cases/x|X|y]");
    expect(h).toContain("aidan-case");
    expect(h).not.toContain("[case:");
  });
});
