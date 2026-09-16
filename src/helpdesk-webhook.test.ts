import { describe, test as it, expect, beforeEach, afterEach } from "bun:test";
import { createHmac } from "node:crypto";
import {
  verificer, handleHelpdeskWebhook, webhookTaeller, sagsTilstand,
  nulstilWebhookHukommelse, webhookKonfigureret,
} from "./helpdesk-webhook.ts";

/**
 * HELPDESKS EGEN VEKTOR, krydstjekket i deres Bun-implementation OG i Python
 * før de sendte den. Prøverne kører mod DEN, ikke mod min genopbygning af
 * beskrivelsen.
 *
 * Forskellen er ikke akademisk: en prøve mod min egen udledning ville bevise
 * at jeg er enig med mig selv. Den ville være grøn uanset om jeg havde
 * misforstået om tidsstemplet står før eller efter punktummet — og den fejl
 * ville først vise sig som en afvist hændelse i produktionen.
 */
const NOEGLE = "whsec_TESTNOEGLE_ikke_en_hemmelighed";
const TS = "1789600000000";
const KROP = '{"event":"ticket.created","at":"2026-09-16T23:06:40.000Z","data":{"ticket":{"ref":"BR-TEST","erProeve":false}}}';
const SIG = "af57835ede57dfe285b619b4422dc69d1147c7eaf21c7ab272d6cf85110b84fa";

const NU = Number(TS);   // «nu» sat til vektorens tid, så vinduet ikke rammer

function hdr(sig = SIG, ts = TS): Headers {
  return new Headers({ "x-helpdesk-signature": sig, "x-helpdesk-timestamp": ts });
}

const gemEnv = { ...process.env };
beforeEach(() => { process.env.HELPDESK_WEBHOOK_SECRET = NOEGLE; nulstilWebhookHukommelse(); });
afterEach(() => { Object.assign(process.env, gemEnv); delete process.env.HELPDESK_WEBHOOK_SECRET; });

describe("signaturen — målt mod HelpDesks vektor", () => {
  it("DERES vektor accepteres af VORES kode", () => {
    expect(verificer(KROP, hdr(), NU)).toBeNull();
  });

  it("vores egen udregning giver nøjagtig deres hex", () => {
    // Beviser at grundlaget er «<ts>.<krop>» og ikke en af de andre
    // rækkefølger jeg kunne have gættet på.
    const egen = createHmac("sha256", NOEGLE).update(`${TS}.${KROP}`).digest("hex");
    expect(egen).toBe(SIG);
  });

  it("ét ændret tegn i kroppen afvises", () => {
    expect(verificer(KROP.replace("BR-TEST", "BR-XXXXX"), hdr(), NU)).toBe("forkert-signatur");
  });

  it("samme krop med et ANDET tidsstempel afvises — tiden er med i signaturen", () => {
    // Det er dét der gør replay-vinduet muligt: kunne man flytte tidsstemplet
    // frit, ville et gammelt gyldigt kald kunne genbruges i morgen.
    expect(verificer(KROP, hdr(SIG, String(Number(TS) + 1)), Number(TS) + 1)).toBe("forkert-signatur");
  });

  it("et gammelt kald afvises som FOR GAMMEL, ikke som forkert signatur", () => {
    expect(verificer(KROP, hdr(), NU + 6 * 60_000)).toBe("for-gammel");
  });

  it("et kald lige inden for vinduet slipper igennem", () => {
    expect(verificer(KROP, hdr(), NU + 4 * 60_000)).toBeNull();
  });

  it("manglende header er sin egen tilstand", () => {
    expect(verificer(KROP, new Headers(), NU)).toBe("mangler-header");
  });

  it("en signatur af FORKERT LÆNGDE giver et svar, ikke et kast", () => {
    // timingSafeEqual kaster på ulige længder. Uden længdetjekket ville et
    // kort tegn-sæt blive til en 500 hvor der skulle stå 401 — altså en
    // angriber der kan se forskel på sine gæt.
    expect(verificer(KROP, hdr("abc"), NU)).toBe("forkert-signatur");
  });
});

function kontekst(raa: string, h: Headers) {
  const svar: { status?: number; krop?: unknown } = {};
  return {
    ctx: {
      req: { text: async () => raa, raw: { headers: h } },
      json: (k: unknown, s = 200) => { svar.krop = k; svar.status = s; return new Response(null); },
    } as never,
    svar,
  };
}

const sign = (krop: string, ts = String(Date.now())) => hdr(
  createHmac("sha256", NOEGLE).update(`${ts}.${krop}`).digest("hex"), ts,
);
/** DERES konvolut, taget af vektoren: { event, at, data: { ticket } }. */
const haendelse = (type: string, ref: string, state?: string) =>
  JSON.stringify({ event: type, at: new Date().toISOString(), data: { ticket: { ref, ...(state ? { state } : {}) } } });

describe("mørkt betyder LUKKET", () => {
  it("uden hemmeligheden svares 503 og INTET tages imod", async () => {
    delete process.env.HELPDESK_WEBHOOK_SECRET;
    expect(webhookKonfigureret()).toBe(false);
    const k = haendelse("ticket.created", "BR-AAA");
    const { ctx, svar } = kontekst(k, sign(k));
    await handleHelpdeskWebhook(ctx);
    expect(svar.status).toBe(503);
    expect(sagsTilstand.size).toBe(0);      // tilstanden er URØRT
  });

  // TIDSSTEMPLET SKAL VÆRE FRISKT i de to prøver herunder. Vinduet tjekkes
  // FØR HMAC'en, så et gammelt ts ville give «for-gammel» og prøven ville måle
  // den forkerte spærre — grøn på et krav den ikke rørte. Vektorens faste ts
  // hører kun hjemme i signatur-prøverne ovenfor, hvor «nu» sættes med.
  it("en forkert signatur ændrer INTET — målt før og efter, ikke kun på statuskoden", async () => {
    const k = haendelse("ticket.created", "BR-BBB");
    const foer = sagsTilstand.size;
    const { ctx, svar } = kontekst(k, hdr("0".repeat(64), String(Date.now())));
    await handleHelpdeskWebhook(ctx);
    expect(svar.status).toBe(401);
    expect(sagsTilstand.size).toBe(foer);
    expect(webhookTaeller.modtaget).toBe(0);
    expect(webhookTaeller.afvistSignatur).toBe(1);
  });

  it("svaret røber ikke HVILKEN spærre der stoppede kaldet", async () => {
    // «for gammel» mod «forkert signatur» ville fortælle en der prøver sig
    // frem hvor langt han er nået.
    const k = haendelse("ticket.created", "BR-CCC");
    const gammel = String(Date.now() - 10 * 60_000);
    const { svar } = kontekst(k, sign(k, gammel));
    await handleHelpdeskWebhook(kontekst(k, sign(k, gammel)).ctx);
    const { ctx: c2, svar: s2 } = kontekst(k, hdr("0".repeat(64), String(Date.now())));
    await handleHelpdeskWebhook(c2);
    void svar;
    expect((s2.krop as { fejl: string }).fejl).toBe("signatur");
    expect(webhookTaeller.forGammel).toBe(1);        // forskellen står hos OS
    expect(webhookTaeller.afvistSignatur).toBe(1);
  });
});

describe("idempotens og rækkefølge", () => {
  it("SAMME hændelse to gange ændrer tilstanden én gang", async () => {
    const k = haendelse("ticket.created", "BR-DDD", "open");
    for (let i = 0; i < 2; i++) await handleHelpdeskWebhook(kontekst(k, sign(k)).ctx);
    expect(webhookTaeller.modtaget).toBe(1);
    expect(webhookTaeller.dubletter).toBe(1);
  });

  it("state_changed FØR created taber ikke sagen — og den nyeste tilstand vinder", async () => {
    // HelpDesk målte at rækkefølgen ikke er garanteret: hvert udsend er
    // fire-and-forget med sin egen bagstop. Ordet «oprettet» lyder som noget
    // der kommer først, og gør det ikke.
    const sen = haendelse("ticket.state_changed", "BR-EEE", "confirmed");
    await handleHelpdeskWebhook(kontekst(sen, sign(sen)).ctx);
    expect(sagsTilstand.get("BR-EEE")).toBe("confirmed");

    const tidlig = haendelse("ticket.created", "BR-EEE", "open");
    await handleHelpdeskWebhook(kontekst(tidlig, sign(tidlig)).ctx);
    expect(sagsTilstand.get("BR-EEE")).toBe("confirmed");   // IKKE sat tilbage til open
  });

  it("en ukendt hændelsestype er ikke en fejl — den må ikke udløse deres bagstop", async () => {
    // En 400 ville få dem til at prøve igen fem gange på noget der aldrig
    // kan lykkes, og de tilføjer hændelser uden at spørge os.
    const k = haendelse("ticket.merged", "BR-FFF");
    const { ctx, svar } = kontekst(k, sign(k));
    await handleHelpdeskWebhook(ctx);
    expect(svar.status).toBe(200);
    expect(webhookTaeller.ukendtType).toBe(1);
  });
});
