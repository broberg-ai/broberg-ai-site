/* Real contact form (F156.6) — replaces the mailto-only CTA on the sales
   landing. Posts to the F30 Form Engine's public endpoint on webhouse.app.
   Solution-type is a custom pill selector (never a native <select>), synced
   to a hidden input the browser actually submits. */
import type { Locale } from "@/config.ts";
import type { CmsRef } from "@/content/types.ts";
import { cmsAttrs, cmsHtmlAttrs } from "@/components/sections.tsx";

export interface ContactCopy {
  ctaHeadingHtml: string;
  ctaLead: string;
  eyebrow?: string;
  form?: Record<string, string>;
}

const SOLUTION_TYPES: { value: string; da: string; en: string }[] = [
  { value: "website", da: "Website", en: "Website" },
  { value: "webshop", da: "Webshop", en: "Webshop" },
  { value: "platform", da: "Platform", en: "Platform" },
  { value: "ai-integration", da: "AI Integration", en: "AI Integration" },
  { value: "unsure", da: "Ved ikke endnu", en: "Not sure yet" },
];

export function Contact({ data, locale, cmsRef }: { data: ContactCopy; locale: Locale; cmsRef?: CmsRef }) {
  const isEn = locale === "en";
  // Contact-form labels are inline-editable via landing.contactForm.<key>.
  const f = (key: string, fallback: string): string => data.form?.[key] ?? fallback;
  const fa = (key: string) => cmsAttrs(cmsRef, `contactForm.${key}`);
  return (
    <section id="kontakt">
      <div class="wrap">
        <div class="cta-final">
          <div class="eyebrow" style="display:inline-flex" {...cmsAttrs(cmsRef, "contactEyebrow")}>
            {data.eyebrow ?? (isEn ? "Contact" : "Kontakt")}
          </div>
          <h2 {...cmsHtmlAttrs(cmsRef, "ctaHeadingHtml")} dangerouslySetInnerHTML={{ __html: data.ctaHeadingHtml }} />
          <p class="lead" style="margin:18px auto 30px" {...cmsAttrs(cmsRef, "ctaLead")}>
            {data.ctaLead}
          </p>
          <form
            id="contact-form"
            data-testid="contact-form"
            data-lang={locale}
            data-success-redirect={isEn ? "/en/thanks" : "/tak"}
            novalidate
            style="max-width:560px;margin:0 auto;text-align:left"
          >
            <div class="form-field">
              <label for="cf-name"><span {...fa("name")}>{f("name", isEn ? "Name" : "Navn")}</span></label>
              <input id="cf-name" name="name" required data-testid="contact-input-name" />
            </div>
            <div class="form-field">
              <label for="cf-email"><span {...fa("email")}>{f("email", "Email")}</span></label>
              <input id="cf-email" name="email" type="email" required data-testid="contact-input-email" />
            </div>
            <div class="form-field">
              <label for="cf-phone"><span {...fa("phone")}>{f("phone", isEn ? "Phone" : "Telefon")}</span></label>
              <input id="cf-phone" name="phone" type="tel" data-testid="contact-input-phone" />
            </div>
            <div class="form-field">
              <label for="cf-company"><span {...fa("company")}>{f("company", isEn ? "Company" : "Virksomhed")}</span></label>
              <input id="cf-company" name="company" data-testid="contact-input-company" />
            </div>
            <div class="form-field">
              <label><span {...fa("needLabel")}>{f("needLabel", isEn ? "What do you need? (pick as many as you like)" : "Hvad har du brug for? (vælg gerne flere)")}</span></label>
              <div class="form-pillrow" data-testid="contact-solution-pills">
                {SOLUTION_TYPES.map((t) => (
                  <span
                    class="pill"
                    data-value={t.value}
                    key={t.value}
                    data-testid={`contact-pill-${t.value}`}
                  >
                    <span {...fa(`sol_${t.value}`)}>{f(`sol_${t.value}`, isEn ? t.en : t.da)}</span>
                  </span>
                ))}
              </div>
              <input type="hidden" name="solutionType" id="cf-solution-type" value="" />
            </div>
            <div class="form-field">
              <label for="cf-message"><span {...fa("message")}>{f("message", isEn ? "Message" : "Besked")}</span></label>
              <textarea
                id="cf-message"
                name="message"
                rows={4}
                required
                data-testid="contact-input-message"
              />
            </div>
            {/* "Task completed" micro-interaction, recolored to brand (see
                .nl-check in brand.css) — circle fills + spring-settles,
                checkmark draws, confetti pops. No strikethrough/collapse:
                this is an opt-IN, those would read as "cancelled". */}
            <label class="nl-check">
              <input
                type="checkbox"
                name="newsletter"
                id="cf-newsletter"
                value="true"
                class="nl-check-input"
                data-testid="contact-input-newsletter"
              />
              <span class="circle" aria-hidden="true">
                <svg viewBox="0 0 16 16">
                  <path d="M3 8.5 L6.5 12 L13 4.5" />
                </svg>
              </span>
              <span class="nl-label" {...fa("newsletter")}>{f("newsletter", isEn ? "Yes, send me the newsletter" : "Ja tak, send mig nyhedsbrevet")}</span>
              <span class="nl-confetti c1" aria-hidden="true" />
              <span class="nl-confetti c2" aria-hidden="true" />
              <span class="nl-confetti c3" aria-hidden="true" />
              <span class="nl-confetti c4" aria-hidden="true" />
              <span class="nl-confetti c5" aria-hidden="true" />
              <span class="nl-confetti c6" aria-hidden="true" />
            </label>
            {/* Honeypot — hidden from real visitors, F30 spam.honeypot checks this field name. */}
            <input type="text" name="_gotcha" tabIndex={-1} autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true" />
            {/* Cloudflare Turnstile (F156.6) — widget mounts client-side into this
                root (see client/turnstile.tsx); solved token lands in the hidden
                input below, which enhance.ts submits as "turnstileToken". */}
            <div id="contact-turnstile-root" style="margin:4px 0" />
            <input type="hidden" name="turnstileToken" id="cf-turnstile-token" value="" />
            <button class="btn" type="submit" style="width:100%;justify-content:center;margin-top:8px" data-testid="contact-submit">
              <span {...fa("submit")}>{f("submit", isEn ? "Send inquiry" : "Send forespørgsel")}</span> <span class="ar">→</span>
            </button>
            <p class="form-status" data-testid="contact-status"></p>
          </form>
        </div>
      </div>
    </section>
  );
}
