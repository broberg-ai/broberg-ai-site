/**
 * F024.2 — supportformularens serverrute.
 *
 * ── HVORFOR DEN IKKE POSTER DIREKTE TIL HELPDESK ─────────────────────────
 * HelpDesks regel er utvetydig: server til server, aldrig fra en browser.
 * Vores side → vores backend → dem. Nøglen når aldrig et JS-bundt.
 *
 * ── DEN VIGTIGSTE BESLUTNING: HENVENDELSEN MÅ IKKE KUNNE FORSVINDE ───────
 * Fejler HelpDesk, står der et menneske i den anden ende som tror hun har
 * rakt ud. Så ruten falder tilbage til CMS'ets formular-motor — den samme
 * der allerede bærer kontaktformularen og allerede når et menneske.
 *
 * Reservevejen er ikke et plaster: det er dét der gør forskellen på en
 * fattigere oplevelse og et tabt menneske. Og svaret SIGER hvilken vej der
 * blev brugt, så «det virkede» ikke dækker over at HelpDesk var nede i en uge.
 *
 * ── MAILADRESSEN: HUN GAV DEN FOR AT BLIVE KONTAKTET ─────────────────────
 * Første udgave sendte den ALDRIG videre. Formularen spurgte om den, skrev
 * «så vi kan vende tilbage» under feltet — og smed den væk. Et løfte jeg
 * gjorde umuligt at holde. Målt af HelpDesk 15/9: 18 sager uden nogen måde at
 * svare på.
 *
 * Fejlen var min læsning af deres afsnit 6. Det handler om ikke at SENDE til
 * en adresse man ikke har grund til at tro på. En adresse en person selv
 * skriver i et felt der siger «så vi kan vende tilbage», ER en grund til at
 * tro på den — det er hele formålet hun skrev den til.
 *
 * Den går derfor med som requesterEmail OG står i kroppen, så mennesket kan se
 * hvor den kom fra.
 */
import type { Context } from "hono";
import { isHoneypotTriggered, hashIp, isRateLimited, validateTurnstile } from "@broberg/forms-turnstile/server";
import { opretSag, HelpDeskFejl } from "@/helpdesk.ts";

const CMS_FORMULAR = "https://webhouse.app/api/forms/contact?site=broberg-ai";

/**
 * F024.3 — FRAFALDET, målt frem for gættet.
 *
 * HelpDesks deflection-tal kan ikke se hvor tit Aidan giver op. Det tæller
 * «Aidan gav op OG hun trykkede» — og siden vi begyndte at spørge om en
 * mailadresse, er der endnu et sted hun kan falde fra.
 *
 * `tilbudt` tælles på SERVEREN når markøren står i Aidans svar, ikke i
 * browseren: en tæller der kræver et ekstra kald fra klienten mangler præcis
 * de gange nogen lukkede fanen — altså den halvdel vi måler for at finde.
 *
 * Forskellen mellem de to tal ER frafaldet. Hverken tallet alene siger noget.
 */
export const triageTaeller = { tilbudt: 0, oprettet: 0, udenMail: 0 };

/** Kaldes med Aidans færdige svar. Tæller ét tilbud pr. svar, ikke pr. linje. */
export function taelTilbudtSag(svar: string): void {
  if (/^\s*\[sag\]\s*$/m.test(svar)) triageTaeller.tilbudt++;
}

export interface SupportSvar {
  ok: boolean;
  /** Sagens reference — kun når HelpDesk tog imod. Kan læses op i telefonen. */
  ref?: string;
  /** Hvilken vej henvendelsen faktisk gik. Aldrig gættet af kalderen. */
  vej: "helpdesk" | "reserve" | "ingen";
  fejl?: string;
}

/** Emnet skal kunne stå på en mail. Er der intet, laves det af beskeden —
 *  frem for at sende en tom streng HelpDesk så afviser med 400. */
export function emneFor(emne: string, besked: string): string {
  const rent = emne.trim();
  if (rent) return rent.slice(0, 120);
  const foerste = besked.trim().split(/\r?\n/)[0] ?? "";
  return (foerste.slice(0, 80) || "Henvendelse fra broberg.ai").trim();
}

/**
 * Sagens krop. Navn og mail står HER som oplyste formodninger, ikke som
 * felter nogen kan handle på uden at læse dem.
 */
export function kropFor(besked: string, navn?: string, email?: string): string {
  const linjer = [besked.trim()];
  const oplyst: string[] = [];
  if (navn?.trim()) oplyst.push(`navn: ${navn.trim()}`);
  if (email?.trim()) oplyst.push(`mail: ${email.trim()}`);
  if (oplyst.length) {
    linjer.push(
      "",
      `— Oplyst af den besøgende, IKKE bekræftet: ${oplyst.join(" · ")}`,
      "  (skrevet i et felt på broberg.ai; ingen har bevist at adressen er deres)",
    );
  }
  return linjer.join("\n");
}

/** Reservevejen: CMS'ets formular-motor, som allerede når et menneske. */
async function tilReserve(navn: string, email: string, besked: string): Promise<boolean> {
  try {
    const r = await fetch(CMS_FORMULAR, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: navn || "(ikke oplyst)",
        email: email || "",
        message: `[SUPPORT — HelpDesk svarede ikke]\n\n${besked}`,
      }),
    });
    const j = (await r.json().catch(() => ({}))) as { ok?: boolean };
    return Boolean(r.ok && j.ok);
  } catch {
    return false;
  }
}

/**
 * Spam-porten. TRE værn, og det tredje er MØRKT indtil en hemmelighed er sat.
 *
 * honeypot + hastighedsgrænse kræver ingen tredjepart og sender ikke én
 * personoplysning ud af huset. De kører altid.
 *
 * TURNSTILE er en anden slags handel, og den er Christians at tage:
 * widgeten sender den besøgendes IP-ADRESSE, TLS-FINGERAFTRYK og USER-AGENT
 * til Cloudflare. Målt 15/9-2026 i Cloudflares eget Turnstile-tillæg: det
 * oplyser HVAD der indsamles og IKKE hvor behandlingen sker — hverken region,
 * land eller overførselsgrundlag. En IP-adresse er en personoplysning efter
 * GDPR uanset at Cloudflare skriver at de ikke selv kan sætte navn på den.
 *
 * Derfor er koden her og slukket: uden TURNSTILE_SECRET_KEY springes
 * verifikationen over, og de to andre værn bærer alene. Sættes nøglen, virker
 * det tredje fra samme sekund uden en udrulning.
 *
 * SHIP DARK ER RIGTIGT HER OG FORKERT FOR SAGSOPRETTELSEN. Forskellen er den
 * samme som mod Trail: et manglende værn gør formularen svagere, en tabt
 * henvendelse taber et menneske.
 */
const MAKS_PR_TIME = 10;

export function turnstileAktiv(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

/**
 * F024.5 — PORTEN AFVISTE TAVST.
 *
 * Indtil nu returnerede den en boolean, ruten svarede det samme som ved et
 * tomt felt, og der blev ikke skrevet en linje. Porten virkede — og var
 * usynlig for alt andet end en læsning af kildeteksten.
 *
 * Den koster os et svar vi skal bruge: Turnstile er slukket for altid
 * (Cloudflare er DATAANSVARLIG for signalerne, så der findes ingen
 * EU-indstilling), og valget af erstatning skal tages på et tal frem for en
 * formodning. Uden en tæller ved vi ikke om vi har et bot-problem overhovedet.
 *
 * OPDELT PÅ GRUND, ikke ét samlet tal. «17 afvist» kan ikke svare på om en
 * captcha ville have hjulpet; honeypot og hastighedsgrænse fanger noget helt
 * andet end et bevis-tjek gør.
 *
 * NUL BETYDER TO TING, og det er hele grunden til at `turnstileAktiv` står ved
 * siden af tallene i health-svaret: `turnstile: 0` er enten «ingen forsøgte at
 * snyde» eller «vagten er slukket». De renderer ens. Et tal uden sin egen
 * tilstand er præcis det instrument der fejler i den grønne retning.
 */
export const spamTaeller = { ialt: 0, honeypot: 0, hastighed: 0, turnstile: 0 };

type SpamGrund = "honeypot" | "hastighed" | "turnstile";

/** Grunden til afvisning, eller null når indsendelsen slap igennem. */
async function spamGrund(c: Context, krop: Record<string, unknown>): Promise<SpamGrund | null> {
  if (isHoneypotTriggered(krop)) return "honeypot";
  const ip = c.req.header("CF-Connecting-IP") ?? c.req.header("x-forwarded-for") ?? "";
  if (ip && isRateLimited(hashIp(ip), "support", MAKS_PR_TIME)) return "hastighed";
  // ER VAGTEN SLUKKET, TÆLLER DEN INTET. Talte vi her, ville `turnstile`
  // vokse på indsendelser ingen vagt så på — og tallet ville se ud som om et
  // værn arbejdede. Den negative kontrol i testen holder præcis denne linje.
  if (!turnstileAktiv()) return null;
  // Er værnet TÆNDT, er en manglende bevis-streng et afslag — ikke en
  // undtagelse. Ellers ville enhver kunne slippe forbi ved at lade feltet tomt.
  const bevis = String(krop.turnstileToken ?? "");
  if (!bevis) return "turnstile";
  const gyldigt = await validateTurnstile(bevis, process.env.TURNSTILE_SECRET_KEY!, ip || undefined);
  return gyldigt ? null : "turnstile";
}

/** POST /api/support */
export async function handleSupport(c: Context): Promise<Response> {
  const krop = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  // `ialt` tælles FØR porten, så afvist/ialt kan regnes ud. Tælles den efter,
  // mangler præcis de forsøg vi måler for at finde.
  spamTaeller.ialt++;
  const grund = await spamGrund(c, krop);
  // Et blokeret forsøg får SAMME svar som et tomt felt. En bot skal ikke
  // kunne læse af svaret om den blev opdaget. Tælleren er vores, ikke dens.
  if (grund) {
    spamTaeller[grund]++;
    return c.json<SupportSvar>({ ok: false, vej: "ingen", fejl: "skriv_en_besked" }, 400);
  }
  const besked = String(krop.besked ?? "").trim();
  const navn = String(krop.navn ?? "").trim();
  const email = String(krop.email ?? "").trim();
  const emne = emneFor(String(krop.emne ?? ""), besked);

  if (besked.length < 5) {
    return c.json<SupportSvar>({ ok: false, vej: "ingen", fejl: "skriv_en_besked" }, 400);
  }

  try {
    const sag = await opretSag({
      emne,
      krop: kropFor(besked, navn, email),
      // STABIL pr. henvendelse, ENS ved genforsøg: indholdets fingeraftryk.
      // Ikke et tidsstempel — så ville nøglen være værdiløs ved netop det
      // genforsøg den findes for.
      intakeKey: await fingeraftryk(`${emne}\n${besked}\n${email}`),
      // intent udelades: vi ved det ikke, og et forkert intent er værre end
      // intet, fordi det ser målt ud.
      ...(email ? { kontaktEmail: email } : {}),
    });
    return c.json<SupportSvar>({ ok: true, ref: sag.ref, vej: "helpdesk" });
  } catch (e) {
    // HER er forskellen fra Trail. Vi svarer ikke bare «beklager».
    const reddet = await tilReserve(navn, email, besked);
    const grund = e instanceof HelpDeskFejl ? `${e.status}: ${e.message}` : String(e);
    console.error("[support] HelpDesk afviste — reservevej:", reddet ? "ok" : "FEJLEDE", grund);
    return c.json<SupportSvar>(
      reddet
        ? { ok: true, vej: "reserve" }
        : { ok: false, vej: "ingen", fejl: "ingen_vej_naaede_frem" },
      reddet ? 200 : 502,
    );
  }
}

/**
 * F024.3 — Aidan triagerer: samtalen bliver til en sag.
 *
 * SAMTALEN ER SAGENS KROP, ikke kun den sidste sætning. Et menneske der åbner
 * sagen skal kunne læse hvad der er prøvet, så hun ikke stiller de spørgsmål
 * Aidan allerede har stillet. Det er hele forskellen på en triage og en
 * henvisning.
 *
 * intakeKey er SAMTALENS id — stabilt på tværs af genforsøg, unikt pr. sag.
 * Trykker den besøgende to gange, får hun den samme sag igen (created:false),
 * ikke en dublet.
 */
export async function handleSupportTriage(c: Context): Promise<Response> {
  const krop = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const samtale = Array.isArray(krop.samtale) ? (krop.samtale as Array<Record<string, unknown>>) : [];
  const samtaleId = String(krop.samtaleId ?? "").trim();
  // Adressen hun skrev i boksen da hun bad om et menneske. Tom = hun valgte
  // «opret uden mail», og DET skal kunne ses på sagen frem for at ligne en
  // forglemmelse.
  const email = String(krop.email ?? "").trim();
  const replikker = samtale
    .map((m) => ({ rolle: String(m.role ?? ""), tekst: String(m.content ?? "").trim() }))
    .filter((m) => m.tekst && (m.rolle === "user" || m.rolle === "assistant"));

  const brugerensOrd = replikker.filter((m) => m.rolle === "user");
  if (!brugerensOrd.length || !samtaleId) {
    return c.json<SupportSvar>({ ok: false, vej: "ingen", fejl: "ingen_samtale" }, 400);
  }

  const udskrift = replikker
    .map((m) => `${m.rolle === "user" ? "Besøgende" : "Aidan"}: ${m.tekst}`)
    .join("\n\n");

  try {
    const sag = await opretSag({
      // Emnet er den besøgendes FØRSTE spørgsmål — det hun kom for. Det sidste
      // er typisk «må jeg tale med et menneske», og det er ikke hvad sagen
      // handler om.
      emne: emneFor("", brugerensOrd[0]!.tekst),
      krop: [
        "Aidan kunne ikke svare, og den besøgende bad om et menneske.",
        email
          ? `Hun oplyste ${email} da hun bad om at blive kontaktet.`
          : "HUN VALGTE AT IKKE OPLYSE EN ADRESSE. Sagen kan ikke besvares — hun har kun referencen.",
        "",
        "HELE SAMTALEN:",
        "",
        udskrift,
      ].join("\n"),
      intakeKey: `aidan-${samtaleId}`,
      ...(email ? { kontaktEmail: email } : {}),
      // intent udelades: Aidan ved det ikke, og HelpDesks egen klassifikator er
      // bedre til det end et gæt fra en chat-prompt.
      // bekraeftetEmail udelades: en adresse i en chat er ikke mere bekræftet
      // end en i et felt.
    });
    triageTaeller.oprettet++;
    if (!email) triageTaeller.udenMail++;
    return c.json<SupportSvar>({ ok: true, ref: sag.ref, vej: "helpdesk" });
  } catch (e) {
    const reddet = await tilReserve("(via Aidan)", "", udskrift);
    console.error("[triage] HelpDesk afviste — reservevej:", reddet ? "ok" : "FEJLEDE", String(e));
    return c.json<SupportSvar>(
      reddet ? { ok: true, vej: "reserve" } : { ok: false, vej: "ingen", fejl: "ingen_vej_naaede_frem" },
      reddet ? 200 : 502,
    );
  }
}

async function fingeraftryk(s: string): Promise<string> {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return `bai-${[...new Uint8Array(b)].slice(0, 8).map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}
