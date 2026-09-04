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

/** Inline-former på ALLEREDE escaped tekst. Links før fed/kursiv, så en * i en
 *  URL ikke kan klippe et link over. */
function inline(t: string): string {
  return t
    .replace(/\[([^\]]+)\]\((\/[^)\s]*|https:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s>])\*([^*\n]+)\*(?=[\s.,!?:;<]|$)/g, "$1<em>$2</em>");
}

const PUNKT = /^\s*[-•]\s+/;
const NUMMER = /^\s*\d+[.)]\s+/;

/** Modelsvar → sikker HTML. Input er RÅ modeltekst; escaping sker her. */
export function aidanTilHtml(raa: string): string {
  return escHtml(raa)
    .split(/\n{2,}/)
    .map((blok) => {
      const linjer = blok.split("\n").filter((l) => l.trim());
      if (!linjer.length) return "";
      // En blok er en liste når HVER linje er et punkt — ellers renderes den
      // som afsnit, så en enkelt tankestreg midt i prosa ikke bliver til <ul>.
      if (linjer.length && linjer.every((l) => PUNKT.test(l))) {
        return `<ul>${linjer.map((l) => `<li>${inline(l.replace(PUNKT, ""))}</li>`).join("")}</ul>`;
      }
      if (linjer.length && linjer.every((l) => NUMMER.test(l))) {
        return `<ol>${linjer.map((l) => `<li>${inline(l.replace(NUMMER, ""))}</li>`).join("")}</ol>`;
      }
      return `<p>${inline(blok.trim()).replace(/\n/g, "<br>")}</p>`;
    })
    .filter(Boolean)
    .join("");
}
