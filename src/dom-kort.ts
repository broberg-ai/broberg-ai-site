/**
 * F019.4 — fra et interval i TALEN til et sted i den viste artikel.
 *
 * DEN OPLAGTE VEJ ER FORKERT. Vi har allerede tale → markdown (F019.2), men
 * markdown er ikke det der står på skærmen: siden viser rendret HTML. Et
 * md-indeks kan ikke males.
 *
 * INDSIGTEN er at talen og den VISTE tekst er den samme prosa. tilTale() fjerner
 * netop markup, så det der er tilbage er stort set det læseren ser — forskellene
 * er få og kendte: «AI-agenter» → «AI agenter», «www.» væk, mellemrum trykket
 * sammen, og et loft på 12.000 tegn. Derfor justeres talen direkte mod
 * tekstknuderne, og markdown-kortet bliver ikke brugt til at male.
 *
 * TOLERANT FREMAD-GANG, ikke et eksakt match. Et eksakt match ville knække på
 * det første bindestregs-ord og tage resten af artiklen med sig — og fejlen
 * ville vise sig som en markering der stopper midtvejs, hvilket ligner lyd der
 * stopper. Vi går derfor fremad i begge strenge, springer over hvad der ikke
 * passer, og mister i værste fald ét ord frem for hele resten.
 *
 * INGEN DOM I DENNE FIL. Den arbejder på tekststykker med en vilkårlig
 * reference, så den kan prøves uden en browser — og DOM-adapteren bliver tre
 * linjer der samler tekstknuder.
 */

/** Et stykke tekst og hvem det tilhører (en tekstknude i praksis). */
export interface Stykke<R> {
  tekst: string;
  ref: R;
}

/** Hvor et taleindeks landede: hvilket stykke, og hvor i det. */
export interface Sted<R> {
  ref: R;
  offset: number;
}

/** Sammenlignings-form: store/små bogstaver er ikke en forskel vi vil knække på,
 *  og bindestreg tæller ikke med — det er netop dén tilTale fjerner i
 *  «AI-agenter» → «AI agenter». */
const norm = (s: string): string => s.toLowerCase().replace(/[-\u2010-\u2015]/g, "");

/** Ordene i en streng, med deres startindeks. */
function ord(tekst: string): { ord: string; fra: number }[] {
  const ud: { ord: string; fra: number }[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tekst)) !== null) ud.push({ ord: m[0], fra: m.index });
  return ud;
}

/**
 * Kort fra taleindeks → sted i stykkerne. `kort[i]` er null hvor talen ikke
 * kunne genfindes — ærligere end at pege et vilkårligt sted hen.
 *
 * ORDET ER ENHEDEN, ikke tegnet. Første udgave gik tegn for tegn, og den fejlede
 * på præcis den slags afvigelse den var bygget til at tåle: talen «ganske» mod
 * tekstens «HELT» fik den til at samle a-n-s-k-e op spredt ud over «andet står»,
 * og så var markøren trukket for langt til at resten kunne findes. Målt: 21 af
 * 49 tegn genfundet. Et helt ord kan ikke samles op ved et tilfælde på samme
 * måde, og Azures tidskoder er alligevel pr. ord.
 *
 * `maksSpring` er hvor mange ORD der må springes over før vi opgiver at
 * synkronisere igen — et loft, så en artikel der VIRKELIG afviger ikke får os
 * til at lede resten af dokumentet igennem for hvert ord.
 */
export function byggKort<R>(tale: string, stykker: readonly Stykke<R>[], maksSpring = 12): (Sted<R> | null)[] {
  const kort: (Sted<R> | null)[] = new Array(tale.length).fill(null);

  // Stykkerne som ÉN streng, med en tilbagevej til (stykke, offset) — så
  // ord-opslaget kan arbejde på sammenhængende tekst selvom ordet er delt
  // over to tekstknuder, hvilket er det normale efter rendering.
  let flad = "";
  const hvor: { ref: R; offset: number }[] = [];
  for (const s of stykker) {
    for (let i = 0; i < s.tekst.length; i++) { flad += s.tekst[i]; hvor.push({ ref: s.ref, offset: i }); }
  }

  const taleOrd = ord(tale);
  const tekstOrd = ord(flad);
  let ti = 0;
  /** Hvor langt inde i det NUVÆRENDE tekstord vi er nået (i normaliseret form). */
  let forbrugt = 0;

  for (const t of taleOrd) {
    const soegt = norm(t.ord);
    if (soegt === "") continue; // et ord uden bogstaver matcher alt — og dermed intet

    let traef = -1;
    let start = 0;
    for (let i = ti; i < Math.min(ti + maksSpring, tekstOrd.length); i++) {
      const n = norm(tekstOrd[i]!.ord);
      if (n === "") continue;
      const fra = i === ti ? forbrugt : 0;
      const rest = n.slice(fra);
      // ET TEKSTORD KAN DÆKKE FLERE TALEORD. «AI-agenter» på skærmen er
      // «AI agenter» i talen, fordi tilTale fjerner bindestregen — 60+
      // forekomster i vores artikler, altså det normale og ikke kantsagen.
      // Derfor forbruges tekstordet stykkevis frem for at blive brugt op.
      if (rest.startsWith(soegt) || soegt.startsWith(rest)) { traef = i; start = fra; break; }
    }
    if (traef === -1) continue; // ordet blev ikke genfundet — feltet står null

    const mål = tekstOrd[traef]!;
    const n = norm(mål.ord);
    // Normaliseringen fjerner tegn, så et normaliseret indeks skal oversættes
    // tilbage til det rå ord. Uden dét ville markeringen sidde ét tegn galt på
    // hvert eneste ord med bindestreg.
    const raaIndeks = (i: number): number => {
      let set = 0;
      for (let j = 0; j < mål.ord.length; j++) {
        if (norm(mål.ord[j]!) === "") continue;
        if (set === i) return j;
        set++;
      }
      return Math.max(0, mål.ord.length - 1);
    };
    const brugt = Math.min(soegt.length, n.length - start);
    for (let j = 0; j < t.ord.length; j++) {
      const pos = mål.fra + raaIndeks(start + Math.min(j, brugt - 1));
      kort[t.fra + j] = hvor[pos] ?? null;
    }
    if (start + brugt >= n.length) { ti = traef + 1; forbrugt = 0; }
    else { ti = traef; forbrugt = start + brugt; }
  }
  return kort;
}

/**
 * Et taleinterval → start og slut i stykkerne, klar til et DOM-Range.
 *
 * Slutstedet er det sidste tegn PLUS ét, fordi et Range er halvåbent. Null når
 * hverken start eller slut kunne genfindes; falder tilbage på den nærmeste
 * kendte position i hver ende, så et enkelt ukendt tegn ikke koster hele ordet.
 */
export function omraadeTil<R>(
  kort: readonly (Sted<R> | null)[],
  fra: number,
  til: number,
): { start: Sted<R>; slut: Sted<R> } | null {
  let a: Sted<R> | null = null;
  for (let i = fra; i < til && i < kort.length; i++) if ((a = kort[i] ?? null)) break;
  let b: Sted<R> | null = null;
  for (let i = Math.min(til, kort.length) - 1; i >= fra; i--) if ((b = kort[i] ?? null)) break;
  if (!a || !b) return null;
  return { start: a, slut: { ref: b.ref, offset: b.offset + 1 } };
}
