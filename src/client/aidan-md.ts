/* Sikker rendering af Aidans modelsvar (F007).
 *
 * Christian, 4/9, med screenshot: «Hvis det er markdown så formateres det ikke
 * korrekt» — svaret viste rå **stjerner** og løse "- "-linjer. Første udgave
 * genkendte kun afsnit + links; modellen skriver naturligt også fed og lister.
 *
 * PRINCIPPET ER UÆNDRET: ALT escapes først, og derefter genkendes en LUKKET
 * liste af former. Modellen kan citere brugertekst, så rå HTML herfra må
 * aldrig nå DOM'en — derfor ingen markdown-pakke (marked sanerer ikke), kun
 * disse former:
 *   afsnit (tomme linjer) · **fed** · *kursiv* · [link](relativ|https)
 *   punktliste ("- "/"• ") · nummereret liste ("1. ")
 */

export function escHtml(t: string): string {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** CTA-token (Eir-mønstret fra sanne, 4/9): modellen skriver
 *  [knap:Tekst](/sti) og UI'et veksler det til en rigtig knap. Kontrakten er
 *  et TOKEN med kendt form — ikke "style nogle links som knapper". Loftet
 *  håndhæves i aidanTilHtml: max 2 knapper pr. svar, resten bliver
 *  almindelige links (sannes erfaring: uden loft bliver et svar en menu). */
const KNAP_RE = /\[knap:([^\]]+)\]\((\/[^)\s]*|https:\/\/[^)\s]+)\)([.,!?;:]*)/gi;

/** Inline-former på ALLEREDE escaped tekst. Rækkefølgen bærer korrektheden:
 *  1. KODE først, gemt bag pladsholdere — indholdet af `…` må aldrig ses af
 *     fed/kursiv-reglerne (Christians screenshot 4/9: `@broberg/*` bar en *,
 *     som fik fed-reglen til at fejle og vise rå ** til en besøgende).
 *  2. Knap-tokenet før den generelle link-regel (ellers æder den tokenet).
 *  3. Fed er IKKE-grådig og udelukker kun linjeskift — ikke stjerner. */
function inline(t: string, knapBudget: { tilbage: number }): string {
  const koder: string[] = [];
  let ud = t.replace(/`([^`\n]+)`/g, (_alt, kode: string) => {
    koder.push(kode);
    return `\u0000K${koder.length - 1}\u0000`;
  });
  ud = ud
    .replace(KNAP_RE, (_alt, tekst: string, href: string, tegn: string) => {
      if (knapBudget.tilbage > 0) {
        knapBudget.tilbage--;
        // Sætningstegn LIGE efter tokenet sluges: knappen renderes som blok, så
        // et efterhængt «.» ville stå alene på sin egen linje under knappen
        // (målt på Christians E2E-screenshot 4/9). På et rent link hører det med.
        return `<a class="aidan-cta" data-testid="aidan-cta" href="${href}">${tekst}</a>`;
      }
      return `<a href="${href}">${tekst}</a>${tegn}`;
    })
    .replace(/\[[a-zæøå]{2,12}:\s*([^\]]+)\]\((\/[^)\s]*|https:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\[([^\]]+)\]\((\/[^)\s]*|https:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^\n]+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s>])\*([^*\n]+)\*(?=[\s.,!?:;<]|$)/g, "$1<em>$2</em>");
  return ud.replace(/\u0000K(\d+)\u0000/g, (_alt, i: string) => `<code>${koder[Number(i)]}</code>`);
}

const PUNKT = /^\s*[-•]\s+/;
const NUMMER = /^\s*\d+[.)]\s+/;

/** Modelsvar → sikker HTML. Input er RÅ modeltekst; escaping sker her. */
export function aidanTilHtml(raa: string): string {
  const knapBudget = { tilbage: 2 };
  return escHtml(raa)
    .split(/\n{2,}/)
    .map((blok) => {
      const linjer = blok.split("\n").filter((l) => l.trim());
      if (!linjer.length) return "";
      // En blok kan blande indledning og liste («Det indeholder:\n- x\n- y»)
      // — Christians screenshot. Derfor runs af ens linjetyper, ikke
      // alt-eller-intet: hver run bliver <ul>/<ol>/afsnit for sig.
      const dele: string[] = [];
      let i = 0;
      while (i < linjer.length) {
        if (PUNKT.test(linjer[i])) {
          const run: string[] = [];
          while (i < linjer.length && PUNKT.test(linjer[i])) run.push(linjer[i++].replace(PUNKT, ""));
          dele.push(`<ul>${run.map((l) => `<li>${inline(l, knapBudget)}</li>`).join("")}</ul>`);
        } else if (NUMMER.test(linjer[i])) {
          const run: string[] = [];
          while (i < linjer.length && NUMMER.test(linjer[i])) run.push(linjer[i++].replace(NUMMER, ""));
          dele.push(`<ol>${run.map((l) => `<li>${inline(l, knapBudget)}</li>`).join("")}</ol>`);
        } else {
          const run: string[] = [];
          while (i < linjer.length && !PUNKT.test(linjer[i]) && !NUMMER.test(linjer[i])) {
            // ### Overskrift → fremhævet linje (modellen skriver dem af sig selv)
            const h = /^#{1,4}\s+(.+)$/.exec(linjer[i]);
            run.push(h ? `<strong class="aidan-h">${inline(h[1], knapBudget)}</strong>` : inline(linjer[i], knapBudget));
            i++;
          }
          dele.push(`<p>${run.join("<br>")}</p>`);
        }
      }
      return dele.join("");
    })
    .filter(Boolean)
    .join("");
}
