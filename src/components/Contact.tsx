/* Real contact form (F156.6) — replaces the mailto-only CTA on the sales
   landing. Posts to the F30 Form Engine's public endpoint on webhouse.app.
   Solution-type is a custom pill selector (never a native <select>), synced
   to a hidden input the browser actually submits. */
import type { Locale } from "@/config.ts";

export interface ContactCopy {
  ctaHeadingHtml: string;
  ctaLead: string;
}

const SOLUTION_TYPES: { value: string; da: string; en: string }[] = [
  { value: "website", da: "Website", en: "Website" },
  { value: "webshop", da: "Webshop", en: "Webshop" },
  { value: "platform", da: "Platform", en: "Platform" },
  { value: "ai-integration", da: "AI Integration", en: "AI Integration" },
  { value: "unsure", da: "Ved ikke endnu", en: "Not sure yet" },
];

export function Contact({ data, locale }: { data: ContactCopy; locale: Locale }) {
  const isEn = locale === "en";
  return (
    <section id="kontakt">
      <div class="wrap">
        <div class="cta-final">
          <div class="eyebrow" style="display:inline-flex">
            {isEn ? "Contact" : "Kontakt"}
          </div>
          <h2 dangerouslySetInnerHTML={{ __html: data.ctaHeadingHtml }} />
          <p class="lead" style="margin:18px auto 30px">
            {data.ctaLead}
          </p>
          <form
            id="contact-form"
            data-testid="contact-form"
            data-lang={locale}
            data-success-redirect={isEn ? "/en/thanks" : "/tak"}
            style="max-width:560px;margin:0 auto;text-align:left"
          >
            <div class="form-field">
              <label for="cf-name">{isEn ? "Name" : "Navn"}</label>
              <input id="cf-name" name="name" required data-testid="contact-input-name" />
            </div>
            <div class="form-field">
              <label for="cf-email">Email</label>
              <input id="cf-email" name="email" type="email" required data-testid="contact-input-email" />
            </div>
            <div class="form-field">
              <label for="cf-phone">{isEn ? "Phone" : "Telefon"}</label>
              <input id="cf-phone" name="phone" type="tel" data-testid="contact-input-phone" />
            </div>
            <div class="form-field">
              <label for="cf-company">{isEn ? "Company" : "Virksomhed"}</label>
              <input id="cf-company" name="company" data-testid="contact-input-company" />
            </div>
            <div class="form-field">
              <label>{isEn ? "What do you need? (pick as many as you like)" : "Hvad har du brug for? (vælg gerne flere)"}</label>
              <div class="form-pillrow" data-testid="contact-solution-pills">
                {SOLUTION_TYPES.map((t) => (
                  <span
                    class="pill"
                    data-value={t.value}
                    key={t.value}
                    data-testid={`contact-pill-${t.value}`}
                  >
                    {isEn ? t.en : t.da}
                  </span>
                ))}
              </div>
              <input type="hidden" name="solutionType" id="cf-solution-type" value="" />
            </div>
            <div class="form-field">
              <label for="cf-message">{isEn ? "Message" : "Besked"}</label>
              <textarea
                id="cf-message"
                name="message"
                rows={4}
                required
                data-testid="contact-input-message"
              />
            </div>
            {/* Honeypot — hidden from real visitors, F30 spam.honeypot checks this field name. */}
            <input type="text" name="_gotcha" tabIndex={-1} autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true" />
            {/* Cloudflare Turnstile (F156.6) — widget mounts client-side into this
                root (see client/turnstile.tsx); solved token lands in the hidden
                input below, which enhance.ts submits as "turnstileToken". */}
            <div id="contact-turnstile-root" style="margin:4px 0" />
            <input type="hidden" name="turnstileToken" id="cf-turnstile-token" value="" />
            <button class="btn" type="submit" style="width:100%;justify-content:center;margin-top:8px" data-testid="contact-submit">
              {isEn ? "Send inquiry" : "Send forespørgsel"} <span class="ar">→</span>
            </button>
            <p class="form-status" data-testid="contact-status"></p>
          </form>
        </div>
      </div>
    </section>
  );
}
