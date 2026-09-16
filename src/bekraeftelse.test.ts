import { describe, test as it, expect, afterEach, beforeEach } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { slaaOp, indloes } from "./bekraeftelse.ts";
import { handleBekraeft, bekraeftTaeller } from "./bekraeft-rute.ts";

const gemFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = gemFetch; });
beforeEach(() => { bekraeftTaeller.ja = 0; bekraeftTaeller.nej = 0; bekraeftTaeller.afvist = 0; });

function svarer(status: number, krop: unknown, opsaml?: string[]) {
  globalThis.fetch = (async (u: string, init?: RequestInit) => {
    opsaml?.push(`${init?.method ?? "GET"} ${u}`);
    return new Response(JSON.stringify(krop), { status });
  }) as unknown as typeof fetch;
}

function kontekst(krop: Record<string, unknown>) {
  const svar: { status?: number; krop?: unknown } = {};
  return {
    ctx: {
      req: { json: async () => krop },
      json: (k: unknown, s = 200) => { svar.krop = k; svar.status = s; return new Response(null); },
    } as never,
    svar,
  };
}

describe("opslaget må ikke forbruge tokenet", () => {
  it("slaar op med GET — ALDRIG med POST", async () => {
    const kaldt: string[] = [];
    svarer(200, { redeemable: true, ref: "BR-4ZVHJ", subject: "Jeg kan ikke logge ind" }, kaldt);
    await slaaOp("tok123");
    expect(kaldt).toEqual(["GET https://api.helpdesk.broberg.ai/v1/resolutions/tok123"]);
  });

  it("to opslag i træk laver to GET og nul POST — rendring bruger ikke bekræftelsen op", async () => {
    const kaldt: string[] = [];
    svarer(200, { redeemable: true, ref: "BR-4ZVHJ" }, kaldt);
    await slaaOp("tok123");
    await slaaOp("tok123");
    expect(kaldt.filter((k) => k.startsWith("POST"))).toEqual([]);
    expect(kaldt.length).toBe(2);
  });

  it("bærer sagens ref og emne videre — «blev det løst?» skal sige hvad «det» er", async () => {
    svarer(200, { redeemable: true, ref: "BR-4ZVHJ", subject: "Jeg kan ikke logge ind" });
    const b = await slaaOp("tok123");
    expect(b.brugbar).toBe(true);
    expect(b.ref).toBe("BR-4ZVHJ");
    expect(b.emne).toBe("Jeg kan ikke logge ind");
  });
});

describe("hver afvisning er sin egen tilstand", () => {
  for (const grund of ["unknown", "used", "expired"] as const) {
    it(`«${grund}» bæres videre som ${grund} — ikke som en samlet fejl`, async () => {
      svarer(404, { redeemable: false, reason: grund });
      expect((await slaaOp("tok")).grund).toBe(grund);
    });
  }

  it("en grund vi IKKE kender bliver «ukendt-grund» — ikke «unknown»", async () => {
    // De to ser ens ud i en fejltekst og betyder modsatte ting: «unknown» siger
    // til brugeren at hendes link ikke findes. Forstod vi bare ikke svaret, ville
    // vi altså give hende skylden for vores egen manglende oversættelse.
    svarer(404, { redeemable: false, reason: "revoked_by_agent" });
    expect((await slaaOp("tok")).grund).toBe("ukendt-grund");
  });

  it("en netværksfejl er heller ikke «findes ikke»", async () => {
    globalThis.fetch = (async () => { throw new Error("nede"); }) as unknown as typeof fetch;
    expect((await slaaOp("tok")).grund).toBe("ukendt-grund");
  });
});

describe("begge svar kan afgives, og de tælles hver for sig", () => {
  it("«ja» når frem som outcome: solved", async () => {
    let sendt: unknown;
    globalThis.fetch = (async (_u: string, init?: RequestInit) => {
      sendt = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as unknown as typeof fetch;
    const { ctx, svar } = kontekst({ token: "tok", svar: "solved" });
    await handleBekraeft(ctx);
    expect(sendt).toEqual({ token: "tok", outcome: "solved" });
    expect(svar.status).toBe(200);
    expect(bekraeftTaeller.ja).toBe(1);
  });

  it("«nej» er IKKE sværere end «ja» — samme rute, samme form, egen tæller", async () => {
    svarer(200, { ok: true });
    await handleBekraeft(kontekst({ token: "tok", svar: "not_solved" }).ctx);
    expect(bekraeftTaeller.nej).toBe(1);
    expect(bekraeftTaeller.ja).toBe(0);
  });

  it("et udfald vi ikke kender når ALDRIG deres API", async () => {
    const kaldt: string[] = [];
    svarer(200, { ok: true }, kaldt);
    const { ctx, svar } = kontekst({ token: "tok", svar: "maaske" });
    await handleBekraeft(ctx);
    expect(svar.status).toBe(400);
    expect(kaldt).toEqual([]);
  });

  it("andet forsøg med samme token giver en forståelig grund, ikke en rå fejl", async () => {
    svarer(409, { reason: "used" });
    const { ctx, svar } = kontekst({ token: "tok", svar: "solved" });
    await handleBekraeft(ctx);
    expect(svar.status).toBe(409);
    expect((svar.krop as { grund: string }).grund).toBe("used");
    expect(bekraeftTaeller.afvist).toBe(1);
    expect(bekraeftTaeller.ja).toBe(0);      // en afvist indløsning må ikke tælle som et ja
  });
});

/**
 * AC#5 — VAGTEN. Knappen må aldrig ligge i en mail: scannere forklikker links,
 * og vi ville registrere løsninger ingen har bekræftet.
 *
 * HelpDesk ejer de mails DER SENDES OM EN SAG, så deres skabeloner kan vagten
 * her ikke se — det er meldt til dem separat. Den her dækker det vi selv
 * sender, og det er den halvdel vi kan holde.
 */
describe("ingen bekræftelsesknap i en mail vi selv sender", () => {
  it("intet /api/bekraeft og ingen outcome-parameter i vores egne skabeloner", () => {
    const filer = readdirSync("src", { recursive: true, encoding: "utf-8" })
      .filter((f) => typeof f === "string" && /mail|template|skabelon/i.test(f) && f.endsWith(".ts"));
    // EN TOM LISTE ER IKKE ET BEVIS. Omdøbes mail-filerne, ville vagten
    // scanne ingenting og stå grøn — den ville dække nul og ligne dækning.
    expect(filer.length).toBeGreaterThan(0);
    const syndere: string[] = [];
    for (const f of filer) {
      const t = readFileSync(`src/${f}`, "utf-8");
      if (/api\/bekraeft|outcome=|resolutions\?/.test(t)) syndere.push(f);
    }
    expect(syndere).toEqual([]);
  });
});

/**
 * HelpDesks kontrakt, oplyst 16/9: OPSLAGET (GET) svarer 200 med `used` /
 * `expired` som booleans og bærer KUN `reason` på 404. To kilder til de samme
 * tre tilstande, med hver sin form — deres arv, vores oversættelse.
 */
describe("opslagets flag oversættes til den rigtige tilstand", () => {
  it("et BRUGT token bliver «used», ikke «ukendt-grund»", async () => {
    // Uden flag-læsningen ville en bruger der svarer for anden gang få «det
    // er vores side der driller» i stedet for «du har allerede svaret».
    svarer(200, { redeemable: false, used: true, expired: false, ref: "BR-X" });
    expect((await slaaOp("tok")).grund).toBe("used");
  });

  it("et UDLØBET token bliver «expired»", async () => {
    svarer(200, { redeemable: false, used: false, expired: true, ref: "BR-X" });
    expect((await slaaOp("tok")).grund).toBe("expired");
  });

  it("404 med reason virker stadig — den anden kilde", async () => {
    svarer(404, { redeemable: false, reason: "unknown" });
    expect((await slaaOp("tok")).grund).toBe("unknown");
  });

  it("knappen gates på `redeemable`, ikke på flagene hver for sig", async () => {
    svarer(200, { redeemable: true, used: false, expired: false, ref: "BR-X", subject: "Emnet" });
    const b = await slaaOp("tok");
    expect(b.brugbar).toBe(true);
    expect(b.emne).toBe("Emnet");
  });
});
