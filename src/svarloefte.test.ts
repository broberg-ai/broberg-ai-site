/**
 * Svarløftet under kontakt-formularens Send-knap.
 *
 * Christian 11/9 valgte «Vi vender tilbage samme dag.» frem for at overbyde en
 * konkurrents «inden 2 timer». Et løfte der holder hver gang er mere værd end
 * et hurtigere der ikke gør.
 *
 * PRØVEN MÅLER DEN KOMPONENT DER FAKTISK VISES. Første udgave af denne fil var
 * grøn mod Contact i sections.tsx — som renderes på NUL sider. Sitet har to
 * komponenter der begge hedder Contact og begge udsender <section id="kontakt">:
 * den gamle mailto-blok i sections.tsx og den rigtige formular i Contact.tsx
 * (F156.6). Målt på produktionen: "kontakt-cta-mail" står på 0 sider,
 * "contact-submit" på forsiden. En prøve mod den forkerte af de to er grøn og
 * beviser ingenting — derfor måler den første prøve her at vi er i den rigtige
 * fil overhovedet.
 *
 * Den bærende kontrol er stadig den NEGATIVE: der må aldrig opstå et svarløfte
 * fordi et felt mangler. Derfor bruger koden ikke f(), som kræver en
 * reservetekst.
 */
import { describe, it, expect } from "bun:test";
import { renderToString } from "preact-render-to-string";
import { Contact, type ContactCopy } from "@/components/Contact.tsx";

const GRUND: ContactCopy = {
  ctaHeadingHtml: "Lad os bygge noget",
  ctaLead: "En manchet.",
  eyebrow: "Kontakt",
};

const render = (d: ContactCopy) =>
  renderToString(Contact({ data: d, locale: "da" }) as never);

describe("svarløftet", () => {
  it("porten måler den formular der faktisk står på forsiden", () => {
    // Uden denne kunne hele filen være grøn mod en komponent ingen renderer.
    const h = render(GRUND);
    expect(h).toContain('data-testid="contact-submit"');
    expect(h).toContain('data-testid="contact-form"');
  });

  it("KONTROL: uden feltet står der intet løfte — heller ikke en tom linje", () => {
    const h = render(GRUND);
    expect(h).not.toContain('data-testid="kontakt-svarloefte"');
    expect(h).not.toContain("cta-note");
  });

  it("KONTROL: en tom streng er også et fravær, ikke et tomt løfte", () => {
    // Det er hvad et cms-felt giver når nogen rydder det.
    const h = render({ ...GRUND, form: { svarloefte: "" } });
    expect(h).not.toContain('data-testid="kontakt-svarloefte"');
  });

  it("KONTROL: de øvrige formular-felter giver IKKE et løfte", () => {
    // En form-nøgle der bare fandtes måtte ikke udløse linjen.
    const h = render({ ...GRUND, form: { submit: "Send", name: "Navn" } });
    expect(h).not.toContain('data-testid="kontakt-svarloefte"');
    expect(h).toContain("Send");
  });

  it("løftet vises ordret når det står i cms", () => {
    const h = render({ ...GRUND, form: { svarloefte: "Vi vender tilbage samme dag." } });
    expect(h).toContain('data-testid="kontakt-svarloefte"');
    expect(h).toContain("Vi vender tilbage samme dag.");
  });

  it("løftet står EFTER knappen, ikke før", () => {
    const h = render({ ...GRUND, form: { svarloefte: "Vi vender tilbage samme dag." } });
    expect(h.indexOf("contact-submit")).toBeLessThan(h.indexOf("kontakt-svarloefte"));
  });

  it("løftet er REDIGERBART i cms — ellers kan en svartid kun ændres med et deploy", () => {
    const h = renderToString(
      Contact({
        data: { ...GRUND, form: { svarloefte: "Vi vender tilbage samme dag." } },
        locale: "da",
        cmsRef: { collection: "landing", slug: "landing", locale: "da" },
      }) as never,
    );
    expect(h).toContain('data-cms-field="contactForm.svarloefte"');
  });
});
