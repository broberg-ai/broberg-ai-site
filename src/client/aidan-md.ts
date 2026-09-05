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
      // Over budgettet: stadig GRAFIK, aldrig et tekst-link (Christian 5/9:
      // «der må IKKE være tekst links i chat resultatet»).
      return `<a class="aidan-lenke" href="${href}">${tekst} <i>→</i></a>${tegn}`;
    })
    .replace(/\[[a-zæøå]{2,12}:\s*([^\]]+)\]\((\/[^)\s]*|https:\/\/[^)\s]+)\)/g, '<a class="aidan-lenke" href="$2">$1 <i>→</i></a>')
    .replace(/\[([^\]]+)\]\((\/[^)\s]*|https:\/\/[^)\s]+)\)/g, '<a class="aidan-lenke" href="$2">$1 <i>→</i></a>')
    .replace(/\*\*([^\n]+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s>])\*([^*\n]+)\*(?=[\s.,!?:;<]|$)/g, "$1<em>$2</em>");
  return ud.replace(/\u0000K(\d+)\u0000/g, (_alt, i: string) => `<code>${koder[Number(i)]}</code>`);
}

const PUNKT = /^\s*[-•]\s+/;
const NUMMER = /^\s*\d+[.)]\s+/;
const STREG = /^\s*[-–—_*]{3,}\s*$/; // modellens ---/___-skillelinjer

/* ── F007.13: blok-markører (resultat-tilstande 3-20). Kontrakten er den samme
 * som [knap:]: et TOKEN med kendt form på sin egen linje. Alt er allerede
 * escaped når vi ser det, og hvert felt indsættes som TEKST — aldrig som HTML.
 * Stier valideres (kun relative /stier), så en markør ikke kan pege ud af
 * huset. [video:] tager KUN /uploads/*.mp4. */
const CASE_RE = /^\[case:(\/[^\]|\s]*)\|([^\]|]+)(?:\|([^\]]+))?\]$/;
const GRAF_RE = /^\[graf:([\d.,\s]+)\]$/;
const KILDER_RE = /^\[kilder:([^\]]+)\]$/;
const TIDER_RE = /^\[tider\]$/;
const VIS_RE = /^\[vis:([^\]]+)\]$/;
const VALG_RE = /^\[valg:([^\]]+)\]$/;
const VIDEO_RE = /^\[video:(\/uploads\/[a-zA-Z0-9._\/-]+\.mp4)\]$/;
const STATUS_RE = /^\[status\]$/;
const FEJR_RE = /^\[fejr\]$/;
const SPROG_RE = /^\[sprog:(da|en)\]$/;
const TABELLINJE = /^\s*\|.+\|\s*$/;

function sparkline(tal: number[]): string {
  const mx = Math.max(...tal), mn = Math.min(...tal);
  const spnd = mx - mn || 1;
  const pts = tal.map((v, i) => `${(i / (tal.length - 1 || 1)) * 196 + 2},${34 - ((v - mn) / spnd) * 30}`).join(" ");
  const sidste = pts.split(" ").pop();
  return `<svg class="aidan-graf" viewBox="0 0 200 38" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><circle cx="${sidste?.split(",")[0]}" cy="${sidste?.split(",")[1]}" r="4" fill="currentColor"/></svg>`;
}

/** Én markør-linje → blok-HTML, eller null hvis linjen ikke er en markør.
 *  Input er ESCAPED tekst; felterne indsættes som den tekst de er. */
function markoer(linje: string, knapBudget: { tilbage: number }): string | null {
  let m: RegExpExecArray | null;
  if ((m = CASE_RE.exec(linje))) {
    const mono = m[2].trim().slice(0, 2).toUpperCase();
    return `<a class="aidan-case" data-testid="aidan-case" href="${m[1]}"><span class="aidan-case-mono">${mono}</span><span><b>${m[2].trim()}</b>${m[3] ? `<i>${m[3].trim()}</i>` : ""}</span><span class="aidan-case-pil">→</span></a>`;
  }
  if ((m = GRAF_RE.exec(linje))) {
    const tal = m[1].split(",").map((t) => Number(t.trim())).filter((n) => Number.isFinite(n));
    return tal.length >= 2 ? `<div class="aidan-grafboks">${sparkline(tal)}</div>` : null;
  }
  if ((m = KILDER_RE.exec(linje))) {
    const led = m[1].split(";").map((k) => {
      const [sti, titel] = k.split("|").map((x) => x.trim());
      return sti?.startsWith("/") && titel ? `<a class="aidan-lenke lille" href="${sti}">${titel} <i>→</i></a>` : null;
    }).filter(Boolean);
    return led.length ? `<div class="aidan-kilder" data-testid="aidan-kilder">Kilder: ${led.join(" · ")}</div>` : null;
  }
  if (TIDER_RE.test(linje)) return `<div class="aidan-tider" data-testid="aidan-tider"></div>`;
  if ((m = VIS_RE.exec(linje)))
    return `<button type="button" class="aidan-vis" data-testid="aidan-vis" data-anker="${m[1].trim()}">✨ Vis mig det på siden</button>`;
  if ((m = VALG_RE.exec(linje))) {
    const valg = m[1].split("|").map((v) => v.trim()).filter(Boolean).slice(0, 4);
    return valg.length >= 2
      ? `<div class="aidan-valg" data-testid="aidan-valg">${valg.map((v) => `<button type="button" class="aidan-valg-chip" data-testid="aidan-valg-chip">${v}</button>`).join("")}</div>`
      : null;
  }
  if ((m = VIDEO_RE.exec(linje)))
    return `<video class="aidan-video" data-testid="aidan-video" controls preload="metadata" src="${m[1]}"></video>`;
  if (STATUS_RE.test(linje)) return `<div class="aidan-status" data-testid="aidan-status">…</div>`;
  if (FEJR_RE.test(linje)) return `<div class="aidan-fejr" data-testid="aidan-fejr" aria-hidden="true"></div>`;
  if ((m = SPROG_RE.exec(linje))) return `<span class="aidan-sprogskifte" data-sprog="${m[1]}" hidden></span>`;
  return null;
}

/** Markdown-tabellinjer → <table>. Skillerækken (|---|---|) springes over. */
function tabel(linjer: string[], knapBudget: { tilbage: number }): string {
  const rk = linjer
    .filter((l) => !/^\s*\|[\s:|-]+\|\s*$/.test(l))
    .map((l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
  const [hoved, ...krop] = rk;
  // Under STREAMING kan blokken et øjeblik bestå af skillerækken alene
  // (chunk-grænsen faldt efter «| |») — så er der ingen hovedrække, og et
  // kald på undefined ville dræbe hele læse-løkken midt i svaret (målt på
  // prod 5/9: svaret frøs ved tegn 108). Render intet; næste chunk fikser.
  if (!hoved) return "";
  return `<div class="aidan-tabel"><table><thead><tr>${hoved.map((c) => `<th>${inline(c, knapBudget)}</th>`).join("")}</tr></thead><tbody>${krop.map((r) => `<tr>${r.map((c) => `<td>${inline(c, knapBudget)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

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
        } else if (STREG.test(linjer[i])) {
          // «---» renderet som rå bindestreger lignede markdown (E2E-screenshot
          // 4/9 aften) — nu en tynd skillelinje.
          dele.push('<hr class="aidan-hr">');
          i++;
        } else if (markoer(linjer[i], knapBudget) !== null) {
          dele.push(markoer(linjer[i], knapBudget)!);
          i++;
        } else if (TABELLINJE.test(linjer[i])) {
          const run: string[] = [];
          while (i < linjer.length && TABELLINJE.test(linjer[i])) run.push(linjer[i++]);
          dele.push(tabel(run, knapBudget));
        } else {
          const run: string[] = [];
          while (i < linjer.length && !PUNKT.test(linjer[i]) && !NUMMER.test(linjer[i]) && !STREG.test(linjer[i]) && markoer(linjer[i], { tilbage: 0 }) === null && !TABELLINJE.test(linjer[i])) {
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
