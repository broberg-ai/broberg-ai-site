/**
 * F024.4 — bekræftelsessiden. To knapper, og de er lige store med vilje.
 *
 * «NEJ» ER PRODUKTETS MEST VÆRDIFULDE SIGNAL. En sag der blev lukket uden at
 * være løst er det eneste input der kan gøre supporten bedre — og den slags
 * knap ender typisk som en grå tekstlink under en grøn knap. Her har de to
 * samme vægt, samme størrelse og samme afstand. Den eneste forskel er farven,
 * og den siger hvad der sker, ikke hvad vi håber du trykker på.
 */
import type { Locale } from "@/config.ts";
import type { CmsRef } from "@/content/types.ts";
import type { Afvist } from "@/bekraeftelse.ts";
import { cmsAttrs } from "@/components/sections.tsx";

export interface BekraeftCopy {
  (key: string, fallback: string): string;
}

/** Hver afvisning har SIN EGEN tekst. Samlede vi dem til «der skete en fejl»,
 *  ville et brugt link og et udløbet link se ens ud — og kun det ene betyder
 *  at brugeren allerede har svaret. */
const AFVIST_TEKST: Record<Afvist, { da: [string, string]; en: [string, string] }> = {
  used: {
    da: ["Du har allerede svaret", "Tak — dit svar er registreret. Du behøver ikke gøre mere."],
    en: ["You have already answered", "Thanks — your answer is registered. Nothing more to do."],
  },
  expired: {
    da: ["Linket er udløbet", "Der er gået for lang tid. Skriv til os igen, så tager vi den derfra."],
    en: ["The link has expired", "Too much time has passed. Write to us again and we'll pick it up from there."],
  },
  unknown: {
    da: ["Vi kan ikke finde linket", "Tjek at hele adressen kom med — den er lang og knækker let i en mail."],
    en: ["We can't find that link", "Check that the whole address came through — it's long and breaks easily in mail."],
  },
  "ukendt-grund": {
    da: ["Vi kunne ikke slå linket op", "Det er vores side der driller, ikke dit link. Prøv igen om lidt."],
    en: ["We couldn't look up that link", "That's our end, not your link. Try again in a moment."],
  },
};

export function Bekraeftelse({
  token, brugbar, ref, emne, grund, locale, g, cmsRef,
}: {
  token: string;
  brugbar: boolean;
  ref?: string;
  emne?: string;
  grund?: Afvist;
  locale: Locale;
  g: BekraeftCopy;
  cmsRef?: CmsRef;
}) {
  const isEn = locale === "en";
  const ga = (k: string) => cmsAttrs(cmsRef, `bekraeft.${k}`);

  if (!brugbar) {
    const t = AFVIST_TEKST[grund ?? "ukendt-grund"][isEn ? "en" : "da"];
    return (
      <section id="bekraeft">
        <div class="wrap" style="max-width:640px;padding-top:150px;text-align:center">
          <h1 data-testid="bekraeft-afvist-titel">{t[0]}</h1>
          <p class="lead" style="margin:18px auto 30px">{t[1]}</p>
          <a class="btn" href={isEn ? "/en/support" : "/support"} data-testid="bekraeft-til-support">
            {g("tilSupport", isEn ? "Write to support" : "Skriv til support")}
          </a>
        </div>
      </section>
    );
  }

  return (
    <section id="bekraeft">
      <div class="wrap" style="max-width:640px;padding-top:150px;text-align:center">
        <div class="eyebrow" style="justify-content:center" {...ga("eyebrow")}>
          {g("eyebrow", isEn ? "Your case" : "Din sag")}
        </div>
        <h1 {...ga("heading")} data-testid="bekraeft-titel">
          {g("heading", isEn ? "Did we solve it?" : "Blev det løst?")}
        </h1>

        {/* HVILKEN sag. Uden den er spørgsmålet ubesvarligt: folk har mere
            end én ting i gang, og en mail kan ligge en uge i indbakken. */}
        {(ref || emne) && (
          <p class="lead" style="margin:18px auto 6px" data-testid="bekraeft-sag">
            {emne ? `«${emne}»` : ""}
            {emne && ref ? " · " : ""}
            {ref ?? ""}
          </p>
        )}

        <p class="lead" style="margin:6px auto 30px" {...ga("lead")}>
          {g("lead", isEn
            ? "One tap. If it isn't solved, we reopen the case — you don't have to explain again."
            : "Ét tryk. Er den ikke løst, åbner vi sagen igen — du skal ikke forklare det hele forfra.")}
        </p>

        <form id="bekraeft-form" data-token={token} data-lang={isEn ? "en" : "da"}
              style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <button type="button" class="btn" data-svar="solved" data-testid="bekraeft-ja">
            {g("ja", isEn ? "Yes, it's solved" : "Ja, den er løst")}
          </button>
          <button type="button" class="btn btn-ghost" data-svar="not_solved" data-testid="bekraeft-nej">
            {g("nej", isEn ? "No, not yet" : "Nej, ikke endnu")}
          </button>
        </form>
        <p class="form-status" data-testid="bekraeft-status" aria-live="polite"></p>
      </div>
    </section>
  );
}
