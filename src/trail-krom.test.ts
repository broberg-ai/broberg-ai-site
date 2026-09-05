/* En artikels tekst i vidensbasen skal være ARTIKLEN — ikke sidens krom.
 *
 * HÆNDELSEN, 5.-6. september 2026: featured-båndet stod i den tekst hver
 * artikel blev sendt med, og båndet viser ANDRE siders titler. Da 50
 * dokumenter fik featuredText i en backfill, ændrede båndet sig ved hver
 * skrivning — så ALLE artikler fik ny tekst og blev sendt igen. Målt af
 * trail-sessionen: 39 artikler lå som 90 sider, Aidan-historien 5 gange.
 * Dubletterne var kompileret på forskellige tidspunkter, så en søgning kunne
 * give tre forskellige svar på samme spørgsmål.
 *
 * Christian: «En artikel skal sendes til trail 1 og kun 1 fucking gang.»
 *
 * NB: prøve-siden har med vilje INTET <main>. Målt på den levende side 6/9:
 * broberg.ai renderer ikke <main>, så tilTekst's main-udtræk gør ingenting og
 * HELE siden bliver til tekst. Første udgave af denne prøve HAVDE et <main>,
 * og så fjernede main-udtrækket båndet af sig selv — prøven var grøn uden
 * spærren og beviste ingenting. Mutationstesten fangede det.
 */
import { expect, test } from "bun:test";
import { tilTekst } from "./trail-clip.ts";

const SIDE = `<!doctype html><html><body>
<header><nav>Menu</nav></header>
<div class="f-baand" data-testid="featured-baand">
  <span class="f-maerke">★ FEATURED</span>
  <a data-testid="featured-baand-titel" href="/x">EN HELT ANDEN ARTIKEL</a>
  <a class="f-laes" href="/x">Læs →</a>
</div>
<article>
  <h1>Artiklens egen titel</h1>
  <p>Artiklens egen brødtekst som skal i vidensbasen.</p>
</article>
<section class="f-sektion" data-testid="featured-boks">
  <h2>ENDNU EN ANDEN ARTIKEL</h2>
  <p>Som heller ikke er denne artikel.</p>
</section>
<footer>Fod</footer></body></html>`;

test("andre siders titler når ALDRIG ud i artiklens tekst", () => {
  const t = tilTekst(SIDE);
  expect(t).not.toContain("EN HELT ANDEN ARTIKEL");
  expect(t).not.toContain("ENDNU EN ANDEN ARTIKEL");
  expect(t).not.toContain("★ FEATURED");
});

test("artiklens EGET indhold overlever — spærren må ikke tømme siden", () => {
  const t = tilTekst(SIDE);
  expect(t).toContain("Artiklens egen titel");
  expect(t).toContain("Artiklens egen brødtekst");
});

test("teksten er UÆNDRET når kun krommet skifter — det er hele pointen", () => {
  const medAndetBaand = SIDE
    .replace("EN HELT ANDEN ARTIKEL", "ET TREDJE EMNE")
    .replace("ENDNU EN ANDEN ARTIKEL", "ET FJERDE EMNE");
  expect(tilTekst(medAndetBaand)).toBe(tilTekst(SIDE));
});

test("teksten ÆNDRER sig når artiklen selv rettes", () => {
  // Modprøve: en spærre der fryser artiklen ville være lige så slem.
  const rettet = SIDE.replace("Artiklens egen brødtekst", "Artiklens RETTEDE brødtekst");
  expect(tilTekst(rettet)).not.toBe(tilTekst(SIDE));
});
