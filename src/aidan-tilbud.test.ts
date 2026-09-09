/* F018.12 — oplæsnings-tilbuddet skal SIGE hvad det læser, og ikke vælge tavst. */
import { describe, expect, it } from "bun:test";
import { laesEtiket, vaelgArtikler } from "./client/aidan-tilbud.ts";

const ARTIKLER = new Map([
  ["/bag-om/fra-artikel-til-podcast-uden-en-mikrofon", "Fra artikel til podcast — uden en mikrofon"],
  ["/ai-metode/tre-arkitekturer-agent-hukommelse", "Tre arkitekturer for agent-hukommelse"],
  ["/indsigter/uden-titel", ""],
]);

describe("vaelgArtikler", () => {
  it("springer links over der ikke er artikler", () => {
    // MÅLT PÅ PRODUKTION 9/9: svaret på podcast-spørgsmålet havde
    // /flagskibe/trail FØRST og artiklen som nr. 2.
    const ud = vaelgArtikler(
      [{ sti: "/flagskibe/trail", tekst: "Læs mere om Trail" },
       { sti: "/bag-om/fra-artikel-til-podcast-uden-en-mikrofon", tekst: "Læs artiklen" }],
      ARTIKLER,
    );
    expect(ud).toEqual([
      { sti: "/bag-om/fra-artikel-til-podcast-uden-en-mikrofon", titel: "Fra artikel til podcast — uden en mikrofon" },
    ]);
  });

  it("giver ÉT tilbud pr. artikel når svaret rummer flere — ingen tavs udvælgelse", () => {
    const ud = vaelgArtikler(
      [{ sti: "/bag-om/fra-artikel-til-podcast-uden-en-mikrofon" },
       { sti: "/#kontakt" },
       { sti: "/ai-metode/tre-arkitekturer-agent-hukommelse" }],
      ARTIKLER,
    );
    expect(ud.map((x) => x.sti)).toEqual([
      "/bag-om/fra-artikel-til-podcast-uden-en-mikrofon",
      "/ai-metode/tre-arkitekturer-agent-hukommelse",
    ]);
    expect(ud.map((x) => x.titel)).toEqual([
      "Fra artikel til podcast — uden en mikrofon",
      "Tre arkitekturer for agent-hukommelse",
    ]);
  });

  it("samme artikel to gange i ét svar giver ét tilbud", () => {
    const s = "/ai-metode/tre-arkitekturer-agent-hukommelse";
    expect(vaelgArtikler([{ sti: s }, { sti: s }], ARTIKLER)).toHaveLength(1);
  });

  it("respekterer loftet", () => {
    const mange = [...ARTIKLER.keys()].map((sti) => ({ sti }));
    expect(vaelgArtikler(mange, ARTIKLER, 2)).toHaveLength(2);
  });

  it("bruger linkets egen tekst når indekset mangler en titel", () => {
    const ud = vaelgArtikler([{ sti: "/indsigter/uden-titel", tekst: "  Læs den her  " }], ARTIKLER);
    expect(ud[0]!.titel).toBe("Læs den her");
  });

  it("tomt svar giver intet tilbud", () => {
    expect(vaelgArtikler([], ARTIKLER)).toEqual([]);
    expect(vaelgArtikler([{ sti: "/cases" }], ARTIKLER)).toEqual([]);
  });
});

describe("laesEtiket", () => {
  it("navngiver artiklen i skabelonen", () => {
    expect(laesEtiket("Læs «{titel}» højt", "Skal jeg læse artiklen højt for dig?", "Agentic orkestration"))
      .toBe("Læs «Agentic orkestration» højt");
  });

  it("falder tilbage på det generiske spørgsmål UDEN titel — aldrig «Læs «» højt»", () => {
    const ud = laesEtiket("Læs «{titel}» højt", "Skal jeg læse artiklen højt for dig?", "  ");
    expect(ud).toBe("Skal jeg læse artiklen højt for dig?");
    expect(ud).not.toContain("«»");
  });

  it("hænger titlen på reserven hvis skabelonen mangler {titel}", () => {
    expect(laesEtiket("Læs højt", "Skal jeg læse artiklen højt?", "Trail"))
      .toBe("Skal jeg læse artiklen højt? — Trail");
    expect(laesEtiket(undefined, "Skal jeg læse artiklen højt?", "Trail"))
      .toBe("Skal jeg læse artiklen højt? — Trail");
  });

  it("engelsk skabelon virker ens", () => {
    expect(laesEtiket("Read «{titel}» aloud", "Want me to read the article aloud?", "Agentic orchestration"))
      .toBe("Read «Agentic orchestration» aloud");
  });
});
