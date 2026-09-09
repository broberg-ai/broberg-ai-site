import { describe, test as it, expect } from "bun:test";
import { delTale } from "@/aidan-laes.ts";

/**
 * F018.10 — de længste artikler kunne ikke læses op.
 *
 * MÅLT PÅ PRODUKTION 9/9-2026, samme rute og stemme:
 *    8.447 tegn   HTTP 200   3,2 MB   21 s
 *   10.764 tegn   HTTP 500   ——        5 s
 *
 * Azure melder loftet som «The socket connection was closed unexpectedly» —
 * altså som en netværksfejl, ikke som en grænse. Derfor lignede det drift.
 *
 * Og vores EGET loft stod på 12.000 tegn, altså OVER Azures. Det spærrede
 * derfor ingenting: 3 af 59 artikler var ulæselige, og det var de tre længste
 * — dem hvor en oplæsning er mest værd. En grænse der ligger over den grænse
 * den skal beskytte mod, er ingen grænse.
 */
describe("lang tekst deles ved sætningsgrænser", () => {
  const sætning = "Det her er en sætning der fylder noget. ";
  const lang = sætning.repeat(400); // ~16.000 tegn

  it("hvert stykke er under loftet", () => {
    for (const s of delTale(lang, 4500)) expect(s.length).toBeLessThanOrEqual(4500);
  });

  it("INTET går tabt — teksten kan sys sammen igen", () => {
    // Den bærende prøve: en deling der taber en sætning ville lyde helt
    // normal, og kun den der kender artiklen ville opdage det.
    const samlet = delTale(lang, 4500).join(" ").replace(/\s+/g, " ").trim();
    expect(samlet).toBe(lang.replace(/\s+/g, " ").trim());
  });

  it("der deles EFTER et punktum, ikke midt i en sætning", () => {
    for (const s of delTale(lang, 4500).slice(0, -1)) {
      expect(s.trimEnd(), `stykket slutter midt i en sætning: …${s.slice(-40)}`).toMatch(/[.!?]$/);
    }
  });

  it("POSITIV KONTROL: kort tekst deles slet ikke", () => {
    // Uden denne ville «del altid i småstykker» bestå alt ovenfor — og hver
    // artikel ville koste unødige kald.
    const kort = "En kort artikel. To sætninger.";
    expect(delTale(kort, 4500)).toEqual([kort]);
  });

  it("en passage UDEN punktum deles ved et mellemrum, ikke midt i et ord", () => {
    const uden = "ord ".repeat(3000).trim(); // 12.000 tegn, ingen sætningsslut
    const dele = delTale(uden, 4500);
    expect(dele.length).toBeGreaterThan(1);
    for (const d of dele) expect(d).not.toMatch(/^rd |or$/);
    expect(dele.join(" ")).toBe(uden);
  });

  it("tåler tomt og skrald uden at kaste eller løkke uendeligt", () => {
    expect(delTale("")).toEqual([]);
    expect(delTale("   ")).toEqual([]);
    expect(delTale(null as unknown as string)).toEqual([]);
    // Ét meget langt ord uden mellemrum må ikke give en uendelig løkke.
    const etOrd = "a".repeat(10_000);
    const dele = delTale(etOrd, 4500);
    expect(dele.length).toBe(3);
    expect(dele.join("")).toBe(etOrd);
  });

  it("den ægte artikel-længde deles i mere end ét stykke", () => {
    // 10.764 tegn er den artikel Christian prøvede og som fejlede.
    expect(delTale("x. ".repeat(3588), 4500).length).toBeGreaterThan(1);
  });
});
