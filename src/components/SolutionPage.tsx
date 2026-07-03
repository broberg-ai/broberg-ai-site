/* Løsnings-detaljeside (F156.2) — Websites/Webshops/Platforme/AI Integration.
   Reuses the flagship detail page's header pattern (.plat-detail-head) and the
   site's existing grid/card/cta-final vocabulary; only .steps3/.type-pill are
   new (added to brand.css — no equivalent horizontal-step or coloured-pill
   component existed before this page type). */
import { Icon } from "@/components/Icons.tsx";
import type { Locale } from "@/config.ts";
import type { CmsRef } from "@/content/types.ts";
import { cmsAttrs, cmsHtmlAttrs } from "@/components/sections.tsx";

export interface SolutionLabels {
  losningerPrefix: string;
  howEyebrow: string;
  howHeading: string;
  featuresEyebrow: string;
  featuresHeading: string;
  proofEyebrow: string;
}

export type ProofType = "website" | "webshop" | "platform";

export interface ProofItem {
  kicker: string;
  title: string;
  body: string;
  type?: ProofType;
  href?: string;
  note?: string;
}

export interface SolutionData {
  name: string;
  headingHtml: string;
  lead: string;
  problemHeading: string;
  problemP: string[];
  steps: [string, string][];
  features: [string, string, string][]; // title, desc, icon name
  proofHeading: string;
  proof: ProofItem[];
  proofNote?: string;
  ctaHeadingHtml: string;
  ctaLead: string;
}

const TYPE_LABEL: Record<ProofType, { da: string; en: string }> = {
  website: { da: "Website", en: "Website" },
  webshop: { da: "Webshop", en: "Webshop" },
  platform: { da: "Platform", en: "Platform" },
};

const ProofCard = ({ item, locale, cmsRef, i }: { item: ProofItem; locale: Locale; cmsRef?: CmsRef; i: number }) => {
  const inner = (
    <>
      <div class="kicker" {...cmsAttrs(cmsRef, `proof.${i}.kicker`)}>{item.kicker}</div>
      <div class="case-h-row">
        <div class="case-h" {...cmsAttrs(cmsRef, `proof.${i}.title`)}>{item.title}</div>
        {item.type ? <span class={`type-pill ${item.type}`}>{TYPE_LABEL[item.type][locale]}</span> : null}
      </div>
      <p {...cmsAttrs(cmsRef, `proof.${i}.body`)}>{item.body}</p>
      {item.note ? (
        <p style="margin-top:10px;font-style:italic;color:var(--muted)" {...cmsAttrs(cmsRef, `proof.${i}.note`)}>{item.note}</p>
      ) : null}
    </>
  );
  // Clickable proof cards: the click-to-edit handler in @broberg/cms-inline-edit
  // stops the field's click from bubbling into this <a>, so editing wins over nav.
  return item.href ? (
    <a class="card" href={item.href}>
      {inner}
    </a>
  ) : (
    <div class="card">{inner}</div>
  );
};

export function SolutionPage({
  data,
  locale,
  secondaryCta,
  cmsRef,
  bookLabel,
  globalsRef,
  labels,
}: {
  data: SolutionData;
  locale: Locale;
  secondaryCta: { label: string; href: string };
  cmsRef?: CmsRef;
  bookLabel: string;
  globalsRef?: CmsRef;
  labels: SolutionLabels;
}) {
  // Contact lives on the homepage, not on this page — link there, not to a
  // local #kontakt anchor that doesn't exist here.
  const kontaktHref = `${locale === "en" ? "/en" : "/"}#kontakt`;
  const ctaSub = locale === "en" ? "15 minutes, no obligation." : "15 minutter, ingen forpligtelse.";

  return (
    <>
      <section id="top">
        <div class="wrap plat-detail-head" style="padding-top:150px">
          <div>
            <div class="eyebrow">
              <span {...cmsAttrs(globalsRef, "solLosningerPrefix")}>{labels.losningerPrefix}</span> · <span {...cmsAttrs(cmsRef, "name")}>{data.name}</span>
            </div>
            <h2 style="margin-bottom:16px" {...cmsHtmlAttrs(cmsRef, "headingHtml")} dangerouslySetInnerHTML={{ __html: data.headingHtml }} />
            <p class="lead" {...cmsAttrs(cmsRef, "lead")}>{data.lead}</p>
            <div class="cta-row">
              <a class="btn" href={kontaktHref} data-testid="solution-cta-primary">
                <span {...cmsAttrs(globalsRef, "bookingCtaLabel")}>{bookLabel}</span> <span class="ar">→</span>
              </a>
              <a class="btn btn-ghost" href={secondaryCta.href} data-testid="solution-cta-secondary">
                {secondaryCta.label} <span class="ar">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section style="background:var(--dark2)">
        <div class="wrap" style="max-width:720px">
          <h2 style="font-size:clamp(26px,3.4vw,38px)" {...cmsAttrs(cmsRef, "problemHeading")}>{data.problemHeading}</h2>
          <div class="divider" />
          {data.problemP.map((p, i) => (
            <p class="lead" key={i} style={`max-width:none;${i < data.problemP.length - 1 ? "margin-bottom:16px" : ""}`} {...cmsAttrs(cmsRef, `problemP.${i}`)}>
              {p}
            </p>
          ))}
        </div>
      </section>

      <section>
        <div class="wrap">
          <div class="sec-head" style="text-align:center;margin-left:auto;margin-right:auto">
            <div class="eyebrow" style="justify-content:center" {...cmsAttrs(globalsRef, "solHowEyebrow")}>
              {labels.howEyebrow}
            </div>
            <h2 {...cmsAttrs(globalsRef, "solHowHeading")}>{labels.howHeading}</h2>
          </div>
          <div class="steps3">
            {data.steps.map(([title, desc], i) => (
              <div class="step3" key={i}>
                <div class="step3-num">{i + 1}</div>
                <div class="workstep-title" {...cmsAttrs(cmsRef, `steps.${i}.0`)}>{title}</div>
                <p {...cmsAttrs(cmsRef, `steps.${i}.1`)}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style="background:var(--dark2)">
        <div class="wrap">
          <div class="sec-head">
            <div class="eyebrow" {...cmsAttrs(globalsRef, "solFeaturesEyebrow")}>{labels.featuresEyebrow}</div>
            <h2 {...cmsAttrs(globalsRef, "solFeaturesHeading")}>{labels.featuresHeading}</h2>
          </div>
          <div class="grid g3">
            {data.features.map(([title, desc, icon], i) => (
              <div class="card" key={i}>
                <Icon name={icon} />
                <h3 style="font-size:16px;font-weight:600;margin-bottom:8px;color:var(--light)" {...cmsAttrs(cmsRef, `features.${i}.0`)}>{title}</h3>
                <p {...cmsAttrs(cmsRef, `features.${i}.1`)}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="bevis">
        <div class="wrap" style={data.proof.length > 1 ? "" : "max-width:760px"}>
          <div class="sec-head">
            <div class="eyebrow" {...cmsAttrs(globalsRef, "solProofEyebrow")}>{labels.proofEyebrow}</div>
            <h2 {...cmsAttrs(cmsRef, "proofHeading")}>{data.proofHeading}</h2>
          </div>
          <div class={data.proof.length > 1 ? "grid g2" : ""}>
            {data.proof.map((item, i) => (
              <ProofCard item={item} locale={locale} cmsRef={cmsRef} i={i} key={i} />
            ))}
          </div>
          {data.proofNote ? (
            <p style="max-width:760px;margin:18px auto 0;font-size:13px;color:var(--muted);font-style:italic;text-align:center" {...cmsAttrs(cmsRef, "proofNote")}>
              {data.proofNote}
            </p>
          ) : null}
        </div>
      </section>

      <section style="background:var(--dark2)">
        <div class="wrap">
          <div class="cta-final">
            <div class="eyebrow" style="display:inline-flex" {...cmsAttrs(cmsRef, "name")}>
              {data.name}
            </div>
            <h2 {...cmsHtmlAttrs(cmsRef, "ctaHeadingHtml")} dangerouslySetInnerHTML={{ __html: data.ctaHeadingHtml }} />
            <p class="lead" style="margin:18px auto 30px" {...cmsAttrs(cmsRef, "ctaLead")}>
              {data.ctaLead || ctaSub}
            </p>
            <a class="btn" href={kontaktHref} data-testid="solution-cta-final">
              {bookLabel} <span class="ar">→</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
