/* Aidan og Airina som LEVENDE figurer — ÉT sted.
 *
 * Flyttet ud af AidanWidget.tsx da podcast-siden skulle bruge de samme to
 * figurer (Christian, 8/9: «Brug denne som deres fulde Podcast avatar - gerne
 * din SVG animerede udgave»). Koordinaterne nedenfor er MÅLT i browseren på de
 * rigtige filer; blev de kopieret til en anden fil, ville de to udgaver ikke
 * være gale den dag de skrives, men den dag den ene bliver rettet. Husets
 * klassiske fælde, og grunden til at denne fil findes.
 */
import type { JSX } from "preact";

/** De kanoniske stillbilleder. Livet tegnes ovenpå. */
export const AIDAN_STILL = "/uploads/aidan-kanonisk-rfjl.svg";
export const AIRINA_STILL = "/uploads/airina-klasser-77ms.svg";

/** Liv i den stillestående figur UDEN en ny video og UDEN at røre original-SVG'en
 *  (ejerens to krav, 6/9). Et overlay i figurens EGET koordinatsystem
 *  (viewBox 0 0 1024 1024), så delene rammer præcis. Positioner og farver er
 *  MÅLT i browseren på den rigtige fil, ikke gættet:
 *
 *    øjne     (389,405) + (634,405) r53   hovedet bagved: #f7bd64
 *    hjul     (514,717) r65               skiven: #ea8f1f, mørk: #030202
 *    antenne  (514,62)  r31               kuglen: #df5416
 *
 *  VIGTIGT — koordinaterne gælder HVILETILSTANDEN, hvor figuren viser den
 *  kanoniske SVG-poster. Vinke-videoen er en ANDEN positur, og robotten
 *  bevæger sig i den (målt: antennekuglen svinger 68 enheder = 3x sin egen
 *  bredde), så overlayet ville sidde ved siden af. Derfor slukkes det mens
 *  videoen kører (.spiller) — se brand.css.
 *
 *  Alt er sjældent og kort — figuren skal virke levende, ikke urolig. */
export function Liv({ klasse }: { klasse: string }) {
  const prikker = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg class={klasse} viewBox="0 0 1024 1024" aria-hidden="true" focusable="false">
      {/* Øjenlåg. Det gyldne dække ALENE var ikke et blink — det så ud som om
          øjnene blev visket ud (målt på figuren 6/9). Buen ovenpå er det der
          gør det til et lukket øje frem for et manglende. */}
      {[389, 634].map((cx, i) => (
        <g key={cx} class={i ? "liv-laag liv-laag-2" : "liv-laag"}>
          <ellipse cx={cx} cy="405" rx="56" ry="56" fill="#f7bd64" />
          <path d={`M ${cx - 40} 398 Q ${cx} 430 ${cx + 40} 398`} fill="none"
            stroke="#030202" stroke-width="13" stroke-linecap="round" />
        </g>
      ))}
      {/* Hjulet: skiven dækkes og prikkerne tegnes igen, så de kan dreje */}
      <g class="liv-hjul">
        <circle cx="514" cy="717" r="64" fill="#ea8f1f" />
        <circle cx="514" cy="717" r="64" fill="none" stroke="#030202" stroke-width="9" />
        <g class="liv-hjul-drej">
          {prikker.map((g) => (
            <circle key={g} cx="514" cy="717" r="7.5" fill="#030202"
              transform={`rotate(${g} 514 717) translate(0 -40)`} />
          ))}
        </g>
        <circle cx="514" cy="717" r="15" fill="#030202" />
      </g>
      {/* Antennekuglen: grønt blink oven på den orange */}
      <circle class="liv-antenne" cx="514" cy="62" r="30" fill="#34d399" />
    </svg>
  );
}

/** Airinas liv. Hun er en ANDEN figur i et ANDET koordinatsystem — hendes SVG
 *  er 2048 hvor Aidans er 1024 — så intet af Aidans tal kan genbruges. Målt på
 *  hendes egen fil 6/9 (klasserne a0-a10 er Illustrators, ikke vores):
 *
 *    øjne     (669,893) rx185 + (1124,893) rx212   ansigtet bagved: #eece94
 *    antenne  (1396,151) r44                       kuglen: den orange på spidsen
 *
 *  INTET HJUL: hun har en glat maveknap, ikke Aidans prikke-skive, så der er
 *  ingen prikker at dreje. En rotation ville ikke kunne ses. */
export function LivAirina({ klasse }: { klasse: string }) {
  const oejne: Array<[number, number, number]> = [[669, 893, 185], [1124, 893, 212]];
  return (
    <svg class={klasse} viewBox="0 0 2048 2048" aria-hidden="true" focusable="false">
      {oejne.map(([cx, cy, rx], i) => (
        <g key={cx} class={i ? "liv-laag liv-laag-2" : "liv-laag"}>
          <ellipse cx={cx} cy={cy} rx={rx} ry="199" fill="#eece94" />
          <path d={`M ${cx - rx * 0.72} ${cy - 16} Q ${cx} ${cy + 62} ${cx + rx * 0.72} ${cy - 16}`}
            fill="none" stroke="#0c0c0f" stroke-width="26" stroke-linecap="round" />
        </g>
      ))}
      {/* Vipperne bliver stående — de hører til ansigtet, ikke til øjet. */}
      <circle class="liv-antenne" cx="1396" cy="151" r="44" fill="#34d399" />
    </svg>
  );
}

export function Figur({ klasse }: { klasse: string }) {
  return (
    <>
      {/* Aidan er STILBILLEDET plus liv-laget — ejerens valg 6/9: «DIN er bedre
          end videoen der heller ikke vises helt i samme størrelse». Vinke-klippene
          er dermed ude af figuren; livet ligger nu i SVG'en hele tiden i stedet for
          at vente på at en video bliver færdig. */}
      <span class={`${klasse} figur-aidan`} aria-hidden="true">
        <img class="aidan-still" src={AIDAN_STILL} alt="" width="1024" height="1024" />
        <Liv klasse="aidan-liv" />
      </span>
      <span class={`${klasse} figur-airina`} aria-hidden="true">
        <img class="aidan-still" src={AIRINA_STILL} alt="" width="2048" height="2048" />
        <LivAirina klasse="aidan-liv" />
      </span>
    </>
  );
}

/** ÉN vært som levende figur — UDEN loading="lazy": de to står øverst på
 *  podcast-siden, og en halvt indlæst figur er det første man ser.
 *
 *  ÉN vært som levende figur — til podcast-siden, hvor de to står ved siden af
 *  hinanden og begge skal vises. AidanWidget bruger `Figur`, som lægger begge i
 *  DOM'en og lader CSS vælge; her er valget kendt på serveren. */
export function VaertFigur({ vaert, klasse }: { vaert: "aidan" | "airina"; klasse: string }): JSX.Element {
  const aidan = vaert === "aidan";
  return (
    <span class={klasse} aria-hidden="true">
      <img
        class="aidan-still"
        src={aidan ? AIDAN_STILL : AIRINA_STILL}
        alt=""
        width={aidan ? 1024 : 2048}
        height={aidan ? 1024 : 2048}
      />
      {aidan ? <Liv klasse="aidan-liv" /> : <LivAirina klasse="aidan-liv" />}
    </span>
  );
}
