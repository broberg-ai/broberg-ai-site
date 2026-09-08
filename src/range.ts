/* F012.1 — HTTP Range: hvilket udsnit af filen spørger browseren om?
 *
 * Egen fil, fordi den er den ene del af /uploads-ruten der kan tage fejl på en
 * måde ingen opdager: svarer vi forkert, kan lyden ikke spoles, og knappen ser
 * ud til at virke mens den ikke gør. Målt i drift 8/9 før den fandtes.
 */
export type Udsnit =
  | { slags: "hele" }
  | { slags: "udsnit"; start: number; slut: number }
  | { slags: "ugyldigt" };

export function beregnUdsnit(range: string | undefined | null, total: number): Udsnit {
  if (!range) return { slags: "hele" };
  const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!m) return { slags: "hele" }; // en form vi ikke forstår → send hele filen

  // «bytes=-500» er de SIDSTE 500 bytes, ikke 0-500. Afspillere bruger den
  // form til at læse en fils metadata bagfra, og læses den som «fra 0» får de
  // begyndelsen af filen og konkluderer at der ingen metadata er.
  const bagfra = m[1] === "" && m[2] !== "";
  const start = bagfra ? Math.max(0, total - Number(m[2])) : Number(m[1] || 0);
  let slut = bagfra || m[2] === "" ? total - 1 : Number(m[2]);

  if (!Number.isFinite(start) || !Number.isFinite(slut)) return { slags: "ugyldigt" };
  if (start > slut || start >= total || start < 0) return { slags: "ugyldigt" };
  if (slut >= total) slut = total - 1; // for meget bedt om er ikke en fejl
  return { slags: "udsnit", start, slut };
}
