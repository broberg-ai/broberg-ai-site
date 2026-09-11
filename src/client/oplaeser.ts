/**
 * F019.6 — limen: fra et tidspunkt i lyden til det sted i artiklen der skal lyse.
 *
 * De tre motorer er bygget og bevist hver for sig (F019.2–.4). Her bindes de
 * sammen, og der træffes de valg der først findes når en rigtig side er med:
 *
 * MARKERINGEN MÅ ALDRIG SKRIVE I ARTIKLEN. Et indsat <mark> ville se rigtigt
 * ud og være en fejl: de samme felter er inline-redigerbare, så en redigering
 * der begynder mens oplæsningen kører, ville gemme markeringen ind i indholdet.
 * Derfor CSS Custom Highlight API — den maler oven på uden at røre DOM'en. En
 * prøve sammenligner artiklens innerHTML før og efter og kræver at den er
 * tegn-for-tegn den samme.
 *
 * TEGNEREN ER UDSKIFTELIG, ikke for pænhedens skyld: browseren der mangler
 * API'et og prøven der skal måle hvad der blev malt, er det samme problem.
 * Mangler API'et, males der ingenting — lyden spiller, teksten står stille, og
 * intet ser i stykker ud.
 */
import { markeringVed, saetningerFra, type Interval, type Ord } from "@/markering.ts";
import { byggKort, omraadeTil, type Stykke } from "@/dom-kort.ts";

/** Talen og dens ord-tidskoder, som de ligger ved siden af lydfilen. */
export interface Tidskoder {
  tale: string;
  ord: Ord[];
}

/** Hvad der males. To lag, fordi skærmbillederne viste to lag. */
export interface Tegner {
  mal(navn: "ord" | "saetning", omraade: Range | null): void;
  ryd(): void;
}

/** CSS Custom Highlight API — findes ikke i alle browsere, og det er i orden. */
export function cssTegner(): Tegner | null {
  const g = globalThis as unknown as {
    CSS?: { highlights?: Map<string, unknown> };
    Highlight?: new (...r: Range[]) => unknown;
  };
  const reg = g.CSS?.highlights;
  const H = g.Highlight;
  if (!reg || typeof H !== "function") return null;
  const navne = { ord: "oplaes-ord", saetning: "oplaes-saetning" } as const;
  return {
    mal(navn, omraade) {
      if (!omraade) reg.delete(navne[navn]);
      else reg.set(navne[navn], new H(omraade));
    },
    ryd() {
      reg.delete(navne.ord);
      reg.delete(navne.saetning);
    },
  };
}

/**
 * Artiklens tekstknuder som stykker.
 *
 * SEPARATOREN ER DET BÆRENDE HER. To afsnit giver to tekstknuder uden noget
 * imellem, så en ren sammensætning ville lime «…slut» og «Start…» til ét ord
 * — og dét ord findes ikke i talen, hvor der er et punktum og et mellemrum.
 * Et enkelt mellemrum imellem koster ingenting: ord findes som \S+, så et
 * mellemrum kan aldrig blive valgt som træf.
 */
export function tekststykker(rod: Element): Stykke<Text>[] {
  const ud: Stykke<Text>[] = [];
  const gaa = (rod.ownerDocument ?? document).createTreeWalker(rod, 4 /* SHOW_TEXT */);
  let forrige: Text | null = null;
  for (let n = gaa.nextNode(); n; n = gaa.nextNode()) {
    const t = n as Text;
    if (t.data === "") continue;
    if (forrige && !/\s$/.test(forrige.data) && !/^\s/.test(t.data)) {
      ud.push({ tekst: " ", ref: forrige });
    }
    ud.push({ tekst: t.data, ref: t });
    forrige = t;
  }
  return ud;
}

export interface Markoer {
  /** Hvad der lyder ved `ms` — og det er malt når funktionen vender tilbage. */
  ved(ms: number): { ord: Range | null; saetning: Range | null };
  ryd(): void;
}

export function lavMarkoer(rod: Element, t: Tidskoder, tegner: Tegner | null = cssTegner()): Markoer {
  const doc = rod.ownerDocument ?? document;
  const stykker = tekststykker(rod);
  const kort = byggKort(t.tale, stykker);
  const saetninger = saetningerFra(t.tale);

  const omraade = (iv: Interval | null): Range | null => {
    if (!iv) return null;
    const sted = omraadeTil(kort, iv.fra, iv.til);
    if (!sted) return null;
    // Offsettene stammer fra tegn der ER genfundet i en tekstknude, så de
    // ligger pr. konstruktion inden for knuden: slut er sidste tegn + 1, altså
    // højst knudens længde — netop hvad et halvåbent Range skal have. Her stod
    // en klipning og en tom-tjek; ingen af dem kunne gøres røde af en prøve, og
    // en spærre der ikke kan udløses ser ud som beskyttelse uden at være det.
    const r = doc.createRange();
    r.setStart(sted.start.ref, sted.start.offset);
    r.setEnd(sted.slut.ref, sted.slut.offset);
    return r;
  };

  // Males kun når noget ÆNDRER sig. Ved 4 timeupdate i sekundet er det
  // forskellen på at male 4 gange og male én gang pr. ord.
  let sidst = "";
  return {
    ved(ms) {
      const m = markeringVed(t.ord, saetninger, ms);
      const noegle = `${m.ord?.fra ?? -1}:${m.ord?.til ?? -1}|${m.saetning?.fra ?? -1}`;
      const o = omraade(m.ord);
      const s = omraade(m.saetning);
      if (tegner && noegle !== sidst) {
        tegner.mal("saetning", s);
        tegner.mal("ord", o);
        sidst = noegle;
      }
      return { ord: o, saetning: s };
    },
    ryd() {
      sidst = "";
      tegner?.ryd();
    },
  };
}

/**
 * Rulning der følger med — men slipper i samme øjeblik læseren selv ruller.
 *
 * En side der river sig løs under fingeren er værre end ingen markering. Derfor
 * lyttes der på BRUGERENS handlinger (hjul, finger, tastatur) og ikke på
 * «scroll»: vores egen rulning udløser også scroll, og så kan de to ikke
 * skelnes. Det er den skelnen hele funktionen findes for.
 */
export function lavRulning(): {
  afbryd(): void;
  nulstil(): void;
  maaRulle(): boolean;
  hændelser: readonly string[];
} {
  let afbrudt = false;
  return {
    afbryd() {
      afbrudt = true;
    },
    nulstil() {
      afbrudt = false;
    },
    maaRulle() {
      return !afbrudt;
    },
    hændelser: ["wheel", "touchmove", "keydown"] as const,
  };
}

/** mm:ss — afspillerens ur. */
export function tid(s: number): string {
  if (!Number.isFinite(s) || s < 0) s = 0;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}
