/* F007.17 — hilsenens regler, som ren logik.
 *
 * Christian, 8/9, med et skærmbillede af Intercoms Fin-kort: «Efter en bruger
 * har været på broberg.ai på mere end 10 sekunder og IKKE selv har aktiveret
 * Aidan så skal du vise sådan en her.»
 *
 * Reglerne bor HER og ikke i enhance.ts, fordi det er dem der afgør om kortet
 * bliver en hilsen eller en nag — og en prøve på «kortet vises efter 10
 * sekunder» består også hvis kortet vises ALTID. De fire nej'er er derfor lige
 * så meget feature som ja'et, og de skal kunne forsegles hver for sig.
 */
import { listSamtaler } from "./aidan-samtaler.ts";

/** Afvisningen huskes på tværs af besøg. Én afvisning skal HOLDE — ellers er
 *  det ikke en hilsen, det er noget der dukker op igen på hver side. */
export const AFVIST_NOEGLE = "aidan-hilsen-afvist-v1";
/** Vist én gang pr. BESØG (sessionStorage), ikke pr. sidevisning. */
export const VIST_NOEGLE = "aidan-hilsen-vist-v1";
/** Synlig tid, båret med over et sideskifte — 10 sekunder på broberg.ai er
 *  ikke det samme som 10 sekunder på én side. */
export const TID_NOEGLE = "aidan-hilsen-ms-v1";

export const VENTETID_MS = 10_000;

export type HilsenTilstand = {
  /** Millisekunder hvor siden faktisk har været SYNLIG. Et faneblad i
   *  baggrunden er ikke et menneske der kigger. */
  synligMs: number;
  panelHarVaeretAabent: boolean;
  harTidligereSamtaler: boolean;
  afvistFoer: boolean;
  vistIDetteBesoeg: boolean;
};

/**
 * Må hilsenen vises nu?
 *
 * Rækkefølgen er bevidst: de fire nej'er først, tiden til sidst. Det gør at en
 * ændring af ventetiden aldrig kan komme til at omgå en af betingelserne.
 */
export function skalVises(t: HilsenTilstand): boolean {
  if (t.panelHarVaeretAabent) return false;
  if (t.harTidligereSamtaler) return false;
  if (t.afvistFoer) return false;
  if (t.vistIDetteBesoeg) return false;
  return t.synligMs >= VENTETID_MS;
}

/** Har brugeren skrevet til Aidan før? Tåler et lukket lager (privat vindue,
 *  blokerede cookies) ved at svare «nej» frem for at kaste — så hilsenen
 *  fejler mod at BLIVE vist, hvilket er den harmløse retning. */
export function harTidligereSamtaler(): boolean {
  try {
    return listSamtaler().length > 0;
  } catch {
    return false;
  }
}

export function erAfvist(): boolean {
  try {
    return localStorage.getItem(AFVIST_NOEGLE) === "1";
  } catch {
    return false;
  }
}

export function markerAfvist(): void {
  try {
    localStorage.setItem(AFVIST_NOEGLE, "1");
  } catch {
    /* lukket lager — hilsenen kommer igen næste besøg, og det er acceptabelt */
  }
}

export function erVistIDetteBesoeg(): boolean {
  try {
    return sessionStorage.getItem(VIST_NOEGLE) === "1";
  } catch {
    return false;
  }
}

export function markerVist(): void {
  try {
    sessionStorage.setItem(VIST_NOEGLE, "1");
  } catch {
    /* som ovenfor */
  }
}

/** Synlig tid båret med over sideskift. Et tal der ikke kan læses starter på 0
 *  — så tæller vi bare forfra, hvilket er bedre end at vise kortet straks. */
export function laesSynligMs(): number {
  try {
    const n = Number(sessionStorage.getItem(TID_NOEGLE));
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function gemSynligMs(ms: number): void {
  try {
    sessionStorage.setItem(TID_NOEGLE, String(Math.round(ms)));
  } catch {
    /* som ovenfor */
  }
}
