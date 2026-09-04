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

  test("en enkelt tankestreg midt i prosa bliver IKKE til en liste", () => {
    const html = aidanTilHtml("Vi bygger alt selv\n- og det kan ses.");
    expect(html).toContain("<p>");
    expect(html).not.toContain("<ul>");
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
