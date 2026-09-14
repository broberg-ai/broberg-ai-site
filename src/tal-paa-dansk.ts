/**
 * F019.8 — tal læst som danske ord, så justeringen kan tidsfæste dem.
 *
 * HVORFOR DET HER FINDES. Da alle 59 artikler blev målt, kom 229 ord tilbage
 * uden tidskode, og næsten alle var tal: «2026» tyve gange, «15», «1.625».
 * Stemmen siger dem fint — det er JUSTERINGEN der ikke kan parre lyden «to
 * tusind og seksogtyve» med tegnene 2 0 2 6, og den melder ærligt et hul frem
 * for at gætte.
 *
 * EN REGEL, IKKE EN LISTE. De 77 former vi har i dag kunne skrives som 77
 * linjer i ordbogen. Det ville virke i dag og fejle i næste artikel der nævner
 * et nyt tal — og fejle TAVST, for et manglende tal ser nøjagtig ud som et tal
 * der bare ikke er nået endnu.
 *
 * DANSK SKRIVER TUSINDER MED PUNKTUM. «4.841» er fire tusind otte hundrede og
 * enogfyrre, ikke fire komma otte fire en. Målt i artiklerne: 1.625, 4.841 og
 * 16.838 er alle tusindtal. Men «38.6» står i en ENGELSK sætning («38.6
 * hours») og er et decimaltal — samme tegn, to betydninger, afgjort af sproget
 * omkring det. Derfor læser reglen kun tal i dansk tekst, og kun de former den
 * kan læse entydigt.
 */

const ENERE = ["nul", "en", "to", "tre", "fire", "fem", "seks", "syv", "otte", "ni",
  "ti", "elleve", "tolv", "tretten", "fjorten", "femten", "seksten", "sytten", "atten", "nitten"];
const TIERE: Record<number, string> = {
  20: "tyve", 30: "tredive", 40: "fyrre", 50: "halvtreds",
  60: "tres", 70: "halvfjerds", 80: "firs", 90: "halvfems",
};

/** 0–99. Dansk siger enerne FØRST: 45 er «femogfyrre», ikke «fyrre-fem». */
function under100(n: number): string {
  if (n < 20) return ENERE[n]!;
  const tier = Math.floor(n / 10) * 10;
  const ener = n % 10;
  return ener === 0 ? TIERE[tier]! : `${ENERE[ener]}og${TIERE[tier]}`;
}

function under1000(n: number): string {
  if (n < 100) return under100(n);
  const hundreder = Math.floor(n / 100);
  const rest = n % 100;
  const foran = `${hundreder === 1 ? "et" : ENERE[hundreder]} hundrede`;
  return rest === 0 ? foran : `${foran} og ${under100(rest)}`;
}

/**
 * ÅRSTAL læses anderledes end antal, og det er ikke en smagssag.
 *
 * MÅLT 14/9-2026 mod stemmen selv: «1995.» varer 2,664 s, og «nitten hundrede
 * og femoghalvfems.» varer 2,664 s — samme længde på millisekundet. «Et tusind
 * ni hundrede og femoghalvfems.» varer 3,288 s. Stemmen siger altså årstallet
 * som et årstal, og den almindelige antals-regel ville have gjort 1995 til
 * noget ingen dansker siger.
 *
 * Signalet er typografisk og står i teksten: dansk skriver tusinder med
 * punktum, så «1.625» er et ANTAL og «1995» er et ÅRSTAL. Det er derfor
 * afsenderen — ikke et gæt på indholdet — der afgør det.
 */
function aarstal(n: number): string | null {
  if (n < 1100 || n > 2099) return null;
  const hundreder = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreder >= 20) {
    // 2000-tallet siges som tusinder: «to tusind og seks».
    return rest === 0 ? "to tusind" : `to tusind og ${under100(rest)}`;
  }
  const foran = `${under100(hundreder)} hundrede`;
  return rest === 0 ? foran : `${foran} og ${under100(rest)}`;
}

/**
 * Et helt tal som danske ord. Grænsen er en million, og den er bevidst: over
 * den findes tallene ikke i vores artikler, og en regel der dækker mere end
 * den er målt på, er en regel ingen har set virke.
 */
export function talPaaDansk(n: number, form: "antal" | "aarstal" = "antal"): string | null {
  if (!Number.isInteger(n) || n < 0 || n >= 1_000_000) return null;
  if (form === "aarstal") {
    const aar = aarstal(n);
    if (aar) return aar;
  }
  if (n < 1000) return under1000(n);
  const tusinder = Math.floor(n / 1000);
  const rest = n % 1000;
  const foran = `${tusinder === 1 ? "et" : under1000(tusinder)} tusind`;
  if (rest === 0) return foran;
  // «to tusind og seksogtyve», men «et tusind seks hundrede og femogtyve»:
  // «og» binder kun det sidste led, og hundrederne er allerede et led.
  return rest < 100 ? `${foran} og ${under100(rest)}` : `${foran} ${under1000(rest)}`;
}

/**
 * Tal-former i en dansk tekst, som ordbogsposter.
 *
 * Kun former reglen kan læse ENTYDIGT. Et versionsnummer («1.6.0»), en engelsk
 * decimal («38.6»), en sammensætning («top-10-liste») og en forkortelse med
 * ciffer («fts5») får ingen post — de er få, de kræver hver sin beslutning, og
 * at lade som om en tal-regel klarer dem ville være værre end at lade dem stå.
 */
export function talPoster(tekst: string): Array<{ word: string; alias: string }> {
  const set = new Map<string, string>();
  // Et helt tal, valgfrit med danske tusind-punktummer, som HELT ord.
  //
  // De to udkig er ikke ens, og forskellen er hele finessen. FORAN må der ikke
  // stå et punktum — så kan «6» og «0» i «1.6.0» ikke plukkes ud hver for sig.
  // BAGEFTER er et punktum eller komma derimod tilladt, MEN kun hvis der ikke
  // kommer et ciffer efter. Sætningens tegn i «i 2007.» og «i 2007, omkring»
  // skal med; «.6» i «38.6», «.0» i «1.6.0» og «,14» i «3,14» afslører at
  // tallet ikke er et helt tal. Dansk decimalkomma og engelsk decimalpunktum
  // fanges af den SAMME regel — de er to skrivemåder for samme fælde.
  for (const m of tekst.matchAll(/(?<![\p{L}\p{N}.,-])\d+(?:\.\d{3})*(?![\p{L}\p{N}-])(?![.,]\d)/gu)) {
    const skrevet = m[0];
    // Fire cifre UDEN tusind-punktum er et årstal; med punktum er det et antal.
    const erAarstal = /^\d{4}$/.test(skrevet);
    const tal = Number(skrevet.replace(/\./g, ""));
    // ETTALLET HAR TO KØN og teksten afgør hvilket: «niveau 1» siges «niveau
    // et», ikke «niveau en». Et tal alene kan ikke vide det, så 1 får ingen
    // post — den beholder den opførsel den har i dag. Målt: bare «1» står ikke
    // i nogen af de 229 huller, så det koster ingenting at lade den være.
    if (tal === 1) continue;
    const ord = talPaaDansk(tal, erAarstal ? "aarstal" : "antal");
    if (ord) set.set(skrevet, ord);
  }
  return [...set].map(([word, alias]) => ({ word, alias }));
}

/**
 * Reglens version. Den indgår i justerings-nøglen, så en ÆNDRET læsemåde ikke
 * kan snige sig forbi som «samme ordbog». Hæv den når reglen læser et tal
 * anderledes end før — ikke ved en kommentar eller en omdøbning.
 *
 * 2 — 14/9-2026: årstal læses som årstal («nitten hundrede femoghalvfems»),
 *     efter måling hos voice-engine. 1 læste dem som antal.
 */
export const TAL_REGEL_VERSION = 2;
