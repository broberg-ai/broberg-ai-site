import { describe, test as it, expect, beforeEach, afterEach } from "bun:test";
import { lyt, udsend, antalLyttere, liveKonfigureret, liveTaeller, _ryd } from "./live-bus.ts";
import { handleLiveSend } from "./live-rute.ts";

const gemEnv = { ...process.env };
beforeEach(() => { _ryd(); process.env.LIVE_TEST_TOKEN = "hemmelig"; });
afterEach(() => { Object.assign(process.env, gemEnv); delete process.env.LIVE_TEST_TOKEN; });

function ktx(ref: string, krop: Record<string, unknown>, token?: string) {
  const svar: { status?: number; krop?: unknown } = {};
  return {
    c: {
      req: { param: () => ref, json: async () => krop, header: (n: string) => (n === "x-live-token" ? token : undefined) },
      json: (k: unknown, s = 200) => { svar.krop = k; svar.status = s; return new Response(null); },
    } as never,
    svar,
  };
}

describe("beskeden når KUN den rigtige sag", () => {
  it("en lytter på sagen får beskeden", () => {
    const set: string[] = [];
    lyt("BR-AAA", (b) => set.push(b.tekst));
    udsend("BR-AAA", { fra: "Christian", tekst: "hej", tid: 1 });
    expect(set).toEqual(["hej"]);
  });

  it("DEN BÆRENDE: en besked til sag A når ALDRIG en lytter på sag B", () => {
    // Uden denne beviser «beskeden kom frem» ingenting — en bus der sender
    // alt til alle består enhver positiv prøve.
    const a: string[] = [], b: string[] = [];
    lyt("BR-AAA", (m) => a.push(m.tekst));
    lyt("BR-BBB", (m) => b.push(m.tekst));
    udsend("BR-AAA", { fra: "x", tekst: "kun til A", tid: 1 });
    expect(a).toEqual(["kun til A"]);
    expect(b).toEqual([]);
  });

  it("flere browsere på samme sag får den alle sammen", () => {
    let n = 0;
    lyt("BR-AAA", () => n++);
    lyt("BR-AAA", () => n++);
    expect(udsend("BR-AAA", { fra: "x", tekst: "t", tid: 1 })).toBe(2);
    expect(n).toBe(2);
  });

  it("en besked til en sag INGEN lytter på forsvinder — og siger 0", () => {
    expect(udsend("BR-TOM", { fra: "x", tekst: "t", tid: 1 })).toBe(0);
  });
});

describe("lyttere hober sig ikke op", () => {
  it("afmeldingen fjerner lytteren", () => {
    const af = lyt("BR-AAA", () => {});
    expect(antalLyttere("BR-AAA")).toBe(1);
    af();
    expect(antalLyttere("BR-AAA")).toBe(0);
  });

  it("en tom kanal fjernes HELT — ellers vokser kortet for hver sag der har haft en lytter", () => {
    const af = lyt("BR-AAA", () => {});
    af();
    // Måles på tælleren: den går i nul og bliver der.
    expect(liveTaeller.lyttere).toBe(0);
    expect(antalLyttere("BR-AAA")).toBe(0);
  });
});

describe("skrive-enden er LUKKET uden hemmeligheden", () => {
  it("uden LIVE_TEST_TOKEN: 503, og INTET sendes", async () => {
    delete process.env.LIVE_TEST_TOKEN;
    expect(liveKonfigureret()).toBe(false);
    const set: string[] = [];
    lyt("BR-AAA", (b) => set.push(b.tekst));
    const { c, svar } = ktx("BR-AAA", { tekst: "skulle ikke nå frem" }, "hemmelig");
    await handleLiveSend(c);
    expect(svar.status).toBe(503);
    expect(set).toEqual([]);          // målt FØR og EFTER, ikke kun statuskoden
  });

  it("forkert token: 401, og ingen læser modtager noget", async () => {
    const set: string[] = [];
    lyt("BR-AAA", (b) => set.push(b.tekst));
    const { c, svar } = ktx("BR-AAA", { tekst: "nej" }, "forkert");
    await handleLiveSend(c);
    expect(svar.status).toBe(401);
    expect(set).toEqual([]);
    expect(liveTaeller.afvistToken).toBe(1);
  });

  it("rigtigt token: beskeden når frem, og svaret siger HVOR MANGE", async () => {
    // «naaede: 0» er ikke en fejl, men heller ikke en succes — hun havde bare
    // ikke chatten åben. At sige «sendt» ville sende ham på jagt efter en
    // transportfejl når svaret er at der ikke sad nogen.
    lyt("BR-AAA", () => {});
    const { c, svar } = ktx("BR-AAA", { tekst: "hej", fra: "Christian" }, "hemmelig");
    await handleLiveSend(c);
    expect(svar.status).toBe(200);
    expect((svar.krop as { naaede: number }).naaede).toBe(1);
  });

  it("tom tekst sendes ikke", async () => {
    const { c, svar } = ktx("BR-AAA", { tekst: "   " }, "hemmelig");
    await handleLiveSend(c);
    expect(svar.status).toBe(400);
  });

  it("uden afsender bliver det «Support», ikke tomt", async () => {
    let fra = "";
    lyt("BR-AAA", (b) => { fra = b.fra; });
    await handleLiveSend(ktx("BR-AAA", { tekst: "hej" }, "hemmelig").c);
    expect(fra).toBe("Support");
  });
});
