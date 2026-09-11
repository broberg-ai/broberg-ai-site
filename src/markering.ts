/**
 * F019.3 — hvilket ord og hvilken sætning lyder lige nu.
 *
 * Ren logik, uden DOM og uden lyd: ind kommer tidskoderne og et tidspunkt, ud
 * kommer to intervaller i TALEN. Kaldestedet oversætter dem til artiklen med
 * taleTilKilde() og maler dem.
 *
 * At den er ren er ikke pænhed — det er dét der gør den prøvbar UDEN at vi har
 * tidskoder endnu. Motoren kan være færdig og bevist længe før ai-sdk svarer,
 * og den lyser op i samme øjeblik `words[]` findes.
 */

/** Ét ord fra Azures word.json, oversat til vores form. */
export interface Ord {
  /** Tegnindeks i TALEN (ikke i artiklen). */
  fra: number;
  laengde: number;
  msFra: number;
  msTil: number;
}

export interface Interval {
  fra: number;
  til: number;
}

/**
 * Ordet der lyder ved `ms`. Binært, ikke lineært — og ikke fordi en artikel er
 * stor nok til at det betyder noget, men fordi et lineært opslag fristes til at
 * huske hvor det slap. Den hukommelse er forkert i samme sekund nogen trækker i
 * søgefeltet, og det er en fejl der kun opstår når brugeren gør noget.
 *
 * PAUSER: mellem to ord er der stilhed. Her bliver det FORRIGE ord liggende
 * frem for at slukke. Slukkede vi, ville markeringen blinke ved hvert komma —
 * meget synligt, og det ligner en fejl selvom timingen er rigtig.
 *
 * FØR første ord: null. Der er ikke noget der lyder endnu, og at tænde det
 * første ord ville love at oplæsningen var i gang før den var.
 */
export function findOrd(ord: readonly Ord[], ms: number): number | null {
  if (ord.length === 0) return null;
  if (ms < ord[0]!.msFra) return null;
  let lav = 0;
  let hoej = ord.length - 1;
  let fundet = 0;
  while (lav <= hoej) {
    const midt = (lav + hoej) >> 1;
    if (ord[midt]!.msFra <= ms) {
      fundet = midt;
      lav = midt + 1;
    } else {
      hoej = midt - 1;
    }
  }
  return fundet;
}

/**
 * Sætningen der rummer et ord. Sætningerne er halvåbne intervaller i talen og
 * skal være sorterede — de kommer enten fra Azures sentenceBoundaryEnabled
 * eller fra saetningerFra() nedenfor.
 */
export function findSaetning(saetninger: readonly Interval[], teksten: number): number | null {
  let lav = 0;
  let hoej = saetninger.length - 1;
  while (lav <= hoej) {
    const midt = (lav + hoej) >> 1;
    const s = saetninger[midt]!;
    if (teksten < s.fra) hoej = midt - 1;
    else if (teksten >= s.til) lav = midt + 1;
    else return midt;
  }
  return null;
}

/** Både ordet og dets sætning, som intervaller i talen. Begge kan være null. */
export function markeringVed(
  ord: readonly Ord[],
  saetninger: readonly Interval[],
  ms: number,
): { ord: Interval | null; saetning: Interval | null } {
  const i = findOrd(ord, ms);
  if (i === null) return { ord: null, saetning: null };
  const o = ord[i]!;
  const omraade = { fra: o.fra, til: o.fra + o.laengde };
  const s = findSaetning(saetninger, o.fra);
  return { ord: omraade, saetning: s === null ? null : saetninger[s]! };
}

/* ── sætningsopdeling ────────────────────────────────────────────────────────
 *
 * Azure kan levere dem (sentenceBoundaryEnabled), men vi kan ikke regne med at
 * få dem — og en oplæser hvor kun ordet lyser er stadig brugbar, mens en hvor
 * sætningen sidder FORKERT er værre end ingen sætningsmarkering.
 *
 * DANSK HAR EN FÆLDE HER, og den er ikke teoretisk: «f.eks.», «bl.a.», «dvs.»
 * og «ca.» slutter ikke en sætning. Et naivt split på punktum giver derfor
 * sætninger midt i en sætning — og markeringen springer et sted hen hvor ingen
 * kan se hvorfor. Det samme gælder tal: «3.000 kroner» er ikke to sætninger.
 */
const DANSKE_FORKORTELSER = [
  "f.eks", "bl.a", "dvs", "ca", "osv", "jf", "pga", "mht", "iflg", "mv", "m.m", "bla", "fx",
  "dr", "hr", "fru", "nr", "stk", "kr", "pct", "evt", "inkl", "ekskl", "ang", "vedr",
];

/** Sætninger som halvåbne intervaller i talen. Tomme stykker udelades. */
export function saetningerFra(tale: string): Interval[] {
  const ud: Interval[] = [];
  let start = 0;
  for (let i = 0; i < tale.length; i++) {
    const t = tale[i]!;
    const erSlut = t === "." || t === "!" || t === "?" || t === "\n";
    if (!erSlut) continue;

    if (t === ".") {
      // ET PUNKTUM DER IKKE EFTERFØLGES AF LUFT SLUTTER IKKE EN SÆTNING.
      //
      // Den generelle regel, og den kom af at prøven fældede listen: «bl.a.»
      // delte på det INDRE punktum, fordi «bl» ikke stod i forkortelserne —
      // og det ville en liste blive ved med at gøre, for der er altid en
      // forkortelse mere. Her er formen i stedet: et sætningspunktum har luft
      // efter sig. Det dækker også domæner («broberg.ai») og decimaler uden at
      // nogen skal huske dem.
      const efter = tale[i + 1];
      if (efter !== undefined && !/[\s"»)]/.test(efter)) continue;
      // Et tal på hver side: «3.000». Ikke en sætningsslutning.
      if (/\d/.test(tale[i - 1] ?? "") && /\d/.test(tale[i + 1] ?? "")) continue;
      // En kendt forkortelse lige før punktummet.
      const foer = tale.slice(Math.max(0, i - 8), i).toLowerCase();
      if (DANSKE_FORKORTELSER.some((f) => foer.endsWith(f))) continue;
      // Et enkelt bogstav før punktum er et initial eller en del af «f.eks.»
      // der allerede er delt af det foregående punktum.
      if (/[a-zæøå]/.test(tale[i - 1] ?? "") && !/[a-zæøå]/i.test(tale[i - 2] ?? "")) continue;
    }

    // Slug efterfølgende tegnsætning og mellemrum med, så næste sætning
    // begynder på sit første rigtige tegn.
    let slut = i + 1;
    while (slut < tale.length && /[\s"»)]/.test(tale[slut]!)) slut++;
    if (slut > start && tale.slice(start, slut).trim() !== "") ud.push({ fra: start, til: slut });
    start = slut;
    i = slut - 1;
  }
  if (start < tale.length && tale.slice(start).trim() !== "") ud.push({ fra: start, til: tale.length });
  return ud;
}
