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
/** F016.4 — et forslag der ALTID handler om siden man står på.
 *
 *  Christian: «Har du noget som helst adaptivt der matcher den side jeg er på
 *  når de kommer frem? Du viser 4 forslag, 1 af dem kunne godt handle om temaet
 *  på den side jeg er på.»
 *
 *  Målt: 9 ruter har en håndskrevet regel. Artikler (/ai-metode/…, /platform/…,
 *  /bag-om/…), tag-sider og de 13 enkelte flagskibe har INGEN — dér faldt alle
 *  forslag tilbage på de tre generelle, og intet handlede om siden.
 *
 *  Løsningen er ikke en regel pr. side. Det ville vokse med hver ny artikel og
 *  være forældet den dag nogen glemmer at tilføje en. I stedet BYGGES forslaget
 *  af sidens egen titel, som allerede står i DOM'en — så en side der oprettes i
 *  morgen er dækket uden at nogen rører CMS'et.
 *
 *  Skabelonen bor i CMS'et (aidanSideForslag), så ordlyden kan rettes uden en
 *  udrulning. Tom skabelon eller tom titel → ingenting, og de håndskrevne
 *  regler klarer sig selv som før.
 */
export function sideForslag(skabelon: string, sideTitel: string): string | null {
  const t = sideTitel.trim();
  const s = skabelon.trim();
  if (!t || !s || !s.includes("{titel}")) return null;
  return s.replace("{titel}", t);
}

/** F016.5 — har DENNE rute sin egen regel, eller er den bare dækket af en
 *  præfiks-regel for en hel sektion?
 *
 *  Christian, på /flagskibe/cms: «Her er jeg på cms flagship siden men ikke et
 *  ord om CMS». Han havde ret, og fejlen var min: F016.4 byggede kun et
 *  titel-forslag når ingen regel ramte ruten — men `/flagskibe` RAMMER
 *  `/flagskibe/cms` som præfiks, uden at sige noget som helst om CMS.
 *
 *  «Har en regel» og «har en regel om NETOP denne side» er to forskellige ting,
 *  og jeg behandlede dem som én. Præcis samme fejlform som resten af ugen: et
 *  svar der er rigtigt på et bredere spørgsmål end det stillede.
 *
 *  Derfor EKSAKT match her. En sektionsregel er stadig god — den kommer bare
 *  ikke først, når siden selv kan sige hvad den handler om.
 */
export function harEksaktRegel(regler: PillRegel[], sti: string): boolean {
  const nu = normaliser(sti);
  return regler.some((r) => r.ruter.some((rute) => normaliser(rute) === nu));
}

export function vaelgPills(
  regler: PillRegel[],
  nuSti: string,
  spor: string[],
  antal = 3,
  /** Hvor mange sider brugeren har set i dette besøg. Roterer hvilke af de
   *  primede kandidater der vises, når der er flere end der er plads til. */
  rotation = 0,
): string[] {
  const tidligere = spor.filter((s) => normaliser(s) !== normaliser(nuSti));
  /** Hvor SPECIFIKT rammer reglen den her sti? Længden af den længste af
   *  reglens ruter der matcher. `/flagskibe/cms` (15) slår `/flagskibe` (10).
   *
   *  F016.7 — uden den her stod sektionens spørgsmål først på /flagskibe/cms,
   *  fordi begge regler ligger i SAMME lag og rækkefølgen var filens.
   *  Christian så det med det samme: «ikke et ord om CMS». At sortere efter
   *  hvor præcist en regel rammer, er forskellen på «en regel der gælder her»
   *  og «reglen der handler om her».
   */
  const praecision = (r: PillRegel) =>
    Math.max(...r.ruter.filter((rute) => rammer(rute, nuSti)).map((rute) => normaliser(rute).length), 0);

  const lag = (n: 0 | 1 | 2) => {
    const valgte = regler.filter((r) => {
      if (n === 2) return r.ruter.length === 0;
      if (r.ruter.length === 0) return false;
      if (n === 0) return r.ruter.some((rute) => rammer(rute, nuSti));
      return r.ruter.some((rute) => tidligere.some((s) => rammer(rute, s)));
    });
    // Kun lag 0 sorteres: dér findes både sidens egne og sektionens regler.
    // Lag 1 (tidligere sete sider) og 2 (generelle) beholder deres orden fra
    // CMS'et, som er redaktørens prioritering.
    return n === 0
      ? valgte.slice().sort((a, b) => praecision(b) - praecision(a))
      : valgte;
  };

  const ud: string[] = [];
  for (const n of [0, 1, 2] as const) {
    // F016.6 — er der PRIMET flere kandidater end der er plads til, roteres
    // startpunktet. Christian: «Kan vi prime x antal beskeder der kan vælges
    // mellem?» Uden rotation ville kun de tre første af fem nogensinde blive
    // vist, og de sidste to var skrevet forgæves.
    //
    // Rotationen er DETERMINISTISK ud fra et tal kalderen giver (sidevisninger
    // i dette besøg), ikke tilfældig: en bruger der scroller op og ned skal se
    // det samme, mens den der kommer igen ser noget nyt. Tilfældighed pr.
    // gennemløb ville skifte forslagene mens man kigger på dem.
    // F016.8 — roter INDEN FOR den mest specifikke gruppe, ikke på tværs.
    //
    // Første udgave roterede over hele laget. På /flagskibe/trail betød det at
    // startpunktet kunne lande forbi trails egne fem og ned i sektionens — og
    // så fik trail-siden ét trail-spørgsmål og to om flagskibe i almindelighed.
    // Rotationen skulle give VARIATION mellem sidens egne, ikke bytte dem væk.
    const kandidater = lag(n);
    const top = n === 0 && kandidater.length ? praecision(kandidater[0]) : -1;
    const gruppe = n === 0 ? kandidater.filter((r) => praecision(r) === top) : kandidater;
    const resten = n === 0 ? kandidater.filter((r) => praecision(r) !== top) : [];
    const start = gruppe.length > antal ? rotation % gruppe.length : 0;
    const raekke = [
      ...gruppe.map((_, i) => gruppe[(start + i) % gruppe.length]),
      ...resten,
    ];
    for (const r of raekke) {
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
