/**
 * Inline-editorens kilde må ALDRIG lande i vidensbasen.
 *
 * Rapporteret af trail-sessionen 6/9-2026: artiklen stod to gange i Trail, og
 * imellem den rigtige tekst lå rester som `">` og `cardmem</a>.`. Målt på det
 * levende site bagefter: siden RENDERER korrekt — hver sætning står én gang for
 * en læser. Den anden kopi er `data-cms-slice`, en attribut på 2.988 tegn der
 * bærer afsnittets markdown så inline-editoren kan gemme netop det afsnit.
 *
 * To ting gik galt, og den anden er den lumske:
 *   1. Attributten er en KOPI af teksten → artiklen blev sendt dobbelt.
 *   2. Værdien indeholder «>» (lovligt i en attributværdi). Tag-fjerneren var
 *      `<[^>]+>`, som stopper ved det FØRSTE «>» — også når det står inde i en
 *      attribut. Resten af de 2.988 tegn lækkede så ud som brødtekst.
 *
 * Fejl 2 er ikke bundet til data-cms-slice: ENHVER attribut med et «>» ville
 * gøre det samme. Derfor prøver den negative kontrol nedenfor en helt anden
 * attribut.
 */
import { describe, it, expect } from "bun:test";
import { tilTekst } from "@/trail-clip.ts";

describe("tilTekst — data-cms-slice hører ikke til i KB'en", () => {
  it("sender ikke afsnittets markdown-kilde med", () => {
    const md = "Dette er kildens markdown og maa ALDRIG ud.";
    const html = `<main><p data-cms-slice="${md}">Dette er den synlige tekst.</p></main>`;
    const ud = tilTekst(html);
    expect(ud).toBe("Dette er den synlige tekst.");
    expect(ud).not.toContain("ALDRIG");
  });

  it("lækker ikke resten af en attribut der indeholder «>»", () => {
    // Selve fejlen: uden en citat-bevidst tag-fjerner stoppede mønstret ved det
    // «>» der står INDE i attributten, og alt efter det blev til brødtekst.
    const md = "et citat > med en pil -> og mere tekst der lakkede ud";
    const html = `<main><p data-cms-slice="${md}">Synlig.</p></main>`;
    const ud = tilTekst(html);
    expect(ud).toBe("Synlig.");
    expect(ud).not.toContain("lakkede ud");
    expect(ud).not.toContain('">');
  });

  it("lækker heller ikke fra en HELT ANDEN attribut med «>»", () => {
    // Negativ kontrol for den generelle fejl: den må ikke kun være lappet for
    // det ene attributnavn vi kendte til.
    const html = `<main><p title="a > b" data-x="c > d">Synlig.</p></main>`;
    expect(tilTekst(html)).toBe("Synlig.");
  });

  it("rører ikke en almindelig artikel uden slice", () => {
    // Uden denne kunne rettelsen «virke» ved at æde for meget.
    const html = `<main><h2>Overskrift</h2><p>Et afsnit med <b>fed</b> tekst.</p></main>`;
    const ud = tilTekst(html);
    expect(ud).toContain("## Overskrift");
    expect(ud).toContain("Et afsnit med fed tekst.");
  });

  it("beholder links som markdown", () => {
    const html = `<main><p>Se <a href="/flagskibe/lens">Lens</a> her.</p></main>`;
    expect(tilTekst(html)).toContain("[Lens](/flagskibe/lens)");
  });

  it("POSITIV KONTROL fra drift: ankeret der udløste hændelsen 6/9 kl. 19.19", () => {
    // Ikke opdigtet. Præcis den form artiklen fik da den blev omskrevet — trail
    // har hændelsen med tidsstempel (optaget 19.21, 5.770 bytes, artiklen
    // dubleret), og indtil 17.55 var udtrækket rent UDEN at nogen regel var
    // rigtig: der fandtes bare intet anker i slicen endnu. Fælden lå latent
    // hele dagen og blev udløst af én sætning.
    //
    // Målt på den rigtige side med og uden beskyttelsen:
    //   med  3.659 tegn · afsnittet 1 gang · ingen rester
    //   uden 5.707 tegn · afsnittet 2 gange · «cardmem</a>» midt i teksten
    const slice =
      "Han orkestrerer 15+ AI agenter via " +
      '<a href=&quot;/flagskibe/cardmem&quot; data-cms-ref=&quot;platforms:cardmem&quot; ' +
      'data-cms-ref-label=&quot;auto&quot;>cardmem&lt;/a>.\n\n## Hvad der er anderledes\n\nVi bygger ikke hurtigere.';
    const html = `<div class="richtext" data-cms-slice="${slice}"><p>Den synlige tekst.</p></div>`;
    const ud = tilTekst(html);
    expect(ud).toBe("Den synlige tekst.");
    expect(ud).not.toContain("cardmem</a>");
    expect(ud).not.toContain("Hvad der er anderledes");
  });
});
