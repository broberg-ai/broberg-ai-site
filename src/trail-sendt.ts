/* Hvad vi ALLEREDE har sendt til Trail — vores egen spærre, på vores side.
 *
 * HVORFOR DEN FINDES. trailUploadSide sendte før ALTID og regnede med at Trail
 * sagde fra (409 duplicate_source, eller upsert:"unchanged"). Dublet-ansvaret
 * lå altså hos MODTAGEREN. Da deres indgang skrev en ny side i stedet for at
 * opdatere, blev 39 artikler til 90 sider — og dubletterne er ikke ens, fordi
 * de er kompileret på forskellige tidspunkter. En søgning kunne give tre
 * forskellige svar på samme spørgsmål.
 *
 * Christian, 6/9-2026: «DU SKAL FUCKING SØRGE FOR AT DU IKKE SENDER DEN SAMME
 * ARTIKEL OG SIDE TIL TRAIL 5 GANGE.»
 *
 * Så: vi holder selv styr på hvad vi har sendt, og sender ikke det samme igen.
 * Det virker uanset hvad modtageren gør — og det er pointen. En spærre der
 * ligger hos den anden part er ikke vores spærre.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const FIL = process.env.TRAIL_SENDT_FIL ?? (existsSync("/data") ? "/data/trail-sendt.json" : ".cache/trail-sendt.json");

type Log = Record<string, string>; // sourceUrl → sha256 af det markdown vi sendte

let hukommelse: Log | null = null;

function laes(): Log {
  if (hukommelse) return hukommelse;
  try {
    hukommelse = JSON.parse(readFileSync(FIL, "utf8")) as Log;
  } catch {
    hukommelse = {}; // findes ikke endnu, eller er ulæselig — start forfra
  }
  return hukommelse;
}

function skriv(log: Log): void {
  try {
    mkdirSync(path.dirname(FIL), { recursive: true });
    writeFileSync(FIL, JSON.stringify(log));
  } catch {
    /* Kan vi ikke skrive, må vi hellere sende igen end at tabe siden. */
  }
}

export function hash(md: string): string {
  return createHash("sha256").update(md).digest("hex");
}

/** Har vi allerede sendt PRÆCIS dette indhold for denne URL? */
export function erAlleredeSendt(sourceUrl: string, md: string): boolean {
  return laes()[sourceUrl] === hash(md);
}

/** Notér at dette indhold nu står i KB'en for denne URL. */
export function noterSendt(sourceUrl: string, md: string): void {
  const log = laes();
  log[sourceUrl] = hash(md);
  skriv(log);
}

/** Til prøver. */
export function _nulstilSendtLog(): void {
  hukommelse = {};
  skriv({});
}
