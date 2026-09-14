/**
 * Sidevognen — det voice-engine får ved siden af lyden.
 *
 * ÉT sted, fordi to steder er hvordan de driver fra hinanden: den her fil
 * bruges både af den fulde produktion (lav-alle-oplaesninger.ts) og af
 * opdateringen af mapper der allerede findes (tilfoej-justeringsordbog.ts).
 * Skrev de hver sin udgave, ville en mappe lavet i dag og en lavet i morgen
 * se ens ud og betyde noget forskelligt.
 */
import { udtaleFor, ordbogNoegle, justeringsFor, justeringsNoegle } from "@/aidan-laes.ts";
import { TAL_REGEL_VERSION } from "@/tal-paa-dansk.ts";

export type Locale = "da" | "en";

/** Sproget står i stien, og det er dét voice-engine skal bruge for at vælge
 *  den rigtige model. Uden feltet kørte de dansk genkendelse på engelsk tale
 *  — de spurgte selv 14/9, og det forklarer hvorfor «16.838» kom retur som
 *  «16» og «838» hver for sig på de engelske artikler. */
export const sprogFor = (sti: string): Locale => (sti.startsWith("/en/") ? "en" : "da");

export function udtaleordbogFil(tale: string, locale: Locale): string {
  return JSON.stringify({
    // «noegle» beholdes så voice-engines nuværende port bliver ved med at virke.
    noegle: ordbogNoegle(locale),
    noegle_lyd: ordbogNoegle(locale),
    noegle_justering: justeringsNoegle(tale, locale),
    tal_regel: TAL_REGEL_VERSION,
    sprog: locale,
    // ÆNDRER hvad Azure siger. Porten gater på den.
    ordbog: udtaleFor(locale),
    // BESKRIVER kun hvad Azure allerede sagde. Når aldrig stemmen.
    justering: justeringsFor(tale, locale),
  }, null, 2);
}
