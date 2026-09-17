/**
 * F024.7 — henvendelsen gemmes FØR vi ringer til HelpDesk.
 *
 * ── HVORFOR DEN FINDES ───────────────────────────────────────────────────
 * F024.2 blev bygget på løftet om at en henvendelse ikke må kunne forsvinde,
 * og reservevejen skulle bære det. Målt 17/9: den reservevej har ALDRIG
 * virket i produktionen — CMS'ets formular-rute kræver et Cloudflare-bevis
 * fra en browser, og vores server kalder den uden et.
 *
 * Prøverne var grønne fordi de erstattede kaldet med et svar der sagde ok.
 * De beviste at vi RINGER, ikke at der bliver taget imod.
 *
 * ── HVORFOR EN KØ FREM FOR AT REPARERE RESERVEVEJEN ──────────────────────
 * En kø virker uanset HVEM der er nede — dem eller reservevejen. Og den
 * flytter fejlen fra «hendes ord er væk» til «leveringen mangler endnu»,
 * hvilket er en tilstand man kan gøre noget ved.
 *
 * ── DEN FARLIGSTE FEJL ER IKKE AT KØEN FEJLER ────────────────────────────
 * Det er at den genforsøger noget der ALLEREDE lykkedes. Én tabt henvendelse
 * er én skuffet person; en dublet-storm gør support-systemet ubrugeligt.
 *
 * To net mod det: `leveret` skrives ved succes og tjekkes før hvert
 * genforsøg — OG genforsøget bruger SAMME intakeKey, så HelpDesks egen
 * dublet-spærre gør to forsøg til én sag. Nettet under nettet.
 */
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Stien læses PR. KALD, ikke én gang ved import.
 *
 * Som konstant var den frosset før nogen prøve nåede at pege den et andet
 * sted hen — nøjagtig samme fejl som `BASE` i helpdesk.ts havde i morges,
 * hvor den fik testpakken til at kalde HelpDesks produktion. Her var
 * konsekvensen mildere (prøven ville skrive mod /data og fejle), men fælden
 * er den samme: en værdi låst ved import kan ikke overstyres af den der
 * bruger modulet.
 */
const koFil = () => process.env.SUPPORT_KO ?? "/data/support-ko.jsonl";

export interface KoPost {
  /** Vores egen id — også nøglen når en linje skal markeres leveret. */
  id: string;
  oprettet: number;
  /** HelpDesks dublet-nøgle. SAMME ved genforsøg, ellers er køen en dublet-maskine. */
  intakeKey: string;
  /** Hele kaldet, som vi ville sende det. Gemt RÅT, så et genforsøg ikke skal
   *  genopbygge noget — en genopbygning er et nyt sted fejlen kan snige sig ind. */
  kald: Record<string, unknown>;
  kanal: string;
  leveret?: number;
  ref?: string;
  forsoeg: number;
  sidsteFejl?: string;
}

export const koTaeller = { skrevet: 0, leveret: 0, ventende: 0, skrivefejl: 0 };

/**
 * Skriver henvendelsen ned. Kaldes FØR kaldet til HelpDesk.
 *
 * KASTER ALDRIG, men SIGER om det lykkedes. Kan vi ikke skrive, må
 * henvendelsen stadig forsøges — en kø der blokerer leveringen ville gøre
 * skaden større end den forhindrer.
 *
 * MEN SVARET TIL HENDE AFHÆNGER AF DET. «Vi har din besked» er en LØGN hvis
 * skrivningen fejlede, og det er den værste af alle udfald: hun går fra
 * skærmen i den tro at nogen har hendes ord, og ingen har dem. Derfor
 * returneres resultatet frem for at blive slugt.
 */
export async function skrivIKo(post: Omit<KoPost, "oprettet" | "forsoeg">): Promise<boolean> {
  try {
    await mkdir(path.dirname(koFil()), { recursive: true });
    await appendFile(koFil(), JSON.stringify({ ...post, oprettet: Date.now(), forsoeg: 0 }) + "\n", "utf-8");
    koTaeller.skrevet++;
    return true;
  } catch (e) {
    koTaeller.skrivefejl++;
    console.error("[ko] kunne IKKE gemme henvendelsen:", String(e));
    return false;
  }
}

/** Markerer en post som leveret. Efter dette genforsøges den aldrig. */
export async function markerLeveret(id: string, ref: string): Promise<void> {
  await opdater(id, (p) => ({ ...p, leveret: Date.now(), ref }));
  koTaeller.leveret++;
}

/** Skriver fejlen og tæller forsøget, så en post der bliver ved at fejle er synlig. */
export async function markerFejlet(id: string, fejl: string): Promise<void> {
  await opdater(id, (p) => ({ ...p, forsoeg: p.forsoeg + 1, sidsteFejl: fejl.slice(0, 200) }));
}

async function opdater(id: string, f: (p: KoPost) => KoPost): Promise<void> {
  try {
    const linjer = await laesAlle();
    const ud = linjer.map((p) => (p.id === id ? f(p) : p));
    await writeFile(koFil(), ud.map((p) => JSON.stringify(p)).join("\n") + "\n", "utf-8");
  } catch (e) {
    koTaeller.skrivefejl++;
    console.error("[ko] kunne ikke opdatere", id, String(e));
  }
}

export async function laesAlle(): Promise<KoPost[]> {
  try {
    const t = await readFile(koFil(), "utf-8");
    return t.split("\n").filter(Boolean).map((l) => JSON.parse(l) as KoPost);
  } catch {
    return [];   // filen findes ikke endnu — det er ikke en fejl
  }
}

/** De poster der ALDRIG er leveret. `leveret` tjekkes eksplicit, ikke via en
 *  sandhedsværdi: 0 er et gyldigt tidsstempel i teorien og ville være falsy. */
export async function ventende(): Promise<KoPost[]> {
  return (await laesAlle()).filter((p) => p.leveret === undefined);
}

export async function koStatus(): Promise<{ ventende: number; leveret: number; ialt: number; aeldsteVentendeMs: number | null }> {
  const alle = await laesAlle();
  const v = alle.filter((p) => p.leveret === undefined);
  return {
    ialt: alle.length,
    leveret: alle.length - v.length,
    ventende: v.length,
    // Hvor LÆNGE nogen har ventet er det tal der betyder noget. «3 ventende»
    // er harmløst hvis de er et minut gamle og en alarm hvis de er to dage.
    aeldsteVentendeMs: v.length ? Date.now() - Math.min(...v.map((p) => p.oprettet)) : null,
  };
}

/**
 * Genforsøger det der står tilbage.
 *
 * SAMME `intakeKey` SOM FØRSTE FORSØG — det er nettet under nettet. Lykkedes
 * leveringen i virkeligheden men svaret gik tabt undervejs, giver HelpDesk os
 * den EKSISTERENDE sag med created:false i stedet for en dublet. Uden den
 * nøgle ville køen være en dublet-maskine, og det er værre end tabet den
 * skulle forhindre: én tabt henvendelse er én skuffet person, en dublet-storm
 * gør support-systemet ubrugeligt.
 */
export async function draenKo(
  lever: (kald: Record<string, unknown>) => Promise<{ ref: string }>,
  maksPrGang = 5,
): Promise<{ forsoegt: number; leveret: number }> {
  const v = (await ventende()).slice(0, maksPrGang);
  let leveret = 0;
  for (const p of v) {
    try {
      const sag = await lever(p.kald);
      await markerLeveret(p.id, sag.ref);
      leveret++;
    } catch (e) {
      await markerFejlet(p.id, e instanceof Error ? e.message : String(e));
    }
  }
  return { forsoegt: v.length, leveret };
}
