/**
 * F024.2 — supportformularen. Indgang 1 af to (den anden er Aidan).
 *
 * Poster til VORES egen /api/support, ikke direkte til HelpDesk: nøglen må
 * aldrig nå et JS-bundt. Serveren opretter sagen og falder tilbage til
 * CMS'ets formular-motor hvis HelpDesk ikke svarer — så en henvendelse ikke
 * kan forsvinde mens siden siger tak.
 *
 * FELTERNE ER DET MINDSTE DER DUER, ikke den endelige form. Christian:
 * formularen «kan udbygges med mere eller mindre avanceret input». Et nyt
 * felt kræver ingen ændring i kaldet til HelpDesk — det lander i sagens krop.
 */
import type { Locale } from "@/config.ts";
import type { CmsRef } from "@/content/types.ts";
import { cmsAttrs } from "@/components/sections.tsx";

export interface SupportCopy {
  overskrift?: string;
  manchet?: string;
  felter?: Record<string, string>;
}

export function Support({ data, locale, cmsRef }: { data: SupportCopy; locale: Locale; cmsRef?: CmsRef }) {
  const isEn = locale === "en";
  const f = (key: string, fallback: string): string => data.felter?.[key] ?? fallback;
  const fa = (key: string) => cmsAttrs(cmsRef, `supportForm.${key}`);
  return (
    <section id="support">
      <div class="wrap">
        <div class="cta-final">
          <div class="eyebrow" style="display:inline-flex" {...cmsAttrs(cmsRef, "supportEyebrow")}>
            {data.overskrift ?? (isEn ? "Support" : "Support")}
          </div>
          <h2 {...cmsAttrs(cmsRef, "supportHeading")}>
            {f("heading", isEn ? "Something not working?" : "Er der noget der driller?")}
          </h2>
          <p class="lead" style="margin:18px auto 30px" {...cmsAttrs(cmsRef, "supportLead")}>
            {f("lead", isEn
              ? "Write to us here. You get a case reference straight away — and a human sees it."
              : "Skriv til os her. Du får en sagsreference med det samme — og et menneske ser den.")}
          </p>
          <form
            id="support-form"
            data-testid="support-form"
            data-lang={locale}
            novalidate
            style="max-width:560px;margin:0 auto;text-align:left"
          >
            <div class="form-field">
              <label for="sf-emne"><span {...fa("emne")}>{f("emne", isEn ? "Subject (optional)" : "Emne (valgfrit)")}</span></label>
              <input id="sf-emne" name="emne" data-testid="support-input-emne" />
            </div>
            <div class="form-field">
              <label for="sf-besked"><span {...fa("besked")}>{f("besked", isEn ? "What happened?" : "Hvad er der sket?")}</span></label>
              <textarea id="sf-besked" name="besked" rows={5} required data-testid="support-input-besked" />
            </div>
            <div class="form-field">
              <label for="sf-navn"><span {...fa("navn")}>{f("navn", isEn ? "Name (optional)" : "Navn (valgfrit)")}</span></label>
              <input id="sf-navn" name="navn" data-testid="support-input-navn" />
            </div>
            <div class="form-field">
              <label for="sf-email"><span {...fa("email")}>{f("email", isEn ? "Email (optional)" : "Email (valgfrit)")}</span></label>
              <input id="sf-email" name="email" type="email" data-testid="support-input-email" />
              {/* Ærligt om hvad adressen bruges til. Den er et HINT hos
                  HelpDesk, ikke en bekræftet modtager — så vi lover ikke et
                  svar pr. mail vi ikke kan holde. */}
              <p class="form-hint" {...fa("emailNote")} data-testid="support-email-note">
                {f("emailNote", isEn
                  ? "So we can get back to you. We do not confirm the address, so keep your case reference."
                  : "Så vi kan vende tilbage. Vi bekræfter ikke adressen, så gem din sagsreference.")}
              </p>
            </div>
            {/* Honeypot — usynlig for et menneske, læst af serveren. */}
            <input type="text" name="_gotcha" tabIndex={-1} autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true" data-testid="support-honeypot" />
            <button class="btn" type="submit" style="width:100%;justify-content:center;margin-top:8px" data-testid="support-submit">
              <span {...fa("submit")}>{f("submit", isEn ? "Send" : "Send")}</span> <span class="ar">→</span>
            </button>
            <p class="form-status" data-testid="support-status"></p>
          </form>
        </div>
      </div>
    </section>
  );
}
