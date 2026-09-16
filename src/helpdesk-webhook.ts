/**
 * F024.6 — modtageren for HelpDesks hændelser.
 *
 * ── MØRKT BETYDER LUKKET HER, OG DET ER EN ANDEN BESLUTNING END RESTEN ────
 * Huset skiber mørkt: en integration er inert indtil dens hemmelighed er sat.
 * For Turnstile betyder det «spring kontrollen over, de andre værn bærer» —
 * et manglende værn gør en formular svagere. For en SKRIVEDØR betyder det
 * noget andet: uden signatur-kontrol kan enhver der kender URL'en fortælle os
 * at en sag skiftede tilstand.
 *
 * Derfor svarer ruten 503 og tager INTET imod uden hemmeligheden.
 * Ship dark må aldrig betyde ship open.
 *
 * ── HVAD DER IKKE ER AFKLARET ────────────────────────────────────────────
 * Signatur-SKEMAET er spurgt om og ikke besvaret: headerens navn, hvad der
 * signeres (rå krop eller en sammensat streng med tidsstempel), og om der
 * håndhæves et tidsvindue.
 *
 * Jeg har IKKE gættet. En HMAC over den rå krop er det mest almindelige valg,
 * og havde jeg skrevet den og testet mod min egen antagelse, ville prøverne
 * være grønne mod noget der kunne være forkert — dagens gennemgående fejlform,
 * bare med en uge til at modne i. `verificer()` kaster derfor indtil skemaet
 * er bekræftet, og det er en MÅLBAR tilstand frem for en tavs.
 *
 * ── DEN VIGTIGSTE EGENSKAB: RÆKKEFØLGEN ER IKKE GARANTERET ───────────────
 * HelpDesk målte det i deres egen kode: hvert udsend er fire-and-forget med
 * sin egen bagstop, så `state_changed` kan ankomme FØR `created`. Det havde
 * jeg ikke bygget imod af mig selv — ordet «oprettet» lyder som noget der
 * kommer først.
 */
import type { Context } from "hono";
import { createHmac, timingSafeEqual } from "node:crypto";

export const webhookTaeller = {
  modtaget: 0,
  afvistSignatur: 0,
  forGammel: 0,
  dubletter: 0,
  ukendtType: 0,
  /** Hændelser vi selv udløste og derfor ignorerede — løkke-spærren. */
  egneEkko: 0,
};

/** Sager vi har set en hændelse for. Nøgle: `${ref}:${type}`. */
const sete = new Set<string>();

/** Sagens sidst kendte tilstand hos dem. Nøgle: ref. */
export const sagsTilstand = new Map<string, string>();

export function nulstilWebhookHukommelse(): void {
  sete.clear();
  sagsTilstand.clear();
  webhookTaeller.modtaget = 0;
  webhookTaeller.afvistSignatur = 0;
  webhookTaeller.forGammel = 0;
  webhookTaeller.dubletter = 0;
  webhookTaeller.ukendtType = 0;
  webhookTaeller.egneEkko = 0;
}

export function webhookKonfigureret(): boolean {
  return Boolean(process.env.HELPDESK_WEBHOOK_SECRET);
}

/** Hvor gammelt et kald må være. HelpDesk håndhæver INTET vindue — det er
 *  vores, og det kan kun være vores fordi tidsstemplet er MED i det der
 *  signeres. Signeredes kun kroppen, kunne et gammelt gyldigt kald afspilles
 *  ordret i morgen, og signaturen ville stadig passe fordi den intet sagde om
 *  hvornår. */
const VINDUE_MS = 5 * 60_000;

export type Afvisning = "mangler-header" | "for-gammel" | "forkert-signatur";

/**
 * Efterprøver afsenderen. Returnerer null når kaldet er ægte.
 *
 * SKEMAET ER HELPDESKS, MÅLT AF DEM OG KRYDSTJEKKET I PYTHON — ikke min
 * genopbygning af en beskrivelse. Prøverne kører mod DERES vektor, så en
 * fejl i min læsning bliver rød frem for grøn: en test mod min egen antagelse
 * ville have bevist at jeg er enig med mig selv.
 *
 * KROPPEN BRUGES SOM MODTAGET. Parser vi JSON og serialiserer igen, skifter
 * nøglerækkefølge og mellemrum, og signaturen holder ikke.
 */
export function verificer(
  raaKrop: string,
  headere: Headers,
  nuMs: number = Date.now(),
): Afvisning | null {
  const sig = headere.get("x-helpdesk-signature") ?? "";
  const ts = headere.get("x-helpdesk-timestamp") ?? "";
  if (!sig || !ts || !/^\d+$/.test(ts)) return "mangler-header";

  // TIDSSTEMPLET FØRST, før HMAC'en. Et gammelt kald skal ikke koste os en
  // udregning — HelpDesks egen anbefaling, og den er gratis at følge.
  if (Math.abs(nuMs - Number(ts)) > VINDUE_MS) return "for-gammel";

  const ventet = createHmac("sha256", process.env.HELPDESK_WEBHOOK_SECRET!)
    .update(`${ts}.${raaKrop}`)
    .digest("hex");

  // Længden SKAL matche før timingSafeEqual — den kaster på ulige længder, og
  // et kast her ville blive til en 500 hvor der skulle stå 401.
  if (sig.length !== ventet.length) return "forkert-signatur";
  return timingSafeEqual(Buffer.from(sig), Buffer.from(ventet)) ? null : "forkert-signatur";
}

type Haendelse = { type: string; ref: string; state?: string; erProeve?: boolean };

/**
 * Læser den delmængde vi bruger. Alt andet i nyttelasten ignoreres.
 *
 * KONVOLUTTEN ER DERES, TAGET AF DERES VEKTOR — ikke af mit gæt. Første udgave
 * her ledte efter `ticket` i roden, fordi det var den form jeg forestillede
 * mig. Deres rigtige nyttelast er `{ event, at, data: { ticket } }`, og
 * prøverne mod vektoren blev røde med det samme. Havde jeg skrevet prøverne
 * mod min egen forestilling, ville begge dele have været grønne og forkerte.
 */
function laes(krop: unknown): Haendelse | null {
  if (!krop || typeof krop !== "object") return null;
  const o = krop as Record<string, unknown>;
  const type = String(o.event ?? o.type ?? "");
  const data = (o.data ?? {}) as Record<string, unknown>;
  const t = (data.ticket ?? o.ticket ?? {}) as Record<string, unknown>;
  const ref = String(t.ref ?? "");
  if (!type || !ref) return null;
  return {
    type,
    ref,
    ...(typeof t.state === "string" ? { state: t.state } : {}),
    // Vi læser det NYE navn. `isProeve` står stadig i svaret hos dem, men det
    // er på vej ud, og en læser af det gamle navn ville lære en kanal længere
    // ude at det er det rigtige.
    ...(typeof t.erProeve === "boolean" ? { erProeve: t.erProeve } : {}),
  };
}

const KENDTE_TYPER = new Set(["ticket.created", "ticket.state_changed"]);

export async function handleHelpdeskWebhook(c: Context): Promise<Response> {
  if (!webhookKonfigureret()) {
    return c.json({ ok: false, fejl: "ikke_konfigureret" }, 503);
  }

  const raa = await c.req.text();
  const afvist = verificer(raa, c.req.raw.headers);
  if (afvist) {
    if (afvist === "for-gammel") webhookTaeller.forGammel++;
    else webhookTaeller.afvistSignatur++;
    // GRUNDEN SIGES IKKE TIL AFSENDEREN. «for gammel» mod «forkert signatur»
    // fortæller en der prøver sig frem hvilken af de to spærrer han er nået
    // forbi. Den står i vores egen tæller i stedet.
    return c.json({ ok: false, fejl: "signatur" }, 401);
  }

  const h = laes(JSON.parse(raa || "{}"));
  if (!h) return c.json({ ok: false, fejl: "ulaeselig" }, 400);

  if (!KENDTE_TYPER.has(h.type)) {
    // En ukendt type er IKKE en fejl. De tilføjer hændelser uden at spørge os,
    // og en 400 ville få deres bagstop til at prøve igen fem gange på noget
    // der aldrig kan lykkes.
    webhookTaeller.ukendtType++;
    return c.json({ ok: true, ignoreret: h.type });
  }

  const noegle = `${h.ref}:${h.type}:${h.state ?? ""}`;
  if (sete.has(noegle)) {
    webhookTaeller.dubletter++;
    return c.json({ ok: true, dublet: true });
  }
  sete.add(noegle);
  webhookTaeller.modtaget++;

  // RÆKKEFØLGEN ER IKKE GARANTERET. Derfor skrives tilstanden af BEGGE typer,
  // og `created` overskriver ikke en nyere tilstand vi allerede har set:
  // ankommer `state_changed` først, er DEN den friske.
  if (h.state) {
    const kendt = sagsTilstand.get(h.ref);
    if (!(h.type === "ticket.created" && kendt)) sagsTilstand.set(h.ref, h.state);
  } else if (!sagsTilstand.has(h.ref)) {
    sagsTilstand.set(h.ref, "open");
  }

  return c.json({ ok: true, ref: h.ref });
}
