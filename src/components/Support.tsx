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

export function Support({ data, flagskibe = [], locale, cmsRef }: {
  data: SupportCopy;
  /** F024.8 — navnene fra CMS'ets platforms. BONUS-INFO, ikke et krav:
   *  Christian 17/9 «et ekstra felt som bonus info». Den der ikke ved hvilket
   *  produkt det er, skal ikke stoppes af feltet. */
  flagskibe?: string[];
  locale: Locale;
  cmsRef?: CmsRef;
}) {
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
            {/* F024.8 — HVILKET FLAGSKIB. Valgfrit, og bygget som en gruppe
                radioknapper frem for et <select>: huset har en hård regel mod
                native controls, og en <select> med seksten punkter er
                desuden en dårlig oplevelse på en telefon.

                «Ved ikke / noget andet» er FØRST og forvalgt, så den der bare
                vil skrive ikke skal tage stilling til en produktliste for at
                komme videre. */}
            {flagskibe.length > 0 && (
              <div class="form-field">
                <span class="form-label" {...fa("flagskib")}>
                  {f("flagskib", isEn ? "Which product? (optional)" : "Hvilket produkt? (valgfrit)")}
                </span>
                <div class="support-flagskibe" role="radiogroup"
                     aria-label={f("flagskib", isEn ? "Which product?" : "Hvilket produkt?")}
                     data-testid="support-flagskibe">
                  <label class="support-flagskib">
                    <input type="radio" name="flagskib" value="" checked data-testid="support-flagskib-ingen" />
                    <span>{f("flagskibIngen", isEn ? "Don't know / something else" : "Ved ikke / noget andet")}</span>
                  </label>
                  {flagskibe.map((navn) => (
                    <label class="support-flagskib" key={navn}>
                      <input type="radio" name="flagskib" value={navn}
                             data-testid={`support-flagskib-${navn.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} />
                      <span>{navn}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {/* F024.2 — BEVISET PÅ AT FORMEN KAN UDBYGGES. Feltet er tilføjet
                efter at sagsoprettelsen kørte i drift, og kaldet til HelpDesk
                blev IKKE rørt: værdien går med i sagens krop gennem `ekstra`.
                Det er også det mest brugbare felt i support — «på hvilken
                side» er det første et menneske ellers skal spørge om. */}
            <div class="form-field">
              <label for="sf-hvor"><span {...fa("hvor")}>{f("hvor", isEn ? "Where did it happen? (optional)" : "Hvor skete det? (valgfrit)")}</span></label>
              <input id="sf-hvor" name="hvor" data-testid="support-input-hvor"
                     placeholder={f("hvorPlaceholder", isEn ? "e.g. the page address" : "fx sidens adresse")} />
            </div>
            <div class="form-field">
              <label for="sf-telefon"><span {...fa("telefon")}>{f("telefon", isEn ? "Phone" : "Telefon")}</span></label>
              <input id="sf-telefon" name="telefon" type="tel" data-testid="support-input-telefon"
                     autocomplete="tel" />
            </div>
            <div class="form-field">
              <label for="sf-navn"><span {...fa("navn")}>{f("navn", isEn ? "Name" : "Navn")}</span></label>
              <input id="sf-navn" name="navn" data-testid="support-input-navn" />
            </div>
            {/* MAIL ELLER TELEFON ER PÅKRÆVET — Christian 16/9. En henvendelse
                uden en vej tilbage kan ikke besvares, og et felt ingen behøver
                udfylde er dét en bot udfylder mindst. `required` står IKKE på
                felterne hver for sig: det er ET af de to der kræves, og en
                browser kan ikke udtrykke «enten-eller». Kontrollen ligger i
                enhance.ts og — det bærende — på serveren. */}
            <div class="form-field">
              <label for="sf-email"><span {...fa("email")}>{f("email", isEn ? "Email" : "Email")}</span></label>
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
