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
 * Artiklens tekstknuder som stykker — fra FLERE rødder, og det er ikke en
 * generalisering for dens egen skyld.
 *
 * Oplæsningen begynder med artiklens TITEL, og titlen står uden for
 * brødteksten. Med brødteksten som eneste rod havde de første ord intet sted at
 * lyse — målt på produktionen: lyden spillede (0:04 / 0:30), tidskoderne kom
 * frem (svar 200), og der blev malt INTET. Ingen fejl nogen steder; præcis den
 * tavse form featuren ellers er bygget til at undgå.
 *
 * SEPARATOREN ER DET BÆRENDE HER. To afsnit giver to tekstknuder uden noget
 * imellem, så en ren sammensætning ville lime «…slut» og «Start…» til ét ord
 * — og dét ord findes ikke i talen, hvor der er et punktum og et mellemrum.
 * Et enkelt mellemrum imellem koster ingenting: ord findes som \S+, så et
 * mellemrum kan aldrig blive valgt som træf.
 */
export function tekststykker(roeder: Element | readonly Element[]): Stykke<Text>[] {
  const liste = Array.isArray(roeder) ? roeder : [roeder as Element];
  const ud: Stykke<Text>[] = [];
  let forrige: Text | null = null;
  for (const rod of liste) {
  const gaa = (rod.ownerDocument ?? document).createTreeWalker(rod, 4 /* SHOW_TEXT */);
  for (let n = gaa.nextNode(); n; n = gaa.nextNode()) {
    const t = n as Text;
    if (t.data === "") continue;
    if (forrige && !/\s$/.test(forrige.data) && !/^\s/.test(t.data)) {
      ud.push({ tekst: " ", ref: forrige });
    }
    ud.push({ tekst: t.data, ref: t });
    forrige = t;
  }
  }
  return ud;
}

/** Nærmeste blok-element — det en sætning kan bo i. */
function blokFor(n: Node | null): Element | null {
  // nodeType frem for «instanceof Element»: den globale Element findes ikke i
  // et vindue der ikke er globalt (prøverne kører sådan med vilje), og et
  // instanceof mod en fremmed global kaster frem for at svare false.
  let e: Element | null = n && n.nodeType === 1 ? (n as Element) : (n?.parentElement ?? null);
  while (e && !/^(P|H1|H2|H3|H4|H5|H6|LI|BLOCKQUOTE|FIGCAPTION|TD|TH|DT|DD)$/.test(e.tagName)) {
    e = e.parentElement;
  }
  return e;
}

/** Klipper et område så det slutter inde i den blok det begyndte i. */
function klipTilBlok(r: Range): void {
  const start = blokFor(r.startContainer);
  if (!start || start.contains(r.endContainer)) return;
  const gaa = (start.ownerDocument ?? document).createTreeWalker(start, 4 /* SHOW_TEXT */);
  let sidst: Text | null = null;
  for (let n = gaa.nextNode(); n; n = gaa.nextNode()) sidst = n as Text;
  if (sidst) r.setEnd(sidst, sidst.data.length);
  else r.collapse(true);
}

export interface Markoer {
  /** Hvad der lyder ved `ms` — og det er malt når funktionen vender tilbage. */
  ved(ms: number): { ord: Range | null; saetning: Range | null };
  ryd(): void;
}

export function lavMarkoer(
  roeder: Element | readonly Element[],
  t: Tidskoder,
  tegner: Tegner | null = cssTegner(),
): Markoer {
  const foerste = (Array.isArray(roeder) ? roeder[0] : (roeder as Element))!;
  const doc = foerste.ownerDocument ?? document;
  const stykker = tekststykker(roeder);
  const kort = byggKort(t.tale, stykker);
  const saetninger = saetningerFra(t.tale);

  const omraade = (iv: Interval | null): Range | null => {
    if (!iv) return null;
    const sted = omraadeTil(kort, iv.fra, iv.til);
    if (!sted) return null;
    // Offsettene stammer fra tegn der ER genfundet i en tekstknude, så de
    // ligger pr. konstruktion inden for knuden: slut er sidste tegn + 1, altså
    // højst knudens længde — netop hvad et halvåbent Range skal have.
    const r = doc.createRange();
    r.setStart(sted.start.ref, sted.start.offset);
    r.setEnd(sted.slut.ref, sted.slut.offset);

    // EN MARKERING MÅ IKKE FORLADE DET AFSNIT DEN BEGYNDER I.
    //
    // Målt på produktionen: sætningsmarkeringen dækkede overskriften, ordet
    // «Kladde» inde i en illustration OG første linje af brødteksten på én gang.
    //
    // Årsagen er et HUL: artiklens manchet læses op, men står ikke på siden.
    // Opslaget finder da sætningens start i overskriften og dens slut langt nede
    // i brødteksten — for manchetten citerer en sætning der OGSÅ står i
    // brødteksten — og området spænder over alt derimellem.
    //
    // En længdesammenligning kan ikke fange det: den sætning der SIGES
    // (overskrift + manchet) er LÆNGERE end det der males. Reglen er i stedet
    // formens: en sætning bor i ét afsnit. Slutter området et andet sted end
    // det begyndte, klippes det til afsnittets ende.
    klipTilBlok(r);
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
