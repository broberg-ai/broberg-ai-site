/**
 * Svarløftet under kontakt-knappen.
 *
 * Christian 11/9 valgte «Vi vender tilbage samme dag.» frem for at overbyde en
 * konkurrents «inden 2 timer». Et løfte der holder hver gang er mere værd end
 * et hurtigere der ikke gør.
 *
 * Den bærende prøve er den NEGATIVE: der må ALDRIG opstå et svarløfte fordi et
 * felt mangler. En reservetekst på et løfte er en påstand vi ikke har besluttet
 * at give — og den ville lande på hver eneste side med en kontaktblok uden at
 * nogen havde skrevet den.
 */
import { describe, it, expect } from "bun:test";
import { renderToString } from "preact-render-to-string";
import { Contact } from "@/components/sections.tsx";
import type { ContactData } from "@/content/types.ts";

const GRUND: ContactData = {
  eyebrow: "Kontakt",
  headingHtml: "Lad os bygge noget",
  lead: "En manchet.",
  email: "hej@broberg.ai",
  formHref: "/#kontakt",
  ctaLabel: "Skriv til os",
};

const render = (d: ContactData) => renderToString(Contact({ data: d }) as never);

describe("svarløftet", () => {
  it("KONTROL: uden feltet står der intet løfte — heller ikke en tom linje", () => {
    const h = render(GRUND);
    expect(h).not.toContain('data-testid="kontakt-svarloefte"');
    expect(h).not.toContain("cta-note");
    // og knappen er der stadig
    expect(h).toContain('data-testid="kontakt-cta-mail"');
    expect(h).toContain("Skriv til os");
  });

  it("KONTROL: en tom streng er også et fravær, ikke et tomt løfte", () => {
    // Det er hvad et cms-felt giver når nogen rydder det.
    expect(render({ ...GRUND, ctaNote: "" })).not.toContain('data-testid="kontakt-svarloefte"');
  });

  it("løftet vises ordret når det står i cms", () => {
    const h = render({ ...GRUND, ctaNote: "Vi vender tilbage samme dag." });
    expect(h).toContain('data-testid="kontakt-svarloefte"');
    expect(h).toContain("Vi vender tilbage samme dag.");
  });

  it("løftet står EFTER knappen, ikke før", () => {
    // Rækkefølgen er meningen: man læser den når man har besluttet sig for at
    // skrive. Står den over knappen, konkurrerer den med den.
    const h = render({ ...GRUND, ctaNote: "Vi vender tilbage samme dag." });
    expect(h.indexOf("kontakt-cta-mail")).toBeLessThan(h.indexOf("kontakt-svarloefte"));
  });

  it("løftet er REDIGERBART i cms — ellers kan det kun ændres med et deploy", () => {
    const h = renderToString(
      Contact({
        data: { ...GRUND, ctaNote: "Vi vender tilbage samme dag." },
        cmsRef: { collection: "sections", slug: "kontakt", locale: "da" },
      }) as never,
    );
    expect(h).toContain('data-cms-field="ctaNote"');
  });
});
