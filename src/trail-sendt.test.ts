/* Spærren der forhindrer at samme side sendes til Trail igen og igen.
 *
 * Målt af trail-sessionen 5/9-2026: 39 artikler lå som 90 sider i KB'en,
 * Aidan-historien 5 gange. Årsagen på VORES side: vi sendte altid og regnede
 * med at modtageren afviste dubletten. */
import { expect, test, beforeEach } from "bun:test";
import { erAlleredeSendt, noterSendt, hash, _nulstilSendtLog } from "./trail-sendt.ts";

const URL_A = "https://broberg.ai/bag-om/aidan-historien";
const MD_A = "# Aidan\n\nKilde: " + URL_A + "\n\nEn artikel om Aidan.\n";

beforeEach(() => _nulstilSendtLog());

test("første gang: ikke sendt før", () => {
  expect(erAlleredeSendt(URL_A, MD_A)).toBe(false);
});

test("samme side, samme indhold, fem gange → sendes ÉN gang", () => {
  let afsendelser = 0;
  for (let i = 0; i < 5; i++) {
    if (!erAlleredeSendt(URL_A, MD_A)) {
      afsendelser++;
      noterSendt(URL_A, MD_A);
    }
  }
  expect(afsendelser).toBe(1);
});

test("ÆNDRET indhold slipper igennem — spærren må ikke fryse siden", () => {
  noterSendt(URL_A, MD_A);
  const rettet = MD_A.replace("En artikel om Aidan.", "En rettet artikel om Aidan.");
  expect(erAlleredeSendt(URL_A, rettet)).toBe(false);
});

test("to forskellige sider blandes ikke sammen", () => {
  noterSendt(URL_A, MD_A);
  expect(erAlleredeSendt("https://broberg.ai/indsigter/bi-dashboards-fra-bunden", MD_A)).toBe(false);
});

test("hashen er indholdet, ikke URL'en", () => {
  expect(hash(MD_A)).toBe(hash(MD_A));
  expect(hash(MD_A)).not.toBe(hash(MD_A + " "));
});
