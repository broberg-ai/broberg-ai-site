import { describe, test as it, expect, afterEach } from "bun:test";
import { readFileSync } from "node:fs";
import { emneFor, kropFor, handleSupport } from "./support.ts";

/**
 * F024.2 — supportruten.
 *
 * De to ting der kan gå galt uden at nogen ser det: at en henvendelse
 * forsvinder mens siden siger tak, og at en utjekket mailadresse slipper
 * igennem som en modtager HelpDesk stoler på.
 */

describe("emnet skal kunne stå på en mail", () => {
  it("bruger emnet når der er et", () => {
    expect(emneFor("  Kan ikke logge ind  ", "noget")).toBe("Kan ikke logge ind");
  });

  it("laver et emne af beskedens første linje når feltet er tomt", () => {
    expect(emneFor("", "Jeg kan ikke finde min faktura\nog det haster")).toBe("Jeg kan ikke finde min faktura");
  });

  it("sender ALDRIG en tom streng videre — HelpDesk afviser den med 400", () => {
    expect(emneFor("", "")).toBe("Henvendelse fra broberg.ai");
    expect(emneFor("   ", "   ")).toBe("Henvendelse fra broberg.ai");
  });
});

describe("mailadressen er et hint, ikke en modtager", () => {
  /** HelpDesks afsnit 6: sender vi en adresse gennem VORES nøgle, stoler de
   *  på den og vi hæfter. En anonym besøgendes tastede adresse kan være en
   *  fremmeds — den skal kunne LÆSES af et menneske, ikke handles på. */
  it("står i kroppen som en oplyst formodning, mærket som ubekræftet", () => {
    const k = kropFor("Der er noget galt", "Ida", "ida@eksempel.dk");
    expect(k).toContain("Der er noget galt");
    expect(k).toContain("ida@eksempel.dk");
    expect(k).toContain("IKKE bekræftet");
  });

  it("nævner intet når intet er oplyst — ingen tom formodning", () => {
    const k = kropFor("Der er noget galt");
    expect(k).toBe("Der er noget galt");
    expect(k).not.toContain("Oplyst");
  });

  it("ruten sætter ALDRIG bekraeftetEmail", () => {
    // Vagten er kildeteksten: feltet må kun kunne udfyldes af et kaldested
    // der HAR bekræftet adressen, og supportformularen har ikke.
    const kilde = readFileSync(new URL("./support.ts", import.meta.url).pathname, "utf-8")
      .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
    expect(kilde).not.toContain("bekraeftetEmail:");
  });
});

describe("en henvendelse må ikke kunne forsvinde", () => {
  it("ruten har en reservevej, og den er CMS'ets formular-motor", () => {
    const kilde = readFileSync(new URL("./support.ts", import.meta.url).pathname, "utf-8");
    expect(kilde).toContain("tilReserve");
    expect(kilde).toContain("webhouse.app/api/forms/contact");
  });

  it("svaret SIGER hvilken vej der blev brugt — «ok» alene ville skjule et udfald", () => {
    const kilde = readFileSync(new URL("./support.ts", import.meta.url).pathname, "utf-8");
    // Samme fejlform som HelpDesks egen mail-rute: ok:true betyder «kaldet
    // lykkedes», ikke «det nåede frem». Feltet der skelner skal findes.
    expect(kilde).toMatch(/vej:\s*"helpdesk"/);
    expect(kilde).toMatch(/vej:\s*"reserve"/);
    expect(kilde).toMatch(/vej:\s*"ingen"/);
  });

  it("intakeKey er indholdets fingeraftryk, ikke et tidsstempel", () => {
    // Deres 3.2: en nøgle der er ny ved hvert forsøg er værdiløs, for den
    // findes netop for genforsøget.
    const kilde = readFileSync(new URL("./support.ts", import.meta.url).pathname, "utf-8")
      .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
    expect(kilde).toMatch(/intakeKey:\s*await fingeraftryk/);
    expect(kilde).not.toMatch(/intakeKey:.*Date\.now|intakeKey:.*Math\.random/);
  });
});

describe("opførslen, ikke kildeteksten", () => {
  /**
   * Prøverne ovenfor griber i kildetekst. De fanger en omskrivning, ikke en
   * fejl i hvad ruten GØR — og en kontrol der ikke kan skelne, er den der
   * fejler i den grønne retning. Den her kører ruten.
   */
  function fakeKontekst(krop: Record<string, unknown>) {
    const svar: { status?: number; krop?: unknown } = {};
    return {
      ctx: {
        req: { json: async () => krop, header: () => undefined },
        json: (k: unknown, s = 200) => { svar.krop = k; svar.status = s; return new Response(null); },
        get: () => undefined,
      } as never,
      svar,
    };
  }

  const gemFetch = globalThis.fetch;
  const gemEnv = { ...process.env };
  afterEach(() => { globalThis.fetch = gemFetch; Object.assign(process.env, gemEnv); });

  it("HelpDesk nede → henvendelsen når stadig frem, og svaret SIGER reserve", async () => {
    delete process.env.HELPDESK_KEY;              // HelpDesk kan ikke kaldes
    let reserveKaldt = false;
    globalThis.fetch = (async (u: string) => {
      if (String(u).includes("webhouse.app")) {
        reserveKaldt = true;
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      throw new Error("uventet kald: " + u);
    }) as typeof fetch;

    const { ctx, svar } = fakeKontekst({ besked: "Jeg kan ikke logge ind", navn: "Ida", email: "ida@eksempel.dk" });
    await handleSupport(ctx);

    expect(reserveKaldt).toBe(true);
    expect((svar.krop as { vej: string }).vej).toBe("reserve");
    expect((svar.krop as { ok: boolean }).ok).toBe(true);
  });

  it("BEGGE veje nede → siden lyver IKKE om at det lykkedes", async () => {
    delete process.env.HELPDESK_KEY;
    globalThis.fetch = (async () => new Response("nej", { status: 500 })) as unknown as typeof fetch;

    const { ctx, svar } = fakeKontekst({ besked: "Jeg kan ikke logge ind" });
    await handleSupport(ctx);

    expect((svar.krop as { ok: boolean }).ok).toBe(false);
    expect((svar.krop as { vej: string }).vej).toBe("ingen");
    expect(svar.status).toBe(502);
  });

  it("den besøgendes mail når ALDRIG HelpDesk som modtager", async () => {
    process.env.HELPDESK_KEY = "hd_live_test";
    process.env.HELPDESK_TENANT = "broberg-ai";
    let sendtKrop = "";
    globalThis.fetch = (async (u: string, init?: RequestInit) => {
      sendtKrop = String(init?.body ?? "");
      return new Response(JSON.stringify({ ticket: { ref: "BR-TEST1", state: "open", level: 0 }, created: true }), { status: 201 });
    }) as typeof fetch;

    const { ctx, svar } = fakeKontekst({ besked: "hjælp mig", email: "fremmed@eksempel.dk" });
    await handleSupport(ctx);

    expect((svar.krop as { vej: string }).vej).toBe("helpdesk");
    const sendt = JSON.parse(sendtKrop) as Record<string, unknown>;
    expect(sendt.requesterEmail).toBeUndefined();       // ← hele pointen
    expect(String(sendt.body)).toContain("fremmed@eksempel.dk");   // men et menneske kan læse den
  });
});
