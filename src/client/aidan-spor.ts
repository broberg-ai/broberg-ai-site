/* F007.18 — ruten gennem sitet, og reglerne der vælger forslag ud fra den.
 *
 * Christian, 8/9: «de forslag skal være adaptive ift. den side brugere er på
 * lige nu og samlet set ALLE de sider de har besøgt».
 *
 * Ren logik her, DOM-limen i enhance.ts — samme deling som aidan-hilsen.ts,
 * og af samme grund: en prøve på «der vises tre pills» består også hvis det er
 * de samme tre hver gang. Det er UDVÆLGELSEN der er funktionen, og den skal
 * kunne forsegles for sig.
 *
 * Ruten forlader aldrig browseren. Den bor i sessionStorage og dør med besøget.
 */

/** Ét besøg, ikke på tværs af besøg — en rute fra i går siger intet om i dag. */
export const SPOR_NOEGLE = "aidan-spor-v1";
/** Loft, så en lang session ikke fylder lageret. De nyeste er de vigtigste. */
export const SPOR_LOFT = 30;

export type PillRegel = {
  /** Ruter forslaget hører til. Tom liste = generelt (skrevet «*» i CMS'et). */
  ruter: string[];
  tekst: string;
};

/** Stier sammenlignes uden efterstillet skråstreg og uden sprogpræfiks, så
 *  «/da/podcast», «/podcast/» og «/podcast» er den samme side. Uden det ville
 *  en regel skulle skrives to gange for et tosproget site. */
export function normaliser(sti: string): string {
  const uden = sti.split("?")[0]!.split("#")[0]!;
  const utensprog = uden.replace(/^\/(da|en)(?=\/|$)/, "");
  const trimmet = utensprog.replace(/\/+$/, "");
  return trimmet || "/";
}

/** Matcher reglen denne side? Præfiks, så «/flagskibe» også dækker
 *  «/flagskibe/consulting» — men kun på et helt segment, så «/flagskibet»
 *  IKKE rammes. En regel på «/» er forsiden alene, ikke hele sitet. */
export function rammer(rute: string, sti: string): boolean {
  const r = normaliser(rute);
  const s = normaliser(sti);
  if (r === "/") return s === "/";
  return s === r || s.startsWith(r + "/");
}

/**
 * CMS-formatet, én regel pr. linje:
 *
 *     /flagskibe/consulting, /flagskibe | Hvad koster et rådgivningsforløb?
 *     * | Hvad kan I bygge for mig?
 *
 * En linje uden «|» er en generel regel — så en redaktør der bare skriver tre
 * sætninger får noget der virker, frem for ingenting.
 */
export function laesRegler(raa: string): PillRegel[] {
  return raa
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((linje): PillRegel | null => {
      const i = linje.indexOf("|");
      if (i === -1) return { ruter: [], tekst: linje };
      const tekst = linje.slice(i + 1).trim();
      if (!tekst) return null;
      const ruter = linje
        .slice(0, i)
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s && s !== "*");
      return { ruter, tekst };
    })
    .filter((r): r is PillRegel => r !== null);
}

/**
 * Vælg forslagene. Tre lag i denne rækkefølge — og rækkefølgen ER funktionen:
 *
 *   1. reglen matcher siden man er PÅ nu
 *   2. reglen matcher en side man har SET tidligere i besøget
 *   3. de generelle
 *
 * Lag 2 er det der gør det til en rute frem for et øjebliksbillede: har man
 * læst om consulting og står nu på kontaktsiden, er consulting-spørgsmålet
 * stadig det mest relevante at kunne klikke.
 */
export function vaelgPills(
  regler: PillRegel[],
  nuSti: string,
  spor: string[],
  antal = 3,
): string[] {
  const tidligere = spor.filter((s) => normaliser(s) !== normaliser(nuSti));
  const lag = (n: 0 | 1 | 2) =>
    regler.filter((r) => {
      if (n === 2) return r.ruter.length === 0;
      if (r.ruter.length === 0) return false;
      if (n === 0) return r.ruter.some((rute) => rammer(rute, nuSti));
      return r.ruter.some((rute) => tidligere.some((s) => rammer(rute, s)));
    });

  const ud: string[] = [];
  for (const n of [0, 1, 2] as const) {
    for (const r of lag(n)) {
      if (ud.length >= antal) return ud;
      if (!ud.includes(r.tekst)) ud.push(r.tekst);
    }
  }
  return ud;
}

/* ── Lageret. Alt tåler et lukket lager (privat vindue, blokerede cookies) ved
      at svare «ingen rute» frem for at kaste — så falder forslagene tilbage til
      de generelle, hvilket er den harmløse retning. ───────────────────────── */

export function laesSpor(): string[] {
  try {
    const raa: unknown = JSON.parse(sessionStorage.getItem(SPOR_NOEGLE) || "[]");
    return Array.isArray(raa) ? raa.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

/** Noterer siden og svarer med den fulde rute. Samme side to gange i træk
 *  tælles én gang — en genindlæsning er ikke et nyt sidebesøg. */
export function noterSide(sti: string): string[] {
  const spor = laesSpor();
  const n = normaliser(sti);
  if (spor[spor.length - 1] !== n) spor.push(n);
  const skaaret = spor.slice(-SPOR_LOFT);
  try {
    sessionStorage.setItem(SPOR_NOEGLE, JSON.stringify(skaaret));
  } catch {
    /* lukket lager — forslagene bliver de generelle, og det er acceptabelt */
  }
  return skaaret;
}
