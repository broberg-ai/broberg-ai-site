/**
 * F024.1 — broberg.ai som HelpDesk-kunde. Samme form som Trail-opslaget i
 * aidan.ts: nøglen bor i miljøet, kaldet sker på serveren, og bidraget er et
 * TAL på /api/aidan/health frem for en påstand.
 *
 * ── DEN ENE STEDS FORSKEL FRA TRAIL, og den er med vilje ──────────────────
 *
 * Trail er ship-dark: uden token springes opslaget over, og Aidan svarer
 * videre. Det er rigtigt for en VIDENSBASE — et manglende opslag gør svaret
 * fattigere.
 *
 * Det er FORKERT for en henvendelse. Fejler en sagsoprettelse, er der et
 * menneske i den anden ende som tror hun har rakt ud. Derfor KASTER denne
 * modul ved fejl frem for at returnere tomt: kalderen SKAL forholde sig til
 * det og falde tilbage til noget der stadig når et menneske.
 *
 * Forskellen er en manglende forstærkning mod et tabt menneske.
 * helpdesk-sessionen om netop dette: «Den skelnen er skarpere end noget der
 * står i vores egen doc. Byg den.»
 *
 * ── KONTRAKTEN ────────────────────────────────────────────────────────────
 * docs/integration/HELPDESK-API-FOR-VAERTER.md i broberg-ai/helpdesk.
 * Kontraktprøven er kørt mod vores egen tenant 15/9-2026 og var grøn hele
 * vejen, inkl. de negative kontroller (uden nøgle → 401).
 */
/**
 * Adressen læses PR. KALD, ikke én gang ved import.
 *
 * Som konstant var den frosset i det øjeblik modulet blev indlæst — altså før
 * en prøve nåede at sætte HELPDESK_BASE. Følgen var ikke at prøven blev
 * langsom: den RAMTE PRODUKTIONEN med en falsk nøgle og bestod, fordi 401 også
 * kaster. «ingen lytter på port 1» stod i kommentaren og var ikke sandt.
 *
 * Målt 16/9: 79 ms, svar «Ugyldig eller tilbagekaldt nøgle» fra deres rigtige
 * API. Hver fuld testkørsel sendte altså en ugyldig hd_live-nøgle til en
 * fremmed produktionstjeneste — og prøven var grøn af den forkerte grund.
 */
const base = () => process.env.HELPDESK_BASE ?? "https://api.helpdesk.broberg.ai";
const TIMEOUT_MS = 8_000;

export function helpdeskKonfigureret(): boolean {
  return Boolean(process.env.HELPDESK_KEY && process.env.HELPDESK_TENANT);
}

/** Bidraget som et tal, ikke en påstand — samme grund som trailTaeller.
 *  `dubletter` er ikke en fejltælling: et genkald med samme intakeKey ER
 *  meningen, og at kunne SE at det sker er hvordan man opdager at et genforsøg
 *  løber løbsk. */
export const helpdeskTaeller = { forsoeg: 0, ok: 0, dubletter: 0, fejl: 0, sidsteMs: 0 };

export class HelpDeskFejl extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "HelpDeskFejl";
  }
}

export interface NySag {
  /** Påkrævet. Kort nok til at stå som emne på en mail. */
  emne: string;
  /** Påkrævet. Brugerens ord + den kontekst mennesket skal bruge. */
  krop: string;
  /**
   * STABIL pr. sag, ENS ved genforsøg. Vores samtale-id eller formularens
   * id — aldrig et tidsstempel eller et tilfældigt tal pr. forsøg, for så er
   * den værdiløs. Uden den bliver hvert genforsøg en ny sag, og et genforsøg
   * er normal drift.
   */
  intakeKey: string;
  /**
   * ADRESSEN DEN BESØGENDE GAV FOR AT BLIVE KONTAKTET.
   *
   * Første udgave af dette felt hed `bekraeftetEmail` og blev ALDRIG udfyldt,
   * fordi jeg læste HelpDesks afsnit 6 som «send kun en adresse du har
   * verificeret». Resultatet, målt af dem 15/9: 18 sager uden nogen måde at
   * svare på. Christian så det i indbakken: «hvordan skal vi komme i kontakt
   * med et menneske vi ikke kender?»
   *
   * SKELNEN JEG MISSEDE: afsnit 6 handler om ikke at SENDE til en adresse man
   * ikke har grund til at tro på. En adresse tastet i forbifarten er sådan en.
   * En adresse en person selv skriver i svaret på «hvordan får vi fat i dig?»
   * er præcis dét: en grund til at tro på den. De to ser ens ud i et felt og
   * er forskellige i hensigt.
   *
   * Så: udfyld den KUN når den besøgende gav adressen for at blive kontaktet
   * om DENNE sag. Aldrig en adresse hentet fra en profil, en tidligere
   * formular eller en sætning i en samtale der handlede om noget andet.
   */
  kontaktEmail?: string;
  /**
   * §6b — nummeret hun gav i stedet for, eller ved siden af, en mailadresse.
   *
   * Det er et FELT og ikke et mærke, fordi et mærke plus et nummer i kroppen
   * ville lægge en kendsgerning et sted et menneske kan læse den og et system
   * ikke kan spørge på. HelpDesk foreslog mærket og skiftede mening; deres
   * `requesterPhoneVerified` står ALTID på 0, fordi der ikke findes nogen måde
   * at bevise et nummer på — der er ikke et link at klikke på.
   */
  kontaktTelefon?: string;
  /**
   * Udelades med vilje når vi ikke VED det. Deres ord: et forkert intent er
   * værre end intet, fordi det ser målt ud. Uden feltet klassificerer de selv.
   */
  intent?: string;
  /**
   * §3.5 — HVILKEN AF VORES FLADER sagen kom fra. Fri tekst; vi navngiver
   * vores egne. HelpDesks `kilde` svarer på hvilken af DERES døre den kom ind
   * ad (`vaert-api` for os begge veje) — to dimensioner, to felter.
   *
   * Udelades den, står den som null hos dem: «ikke oplyst» og «oplyst som
   * ingenting» skal kunne skelnes. Vi sender den altid.
   */
  kanal?: string;
}

export interface Sag {
  ref: string;
  state: string;
  level: number;
  /** false = samme intakeKey er set før, og vi fik den EKSISTERENDE sag. */
  oprettet: boolean;
}

async function kald(sti: string, init: RequestInit = {}): Promise<Response> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${base()}${sti}`, {
      ...init,
      signal: ctl.signal,
      headers: {
        Authorization: `Bearer ${process.env.HELPDESK_KEY}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Åbn en sag. KASTER ved enhver fejl — se modulets hoved.
 *
 * 201 = ny sag · 200 = intakeKey var set før, og vi får den samme sag tilbage.
 * Begge er succes; kun `oprettet` skelner.
 */
export async function opretSag(sag: NySag): Promise<Sag> {
  if (!helpdeskKonfigureret()) {
    throw new HelpDeskFejl(503, "HelpDesk er ikke konfigureret (HELPDESK_KEY/HELPDESK_TENANT mangler)");
  }
  const start = Date.now();
  helpdeskTaeller.forsoeg++;
  try {
    const svar = await kald(`/v1/tenants/${process.env.HELPDESK_TENANT}/tickets`, {
      method: "POST",
      body: JSON.stringify({
        subject: sag.emne,
        body: sag.krop,
        intakeKey: sag.intakeKey,
        ...(sag.kontaktEmail ? { requesterEmail: sag.kontaktEmail } : {}),
        ...(sag.intent ? { intent: sag.intent } : {}),
        ...(sag.kanal ? { kanal: sag.kanal } : {}),
        ...(sag.kontaktTelefon ? { requesterPhone: sag.kontaktTelefon } : {}),
      }),
    });
    const tekst = await svar.text();
    if (!svar.ok) {
      // Deres fejltekster er skrevet til et menneske og på dansk. Log dem
      // ordret frem for at oversætte en statuskode til noget vagere.
      throw new HelpDeskFejl(svar.status, tekst.slice(0, 300));
    }
    const data = JSON.parse(tekst) as { ticket?: Record<string, unknown>; created?: boolean };
    const t = data.ticket;
    if (!t || typeof t.ref !== "string") {
      throw new HelpDeskFejl(502, `svaret bar ingen sags-reference: ${tekst.slice(0, 200)}`);
    }
    const oprettet = data.created !== false;
    if (!oprettet) helpdeskTaeller.dubletter++;
    helpdeskTaeller.ok++;
    return { ref: t.ref, state: String(t.state ?? "open"), level: Number(t.level ?? 0), oprettet };
  } catch (e) {
    helpdeskTaeller.fejl++;
    throw e instanceof HelpDeskFejl
      ? e
      : new HelpDeskFejl(0, e instanceof Error ? e.message : String(e));
  } finally {
    helpdeskTaeller.sidsteMs = Date.now() - start;
  }
}

/** Læs en sag tilbage. Vi bygger IKKE vores egen kopi af tilstanden — `ref`
 *  er identiteten, og to kopier driver fra hinanden første gang en af os
 *  retter noget (deres afsnit 5). */
export async function laesSag(ref: string): Promise<Record<string, unknown>> {
  if (!helpdeskKonfigureret()) throw new HelpDeskFejl(503, "HelpDesk er ikke konfigureret");
  const svar = await kald(`/v1/tenants/${process.env.HELPDESK_TENANT}/tickets/${encodeURIComponent(ref)}`);
  if (!svar.ok) throw new HelpDeskFejl(svar.status, (await svar.text()).slice(0, 300));
  return (await svar.json()) as Record<string, unknown>;
}

/** Skriv videre i en åben sag, så en samtale der fortsætter i chatten bliver
 *  ÉT forløb hos dem i stedet for to. */
export async function skrivISagen(ref: string, tekst: string): Promise<void> {
  if (!helpdeskKonfigureret()) throw new HelpDeskFejl(503, "HelpDesk er ikke konfigureret");
  const svar = await kald(
    `/v1/tenants/${process.env.HELPDESK_TENANT}/tickets/${encodeURIComponent(ref)}/messages`,
    { method: "POST", body: JSON.stringify({ body: tekst }) },
  );
  if (!svar.ok) throw new HelpDeskFejl(svar.status, (await svar.text()).slice(0, 300));
}

/** Til /api/aidan/health — samme form som trail-blokken. */
export function helpdeskStatus() {
  return { konfigureret: helpdeskKonfigureret(), ...helpdeskTaeller };
}

export function _nulstilTaeller(): void {
  Object.assign(helpdeskTaeller, { forsoeg: 0, ok: 0, dubletter: 0, fejl: 0, sidsteMs: 0 });
}
