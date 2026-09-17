import { describe, test as it, expect, afterEach, beforeEach } from "bun:test";
import { readFileSync } from "node:fs";
import { readFile, rm } from "node:fs/promises";
import { emneFor, kropFor, handleSupport, handleSupportTriage, turnstileAktiv, taelTilbudtSag, triageTaeller, spamTaeller } from "./support.ts";
import { handleAidanHealth } from "./aidan.ts";
import { HONEYPOT_FIELD, _resetRateLimiter } from "@broberg/forms-turnstile/server";

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

    const { ctx, svar } = fakeKontekst({ besked: "Jeg kan ikke logge ind", email: "hun@eksempel.dk", navn: "Hanne" });
    await handleSupport(ctx);

    expect((svar.krop as { ok: boolean }).ok).toBe(false);
    expect((svar.krop as { vej: string }).vej).toBe("ingen");
    expect(svar.status).toBe(502);
  });

  it("adressen hun gav FOR at blive kontaktet, sendes med", async () => {
    // FØR 15/9 sendte vi den ALDRIG — og HelpDesk målte 18 sager uden nogen
    // måde at svare på. Christian: «hvordan skal vi komme i kontakt med et
    // menneske vi ikke kender?»
    //
    // Skelnen jeg missede: deres afsnit 6 forbyder at sende til en adresse man
    // ikke har grund til at tro på. En adresse skrevet i et felt der siger
    // «så vi kan vende tilbage», ER en grund.
    process.env.HELPDESK_KEY = "hd_live_test";
    process.env.HELPDESK_TENANT = "broberg-ai";
    let sendtKrop = "";
    globalThis.fetch = (async (_u: string, init?: RequestInit) => {
      sendtKrop = String(init?.body ?? "");
      return new Response(JSON.stringify({ ticket: { ref: "BR-TEST1", state: "open", level: 0 }, created: true }), { status: 201 });
    }) as unknown as typeof fetch;

    const { ctx, svar } = fakeKontekst({ besked: "hjælp mig", email: "ida@eksempel.dk", navn: "Hanne" });
    await handleSupport(ctx);

    expect((svar.krop as { vej: string }).vej).toBe("helpdesk");
    const sendt = JSON.parse(sendtKrop) as Record<string, unknown>;
    expect(sendt.requesterEmail).toBe("ida@eksempel.dk");
    expect(String(sendt.body)).toContain("ida@eksempel.dk");   // også læsbar for et menneske
  });

  it("uden en adresse opfinder vi ingen — feltet udelades helt", async () => {
    // Den halvdel der stadig gælder: vi må ikke fylde noget i for at få en
    // sag til at se besvarbar ud. En tom adresse er ærlig.
    process.env.HELPDESK_KEY = "hd_live_test";
    process.env.HELPDESK_TENANT = "broberg-ai";
    let sendtKrop = "";
    globalThis.fetch = (async (_u: string, init?: RequestInit) => {
      sendtKrop = String(init?.body ?? "");
      return new Response(JSON.stringify({ ticket: { ref: "BR-TEST2", state: "open", level: 0 }, created: true }), { status: 201 });
    }) as unknown as typeof fetch;

    // Kontakten er et TELEFONNUMMER. Kravet er opfyldt, og der er stadig ingen
    // mail — så prøven måler præcis det den hed: at vi ikke opfinder en.
    const { ctx } = fakeKontekst({ besked: "hjælp mig", telefon: "+45 20 12 34 56", navn: "Hanne" });
    await handleSupport(ctx);

    const sendt = JSON.parse(sendtKrop) as Record<string, unknown>;
    expect(sendt.requesterEmail).toBeUndefined();
  });
});

describe("Turnstile — mørkt indtil nøglen er sat, og så et rigtigt værn", () => {
  const gemEnv = { ...process.env };
  const gemFetch = globalThis.fetch;
  afterEach(() => { globalThis.fetch = gemFetch; Object.assign(process.env, gemEnv); delete process.env.TURNSTILE_SECRET_KEY; });

  function kontekst(krop: Record<string, unknown>) {
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

  it("uden nøglen slipper en indsendelse UDEN bevis igennem — de to andre værn bærer", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    delete process.env.HELPDESK_KEY;
    expect(turnstileAktiv()).toBe(false);
    globalThis.fetch = (async () => new Response(JSON.stringify({ ok: true }), { status: 200 })) as unknown as typeof fetch;
    const { ctx, svar } = kontekst({ besked: "Jeg kan ikke logge ind", email: "hun@eksempel.dk", navn: "Hanne" });
    await handleSupport(ctx);
    expect((svar.krop as { ok: boolean }).ok).toBe(true);   // nåede reservevejen, altså forbi spam-porten
  });

  it("MED nøglen afvises en indsendelse uden bevis — et tomt felt er ikke en undtagelse", async () => {
    process.env.TURNSTILE_SECRET_KEY = "0x-test";
    expect(turnstileAktiv()).toBe(true);
    const { ctx, svar } = kontekst({ besked: "Jeg kan ikke logge ind", navn: "Hanne" });
    await handleSupport(ctx);
    expect((svar.krop as { ok: boolean }).ok).toBe(false);
    expect(svar.status).toBe(400);
  });

  it("MED nøglen afvises et bevis Cloudflare siger nej til", async () => {
    // FØRSTE UDGAVE AF DEN HER PRØVE BESTOD AF DEN FORKERTE GRUND, og det blev
    // fanget af mutationen, ikke af mig: ignorerede jeg Cloudflares nej, gik
    // kaldet videre, HelpDesk fejlede (ingen nøgle), reservevejen fejlede på
    // den samme stubbede fetch — og svaret blev ok:false alligevel. Prøven
    // målte altså to veje ned ad, ikke spam-porten.
    //
    // Derfor asserteres nu på 400 (blokeret i porten) OG på at der aldrig blev
    // ringet videre. 502 ville betyde «kom forbi porten og fejlede bagefter».
    process.env.TURNSTILE_SECRET_KEY = "0x-test";
    process.env.HELPDESK_KEY = "hd_live_test";
    process.env.HELPDESK_TENANT = "broberg-ai";
    const kaldt: string[] = [];
    globalThis.fetch = (async (u: string) => {
      kaldt.push(String(u));
      return new Response(JSON.stringify({ success: false }), { status: 200 });
    }) as unknown as typeof fetch;

    const { ctx, svar } = kontekst({ besked: "Jeg kan ikke logge ind", turnstileToken: "forfalsket", navn: "Hanne" });
    await handleSupport(ctx);

    expect(svar.status).toBe(400);
    expect((svar.krop as { vej: string }).vej).toBe("ingen");
    // Kun Cloudflare må være kontaktet — hverken HelpDesk eller reservevejen.
    expect(kaldt.filter((u) => !u.includes("cloudflare"))).toEqual([]);
  });
});

describe("F024.3 — Aidan triagerer samtalen til en sag", () => {
  const gemFetch = globalThis.fetch;
  const gemEnv = { ...process.env };
  afterEach(() => { globalThis.fetch = gemFetch; Object.assign(process.env, gemEnv); });

  function kontekst(krop: Record<string, unknown>) {
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

  const SAMTALE = [
    { role: "user", content: "Min faktura mangler et bilag" },
    { role: "assistant", content: "Jeg kan ikke se dine fakturaer." },
    { role: "user", content: "Så må jeg tale med et menneske" },
  ];

  it("sagens krop bærer HELE samtalen, ikke kun den sidste sætning", async () => {
    process.env.HELPDESK_KEY = "hd_live_test";
    process.env.HELPDESK_TENANT = "broberg-ai";
    let sendt = "";
    globalThis.fetch = (async (_u: string, init?: RequestInit) => {
      sendt = String(init?.body ?? "");
      return new Response(JSON.stringify({ ticket: { ref: "BR-TRI1", state: "open", level: 0 }, created: true }), { status: 201 });
    }) as unknown as typeof fetch;

    const { ctx, svar } = kontekst({ samtaleId: "s-1", navn: "Hanne", email: "hun@eksempel.dk", samtale: SAMTALE });
    await handleSupportTriage(ctx);

    expect((svar.krop as { ref: string }).ref).toBe("BR-TRI1");
    const body = JSON.parse(sendt) as Record<string, string>;
    // Det er DEN her assert der er hele historien: et menneske skal ikke
    // starte forfra, så brugerens FØRSTE ord skal stå i sagen.
    expect(body.body).toContain("Min faktura mangler et bilag");
    expect(body.body).toContain("Jeg kan ikke se dine fakturaer.");
    // Emnet er det hun kom for — ikke «må jeg tale med et menneske».
    expect(body.subject).toBe("Min faktura mangler et bilag");
    // Adressen går MED nu. Den stod som «undefined» her da triagen kunne
    // oprette en sag uden kontakt — den mulighed findes ikke længere, og en
    // prøve der stadig krævede undefined ville forsegle den gamle verden.
    expect(body.requesterEmail).toBe("hun@eksempel.dk");
    expect(body.intent).toBeUndefined();
    // Navnet står i KROPPEN, ikke i et felt hos dem — de har ikke et.
    expect(body.body).toContain("Hanne");
    expect(body.intakeKey).toBe("aidan-s-1");
  });

  it("uden brugerord oprettes INGEN sag — en tom samtale er ikke en henvendelse", async () => {
    let kaldt = false;
    globalThis.fetch = (async () => { kaldt = true; return new Response("{}", { status: 200 }); }) as unknown as typeof fetch;
    const { ctx, svar } = kontekst({ samtaleId: "s-2", samtale: [{ role: "assistant", content: "Hej!" }] });
    await handleSupportTriage(ctx);
    expect(svar.status).toBe(400);
    expect(kaldt).toBe(false);
  });

  it("uden samtale-id oprettes INGEN sag — uden den bliver hvert genforsøg en dublet", async () => {
    let kaldt = false;
    globalThis.fetch = (async () => { kaldt = true; return new Response("{}", { status: 200 }); }) as unknown as typeof fetch;
    const { ctx, svar } = kontekst({ samtale: SAMTALE });
    await handleSupportTriage(ctx);
    expect(svar.status).toBe(400);
    expect(kaldt).toBe(false);
  });

  it("fejler HelpDesk, lyver den ikke om en sag — den falder tilbage og siger det", async () => {
    delete process.env.HELPDESK_KEY;
    let reserve = false;
    globalThis.fetch = (async (u: string) => {
      if (String(u).includes("webhouse.app")) { reserve = true; return new Response(JSON.stringify({ ok: true }), { status: 200 }); }
      throw new Error("uventet");
    }) as unknown as typeof fetch;
    const { ctx, svar } = kontekst({ samtaleId: "s-3", navn: "Hanne", email: "hun@eksempel.dk", samtale: SAMTALE });
    await handleSupportTriage(ctx);
    expect(reserve).toBe(true);
    expect((svar.krop as { vej: string }).vej).toBe("reserve");
    expect((svar.krop as { ref?: string }).ref).toBeUndefined();   // ingen opdigtet reference
  });
});

describe("frafaldet — tilbudt mod oprettet", () => {
  beforeEach(() => Object.assign(triageTaeller, { tilbudt: 0, oprettet: 0, udenMail: 0 }));

  it("tæller ÉT tilbud pr. svar, ikke pr. linje", () => {
    taelTilbudtSag("Det kan jeg ikke slå op.\n[sag]\n[sag]");
    expect(triageTaeller.tilbudt).toBe(1);
  });

  it("tæller IKKE når markøren kun er nævnt i en sætning", () => {
    // Markøren gælder kun alene på sin egen linje — samme regel som
    // gengivelsen. Ellers ville et svar der FORKLARER markøren tælle som et
    // tilbud, og frafaldet ville se mindre ud end det er.
    taelTilbudtSag("Du kan skrive [sag] hvis du vil have et menneske.");
    expect(triageTaeller.tilbudt).toBe(0);
  });

  it("tæller intet på et almindeligt svar", () => {
    taelTilbudtSag("Vi bygger websites, webshops og platforme.");
    expect(triageTaeller.tilbudt).toBe(0);
  });

  it("`udenMail` tæller nu en sag med KUN telefon — fravalget findes ikke mere", async () => {
    // Prøven målte tidligere «Opret uden mail». Den knap er væk (Christian
    // 17/9: samme krav som formularen), så tælleren har fået en ny betydning
    // frem for at blive slettet: en sag HelpDesk ikke kan maile, fordi
    // kontakten er et telefonnummer. Den skelnen er stadig værd at kende.
    process.env.HELPDESK_KEY = "hd_live_test";
    process.env.HELPDESK_TENANT = "broberg-ai";
    const gemFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ ticket: { ref: "BR-T", state: "open", level: 0 }, created: true }), { status: 201 })
    ) as unknown as typeof fetch;

    const lav = (k: Record<string, unknown>) => ({
      req: { json: async () => ({ samtaleId: `s-${JSON.stringify(k)}`, samtale: [{ role: "user", content: "hjælp" }], navn: "Hanne", ...k }), header: () => undefined },
      json: () => new Response(null),
      get: () => undefined,
    } as never);

    triageTaeller.oprettet = 0; triageTaeller.udenMail = 0;
    await handleSupportTriage(lav({ email: "hun@eksempel.dk" }));
    await handleSupportTriage(lav({ telefon: "+45 20 12 34 56" }));
    globalThis.fetch = gemFetch;

    expect(triageTaeller.oprettet).toBe(2);
    expect(triageTaeller.udenMail).toBe(1);
  });

  function triageKtx(krop: Record<string, unknown>) {
    const svar: { status?: number; krop?: unknown } = {};
    return {
      ctx: {
        req: { json: async () => krop, header: () => undefined },
        json: (k: unknown, st = 200) => { svar.krop = k; svar.status = st; return new Response(null); },
        get: () => undefined,
      } as never,
      svar,
    };
  }

  it("uden NAVN oprettes ingen sag, uanset kontakt", async () => {
    const kaldt: string[] = [];
    globalThis.fetch = (async (u: string) => { kaldt.push(String(u)); return new Response("{}", { status: 200 }); }) as unknown as typeof fetch;
    const { ctx, svar } = triageKtx({ samtaleId: "s-n", samtale: [{ role: "user", content: "hjælp" }], email: "hun@eksempel.dk" });
    await handleSupportTriage(ctx);
    expect(svar.status).toBe(400);
    expect((svar.krop as { fejl: string }).fejl).toBe("kontakt_kraeves");
    expect(kaldt).toEqual([]);
  });

  it("med navn men UDEN både mail og telefon oprettes ingen sag", async () => {
    const kaldt: string[] = [];
    globalThis.fetch = (async (u: string) => { kaldt.push(String(u)); return new Response("{}", { status: 200 }); }) as unknown as typeof fetch;
    const { ctx, svar } = triageKtx({ samtaleId: "s-k", samtale: [{ role: "user", content: "hjælp" }], navn: "Hanne" });
    await handleSupportTriage(ctx);
    expect(svar.status).toBe(400);
    expect(kaldt).toEqual([]);
  });
});

/**
 * F024.5 — PORTEN SKAL KUNNE AFLÆSES.
 *
 * Turnstile er slukket for altid: Cloudflare er DATAANSVARLIG for signalerne,
 * så der findes ingen EU-indstilling at slå til. Christian skal vælge en
 * erstatning, og valget skal tages på et tal frem for en formodning.
 *
 * Den bærende prøve i blokken er den NEGATIVE KONTROL. Uden den ville en
 * tæller der voksede på noget helt andet bestå alle de øvrige.
 */
describe("F024.5 — spam-porten kan aflæses", () => {
  const gemEnv = { ...process.env };
  const gemFetch = globalThis.fetch;

  beforeEach(() => {
    _resetRateLimiter();
    spamTaeller.ialt = 0;
    spamTaeller.honeypot = 0;
    spamTaeller.hastighed = 0;
    spamTaeller.turnstile = 0;
    delete process.env.TURNSTILE_SECRET_KEY;
    delete process.env.HELPDESK_KEY;
  });
  afterEach(() => {
    globalThis.fetch = gemFetch;
    Object.assign(process.env, gemEnv);
    delete process.env.TURNSTILE_SECRET_KEY;
  });

  function kontekst(krop: Record<string, unknown>, ip?: string) {
    const svar: { status?: number; krop?: unknown } = {};
    return {
      ctx: {
        req: { json: async () => krop, header: (n: string) => (ip && n === "CF-Connecting-IP" ? ip : undefined) },
        json: (k: unknown, s = 200) => { svar.krop = k; svar.status = s; return new Response(null); },
        get: () => undefined,
      } as never,
      svar,
    };
  }

  /** Slipper alt igennem til reservevejen, så en indsendelse der PASSEREDE
   *  porten ikke fejler af en grund der intet har med porten at gøre. */
  function reservevejSvarer() {
    globalThis.fetch = (async () => new Response(JSON.stringify({ ok: true }), { status: 200 })) as unknown as typeof fetch;
  }

  it("honeypot tælles for sig — og rører ikke de to andre grunde", async () => {
    reservevejSvarer();
    const { ctx } = kontekst({ besked: "Jeg kan ikke logge ind", [HONEYPOT_FIELD]: "bot@eksempel.dk", navn: "Hanne" });
    await handleSupport(ctx);
    expect(spamTaeller.honeypot).toBe(1);
    expect(spamTaeller.hastighed).toBe(0);
    expect(spamTaeller.turnstile).toBe(0);
  });

  it("hastighedsgrænsen tælles for sig", async () => {
    reservevejSvarer();
    // Grænsen er 10 i timen. Nr. 11 fra samme adresse er den første afviste.
    for (let i = 0; i < 11; i++) {
      const { ctx } = kontekst({ besked: `henvendelse ${i}` }, "203.0.113.9");
      await handleSupport(ctx);
    }
    expect(spamTaeller.hastighed).toBe(1);
    expect(spamTaeller.honeypot).toBe(0);
    expect(spamTaeller.ialt).toBe(11);
  });

  it("MED nøglen tæller et forfalsket bevis på `turnstile`", async () => {
    process.env.TURNSTILE_SECRET_KEY = "0x-test";
    globalThis.fetch = (async () => new Response(JSON.stringify({ success: false }), { status: 200 })) as unknown as typeof fetch;
    const { ctx } = kontekst({ besked: "Jeg kan ikke logge ind", turnstileToken: "forfalsket", navn: "Hanne" });
    await handleSupport(ctx);
    expect(spamTaeller.turnstile).toBe(1);
  });

  it("NEGATIV KONTROL: uden nøglen tæller en indsendelse uden bevis NUL på `turnstile`", async () => {
    // Uden den her prøve ville en tæller der voksede hver gang porten blev
    // passeret bestå alle de øvrige — og `turnstile` ville rapportere et værn
    // der er slukket. Et nul der betyder to ting er ikke en måling.
    reservevejSvarer();
    expect(turnstileAktiv()).toBe(false);
    const { ctx, svar } = kontekst({ besked: "Jeg kan ikke logge ind", email: "hun@eksempel.dk", navn: "Hanne" });
    await handleSupport(ctx);
    expect((svar.krop as { ok: boolean }).ok).toBe(true);   // slap FAKTISK igennem
    expect(spamTaeller.turnstile).toBe(0);
  });

  it("`ialt` tæller også dem der slipper igennem — ellers kan afvist/ialt ikke regnes ud", async () => {
    reservevejSvarer();
    const { ctx } = kontekst({ besked: "Jeg kan ikke logge ind", navn: "Hanne" });
    await handleSupport(ctx);
    expect(spamTaeller.ialt).toBe(1);
    expect(spamTaeller.honeypot + spamTaeller.hastighed + spamTaeller.turnstile).toBe(0);
  });

  it("health viser tallene MED `turnstileAktiv` — et nul skal kunne skelnes fra en slukket vagt", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    const svar: { krop?: unknown } = {};
    const ctx = { json: (k: unknown) => { svar.krop = k; return new Response(null); } } as never;
    await handleAidanHealth(ctx);
    const spam = (svar.krop as { spam: Record<string, unknown> }).spam;
    expect(spam).toBeDefined();
    expect(spam.turnstileAktiv).toBe(false);
    expect(spam.ialt).toBe(0);
    expect(spam.turnstile).toBe(0);
  });
});

/**
 * F024.2 / AC#5 — «et nyt felt kan tilføjes uden at røre kaldet til HelpDesk».
 *
 * Påstanden var ikke sand da den blev skrevet: `kropFor` tog navn og mail som
 * hver sin parameter, så feltet efter dem ville have krævet en tredje. Nu er
 * der én dør — `ekstra` — og «Hvor skete det» er det første felt der går
 * igennem den. Prøven måler døren, ikke det ene felt.
 */
describe("F024.2 — formen kan udbygges", () => {
  it("et ekstra felt lander i sagens krop med sin etiket", () => {
    const k = kropFor("Knappen svarer ikke", "", "", [["Hvor skete det", "/flagskibe/cms"]]);
    expect(k).toContain("Hvor skete det: /flagskibe/cms");
    expect(k).toContain("Knappen svarer ikke");
  });

  it("et TOMT ekstra felt tilføjer INTET — ingen tom etiket i sagen", () => {
    // Et menneske der åbner sagen skal ikke læse «Hvor skete det:» og et
    // blankt felt. Ingenting er et bedre svar end en tom rubrik.
    expect(kropFor("Knappen svarer ikke", "", "", [["Hvor skete det", "   "]]))
      .not.toContain("Hvor skete det");
  });

  it("flere ekstra felter bevarer formularens rækkefølge", () => {
    const k = kropFor("x", "", "", [["A", "1"], ["B", "2"]]);
    expect(k.indexOf("A: 1")).toBeLessThan(k.indexOf("B: 2"));
  });

  it("den besøgendes egne ord står ØVERST — feltet skubber dem ikke ned", () => {
    const k = kropFor("Knappen svarer ikke", "", "", [["Hvor skete det", "/x"]]);
    expect(k.startsWith("Knappen svarer ikke")).toBe(true);
  });
});

/**
 * Christian, 16/9, efter at have set en sag uden nogen vej tilbage:
 *
 *   «En support formular der skal forstyrre os med et kunde problem SKAL have
 *    en mail eller et telefon nummer ellers kan den ikke afsendes. Vi gider
 *    ikke spilde tiden på den slags spam.»
 *
 * To ting på én gang, og begge holder. En henvendelse uden en vej tilbage kan
 * ikke besvares — hun venter på et svar der aldrig kan komme. Og et felt ingen
 * behøver udfylde er dét en bot udfylder mindst.
 */
describe("mail ELLER telefon er påkrævet", () => {
  const gemFetch2 = globalThis.fetch;
  afterEach(() => { globalThis.fetch = gemFetch2; });

  function ctx(krop: Record<string, unknown>) {
    const svar: { status?: number; krop?: unknown } = {};
    return {
      c: {
        req: { json: async () => krop, header: () => undefined },
        json: (k: unknown, s = 200) => { svar.krop = k; svar.status = s; return new Response(null); },
        get: () => undefined,
      } as never,
      svar,
    };
  }

  it("uden NAVN afvises den — samme krav som i chatten", async () => {
    const kaldt: string[] = [];
    globalThis.fetch = (async (u: string) => { kaldt.push(String(u)); return new Response("{}", { status: 200 }); }) as unknown as typeof fetch;
    const { c, svar } = ctx({ besked: "Jeg kan ikke logge ind", email: "hun@eksempel.dk" });
    await handleSupport(c);
    expect(svar.status).toBe(400);
    expect((svar.krop as { fejl: string }).fejl).toBe("kontakt_kraeves");
    expect(kaldt).toEqual([]);
  });

  it("uden BEGGE kontaktveje afvises den — og INTET kald forlader huset", async () => {
    // Det er den halvdel der gør det til en spærre frem for en besked: en
    // afvist henvendelse må ikke koste HelpDesk en sag eller reservevejen en
    // mail. Bliver der ringet ud, er den sluppet forbi.
    const kaldt: string[] = [];
    globalThis.fetch = (async (u: string) => { kaldt.push(String(u)); return new Response("{}", { status: 200 }); }) as unknown as typeof fetch;
    const { c, svar } = ctx({ besked: "Jeg kan ikke logge ind", navn: "Hanne" });
    await handleSupport(c);
    expect(svar.status).toBe(400);
    expect((svar.krop as { fejl: string }).fejl).toBe("kontakt_kraeves");
    expect(kaldt).toEqual([]);
  });

  it("KUN mail slipper igennem", async () => {
    globalThis.fetch = (async () => new Response(JSON.stringify({ ok: true }), { status: 200 })) as unknown as typeof fetch;
    const { c, svar } = ctx({ besked: "Jeg kan ikke logge ind", navn: "Hanne", email: "hun@eksempel.dk" });
    await handleSupport(c);
    expect(svar.status).not.toBe(400);
  });

  it("KUN telefon slipper igennem — ellers var det ikke «eller»", async () => {
    globalThis.fetch = (async () => new Response(JSON.stringify({ ok: true }), { status: 200 })) as unknown as typeof fetch;
    const { c, svar } = ctx({ besked: "Jeg kan ikke logge ind", navn: "Hanne", telefon: "+45 20 12 34 56" });
    await handleSupport(c);
    expect(svar.status).not.toBe(400);
  });

  it("mellemrum tæller ikke som et telefonnummer", async () => {
    const { c, svar } = ctx({ besked: "Jeg kan ikke logge ind", navn: "Hanne", telefon: "   ", email: "  " });
    await handleSupport(c);
    expect(svar.status).toBe(400);
  });

  it("telefonnummeret står i sagens krop, så mennesket kan ringe", () => {
    const k = kropFor("Jeg kan ikke logge ind", "", "", [["Telefon", "+45 20 12 34 56"]]);
    expect(k).toContain("Telefon: +45 20 12 34 56");
  });
});

/**
 * F024.7 / AC#1 — RÆKKEFØLGEN er hele featuren.
 *
 * En prøve der kun måler at køen KAN skrives, beviser ikke at den skrives
 * FØR. Derfor lægges kaldet ned, og teksten skal findes i køen bagefter.
 */
describe("F024.7 — hendes tekst gemmes FØR vi ringer", () => {
  const KO = "/tmp/test-rute-ko.jsonl";
  const gemF = globalThis.fetch;
  beforeEach(async () => { process.env.SUPPORT_KO = KO; await rm(KO, { force: true }); });
  afterEach(() => { globalThis.fetch = gemF; delete process.env.SUPPORT_KO; });

  function k(krop: Record<string, unknown>) {
    const svar: { status?: number; krop?: unknown } = {};
    return {
      ctx: { req: { json: async () => krop, header: () => undefined },
             json: (x: unknown, st = 200) => { svar.krop = x; svar.status = st; return new Response(null); },
             get: () => undefined } as never,
      svar,
    };
  }

  it("HelpDesk nede → teksten står i køen, og svaret siger vi HAR den", async () => {
    delete process.env.HELPDESK_KEY;
    globalThis.fetch = (async () => new Response("nej", { status: 500 })) as unknown as typeof fetch;
    const { ctx, svar } = k({ besked: "Min faktura mangler et bilag", navn: "Hanne", email: "hun@eksempel.dk" });
    await handleSupport(ctx);

    const linjer = (await readFile(KO, "utf-8")).split("\n").filter(Boolean).map((l) => JSON.parse(l));
    expect(linjer.length).toBe(1);
    expect(JSON.stringify(linjer[0].kald)).toContain("Min faktura mangler et bilag");
    expect(linjer[0].leveret).toBeUndefined();

    // Hun må IKKE få at vide at det mislykkedes — så ville hun sende igen og
    // lave en dublet af noget vi allerede har.
    expect((svar.krop as { ok: boolean; vej: string }).ok).toBe(true);
    expect((svar.krop as { vej: string }).vej).toBe("ko");
  });

  it("LYKKET levering markeres — så dræningen aldrig rører den igen", async () => {
    process.env.HELPDESK_KEY = "hd_live_test";
    process.env.HELPDESK_TENANT = "broberg-ai";
    process.env.HELPDESK_BASE = "http://127.0.0.1:1";
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ ticket: { ref: "BR-KO1", state: "open", level: 0 } }), { status: 201 })
    ) as unknown as typeof fetch;
    const { ctx } = k({ besked: "Jeg kan ikke logge ind", navn: "Hanne", email: "hun@eksempel.dk" });
    await handleSupport(ctx);

    const p = JSON.parse((await readFile(KO, "utf-8")).split("\n").filter(Boolean)[0]!);
    expect(p.ref).toBe("BR-KO1");
    expect(typeof p.leveret).toBe("number");
  });

  it("en AFVIST henvendelse skriver INTET i køen — køen er ikke et affaldsspand", async () => {
    globalThis.fetch = (async () => new Response("{}", { status: 200 })) as unknown as typeof fetch;
    const { ctx, svar } = k({ besked: "Jeg kan ikke logge ind" });   // intet navn, ingen kontakt
    await handleSupport(ctx);
    expect(svar.status).toBe(400);
    await expect(readFile(KO, "utf-8")).rejects.toThrow();           // filen findes slet ikke
  });
});

/**
 * F024.8 — flagskibet er BONUS-INFO. Christian: «Nej et ekstra felt som bonus
 * info» — altså ikke et krav, og ikke en produktdimension hos HelpDesk (de har
 * ingen; jeg probede: `produkt` giver 400).
 */
describe("F024.8 — flagskibet som bonus-info", () => {
  it("valget lander i sagens krop med sin etiket", () => {
    const k = kropFor("Knappen svarer ikke", "", "", [["Flagskib", "cms"]]);
    expect(k).toContain("Flagskib: cms");
  });

  it("INTET valg efterlader ingen tom rubrik — feltet er valgfrit", () => {
    // Den der ikke ved hvilket produkt det er, må ikke efterlade et spor der
    // ligner et ubesvaret spørgsmål hos den der skal hjælpe.
    expect(kropFor("Knappen svarer ikke", "", "", [["Flagskib", ""]])).not.toContain("Flagskib");
  });

  it("det blokerer ALDRIG en indsendelse", async () => {
    const gem = globalThis.fetch;
    globalThis.fetch = (async () => new Response(JSON.stringify({ ok: true }), { status: 200 })) as unknown as typeof fetch;
    const svar: { status?: number } = {};
    const ctx = {
      req: { json: async () => ({ besked: "Jeg kan ikke logge ind", navn: "Hanne", email: "h@e.dk" }), header: () => undefined },
      json: (_k: unknown, s = 200) => { svar.status = s; return new Response(null); },
      get: () => undefined,
    } as never;
    await handleSupport(ctx);
    globalThis.fetch = gem;
    expect(svar.status).not.toBe(400);
  });
});
