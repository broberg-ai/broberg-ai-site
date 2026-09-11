/**
 * F019.2 — talen OG kortet tilbage til kilden.
 *
 * PROBLEMET, og det er featurens egentlige knude.
 *
 * Azures ord-grænser (`wordBoundaryEnabled`) giver et TEKST-offset ind i det
 * manuskript vi sendte. Men vi sender ikke artiklen — vi sender `tilTale(md)`,
 * som er en ANDEN streng: markdown-tegn væk, «AI-agenter» → «AI agenter»
 * (længden ændrer sig), links foldet til deres tekst, og et loft på 12.000 tegn.
 *
 * Et offset på 4.812 i talen peger derfor ikke på tegn 4.812 i artiklen. Skulle
 * vi highlighte ud fra tal alene, ville markeringen sidde nogenlunde rigtigt i
 * starten og være håbløst forskudt til sidst — og det ser ud som et
 * afspilningsproblem, ikke som en indeksfejl. Præcis den fejlform der koster
 * længst tid at finde.
 *
 * LØSNINGEN er at transformationen fører regnskab mens den arbejder: for hvert
 * tegn i talen huskes hvilket tegn i kilden det kom fra.
 *
 * DEN UFRAVIGELIGE BETINGELSE: `tilTaleMedKort(md).tale` skal være BYTE-IDENTISK
 * med `tilTale(md)`. Talen indgår i lyd-cachens nøgle (sha256 over stemme+tale),
 * så en forskel på ét mellemrum ville gøre hver eneste cachet lydfil ugyldig og
 * sende hele arkivet gennem Azure igen. Det er dét rundtur-prøven måler, på de
 * ægte artikler frem for på opfundne strenge.
 */
import { FORKORTELSER } from "@/aidan-laes.ts";

const TEKST_LOFT = 12_000;

/** Ét tegn i talen, og hvor det kom fra. `kilde[i]` er indekset i md. */
export interface TaleKort {
  tale: string;
  /** kilde[i] = indekset i md som talens tegn i kom fra. */
  kilde: readonly number[];
}

/** Reglerne, i den rækkefølge tilTale anvender dem.
 *
 *  Rækkefølgen er ikke til forhandling: `[tekst](url)` skal foldes FØR
 *  `[*_\`]` fjernes, ellers er der ingen klammer tilbage at genkende linket på.
 *  Og BINDESTREG skal køre før alt andet, fordi den matcher på forkortelser
 *  der stadig står i deres rå form. */
/** En regel: mønstret, og hvad matchet bliver til — som tegn MED kildeplads.
 *
 *  `ud` returnerer par af (tegn, kildeindeks). Det er grunden til at typen ikke
 *  bare er en streng: en erstatning der kommer fra en CAPTURE-GRUPPE skal
 *  beholde gruppens EGNE positioner. Første udgave gav hele erstatningen
 *  matchets startindeks, og så pegede «flagskibe» i «[vores flagskibe](/x)»
 *  tilbage på klammen. Prøven fangede det; det ville ellers have set ud som en
 *  markering der sad ét tegn galt — og ét tegn galt på et link er et tegn galt
 *  på ALLE links.
 *
 *  `d`-flaget giver m.indices, altså gruppens rigtige plads i kilden. Uden det
 *  skulle positionen gættes med indexOf, som rammer forkert første gang samme
 *  tekst optræder to steder i matchet. */
type Ud = (m: RegExpExecArray) => [string, number][];

/** Tegn fra en capture-gruppe, hver med sin ægte kildeplads. */
function fraGruppe(m: RegExpExecArray, n: number): [string, number][] {
  const tekst = m[n] ?? "";
  const start = m.indices?.[n]?.[0] ?? m.index;
  return Array.from(tekst, (t, i) => [t, start + i] as [string, number]);
}

/** Reglerne, i den rækkefølge tilTale anvender dem.
 *
 *  Rækkefølgen er ikke til forhandling: `[tekst](url)` skal foldes FØR
 *  `[*_`]` fjernes, ellers er der ingen klammer tilbage at genkende linket på.
 *  Og BINDESTREG skal køre før alt andet, fordi den matcher på forkortelser
 *  der stadig står i deres rå form. */
function regler(): { re: RegExp; ud: Ud }[] {
  const BINDESTREG = new RegExp(`\\b(${FORKORTELSER.join("|")})-(?=[a-zA-ZæøåÆØÅ])`, "gd");
  const intet: Ud = () => [];
  return [
    { re: BINDESTREG, ud: (m) => [...fraGruppe(m, 1), [" ", m.index + (m[1]?.length ?? 0)]] },
    { re: /<[^>]+>/g, ud: intet },
    { re: /\bwww\./gi, ud: intet },
    { re: /^\[block:[a-z0-9-]+\]\s*$/gim, ud: intet },
    { re: /\[([^\]]+)\]\([^)]*\)/gd, ud: (m) => fraGruppe(m, 1) },
    { re: /^#{1,4}\s+/gm, ud: intet },
    { re: /^[-•]\s+/gm, ud: intet },
    { re: /[*_`]/g, ud: intet },
    { re: /^\s*[-–—_]{3,}\s*$/gm, ud: intet },
    { re: /[ \t]+/g, ud: (m) => [[" ", m.index]] },
    { re: /\n{3,}/g, ud: (m) => [["\n", m.index], ["\n", m.index]] },
  ];
}

/** Anvend ÉN regel på en (tekst, kort) og bevar kortet.
 *
 *  Erstatningen arver kildeindekset for matchets FØRSTE tegn. Det er det
 *  rigtige valg for alle vores regler: de fjerner eller sammentrækker, så et
 *  output-tegn hører altid til dét sted i kilden hvor matchet begyndte. */
function anvend(tekst: string, kilde: readonly number[], re: RegExp, ud: Ud): [string, number[]] {
  re.lastIndex = 0;
  let resultat = "";
  const nyKilde: number[] = [];
  let sidst = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tekst)) !== null) {
    // Et tomt match ville løkke i det uendelige — samme fælde som en
    // while-løkke uden fremdrift, bare gemt bag en regex.
    if (m[0] === "") { re.lastIndex++; continue; }
    for (let i = sidst; i < m.index; i++) { resultat += tekst[i]; nyKilde.push(kilde[i]!); }
    // Erstatningens positioner er indeks i DENNE tekst; de oversættes gennem
    // det kort vi allerede har, så flere regler i træk ikke mister sporet.
    for (const [t, pos] of ud(m)) {
      resultat += t;
      nyKilde.push(kilde[Math.min(Math.max(pos, 0), kilde.length - 1)]!);
    }
    sidst = m.index + m[0].length;
    if (!re.global) break;
  }
  for (let i = sidst; i < tekst.length; i++) { resultat += tekst[i]; nyKilde.push(kilde[i]!); }
  return [resultat, nyKilde];
}

/** Talen, og for hvert af dens tegn: hvor i `md` det kom fra. */
export function tilTaleMedKort(md: string): TaleKort {
  let tekst = md;
  let kilde: readonly number[] = Array.from({ length: md.length }, (_, i) => i);
  for (const { re, ud } of regler()) [tekst, kilde] = anvend(tekst, kilde, re, ud);

  // .trim() og .slice() til sidst — begge klipper kun i enderne, så kortet
  // følger med ved at klippe de samme steder.
  let start = 0, slut = tekst.length;
  while (start < slut && /\s/.test(tekst[start]!)) start++;
  while (slut > start && /\s/.test(tekst[slut - 1]!)) slut--;
  if (slut - start > TEKST_LOFT) slut = start + TEKST_LOFT;
  return { tale: tekst.slice(start, slut), kilde: kilde.slice(start, slut) };
}

/** Et interval i TALEN → samme interval i KILDEN.
 *
 *  Bruges med Azures word.json: `{ textOffset, wordLength }` → det stykke af
 *  artiklen der skal lyse. Returnerer null for et interval uden for talen —
 *  ærligere end at klemme det ind i [0, længde), som ville highlighte et
 *  tilfældigt ord frem for ingenting. */
export function taleTilKilde(kort: TaleKort, fra: number, laengde: number): { fra: number; til: number } | null {
  if (fra < 0 || laengde <= 0 || fra >= kort.kilde.length) return null;
  const sidsteTegn = Math.min(fra + laengde, kort.kilde.length) - 1;
  const a = kort.kilde[fra]!;
  const b = kort.kilde[sidsteTegn]!;
  return { fra: Math.min(a, b), til: Math.max(a, b) + 1 };
}
