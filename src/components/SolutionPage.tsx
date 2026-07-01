/* Løsnings-detaljeside (F156.2) — Websites/Webshops/Platforme/AI Integration.
   Reuses the flagship detail page's header pattern (.plat-detail-head) and the
   site's existing grid/card/cta-final vocabulary; only .steps3/.type-pill are
   new (added to brand.css — no equivalent horizontal-step or coloured-pill
   component existed before this page type). */
import { Icon } from "@/components/Icons.tsx";
import type { Locale } from "@/config.ts";

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

const ProofCard = ({ item, locale }: { item: ProofItem; locale: Locale }) => {
  const inner = (
    <>
      <div class="kicker">{item.kicker}</div>
      <div class="case-h-row">
        <div class="case-h">{item.title}</div>
        {item.type ? <span class={`type-pill ${item.type}`}>{TYPE_LABEL[item.type][locale]}</span> : null}
      </div>
      <p>{item.body}</p>
      {item.note ? (
        <p style="margin-top:10px;font-style:italic;color:var(--muted)">{item.note}</p>
      ) : null}
    </>
  );
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
}: {
  data: SolutionData;
  locale: Locale;
  secondaryCta: { label: string; href: string };
}) {
  const bookLabel = locale === "en" ? "Book a meeting" : "Book et møde";
  // Contact lives on the homepage, not on this page — link there, not to a
  // local #kontakt anchor that doesn't exist here.
  const kontaktHref = `${locale === "en" ? "/en" : "/"}#kontakt`;
  const howEyebrow = locale === "en" ? "How it works" : "Sådan virker det";
  const featuresEyebrow = locale === "en" ? "Core features" : "Kernefunktioner";
  const featuresHeading = locale === "en" ? "Built into the platform." : "Bygget ind i platformen.";
  const proofEyebrow = locale === "en" ? "The proof" : "Beviset";
  const ctaSub = locale === "en" ? "15 minutes, no obligation." : "15 minutter, ingen forpligtelse.";

  return (
    <>
      <section id="top">
        <div class="wrap plat-detail-head" style="padding-top:150px">
          <div>
            <div class="eyebrow">
              {locale === "en" ? "Solutions" : "Løsninger"} · {data.name}
            </div>
            <h2 style="margin-bottom:16px" dangerouslySetInnerHTML={{ __html: data.headingHtml }} />
            <p class="lead">{data.lead}</p>
            <div class="cta-row">
              <a class="btn" href={kontaktHref} data-testid="solution-cta-primary">
                {bookLabel} <span class="ar">→</span>
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
          <h2 style="font-size:clamp(26px,3.4vw,38px)">{data.problemHeading}</h2>
          <div class="divider" />
          {data.problemP.map((p, i) => (
            <p class="lead" key={i} style={`max-width:none;${i < data.problemP.length - 1 ? "margin-bottom:16px" : ""}`}>
              {p}
            </p>
          ))}
        </div>
      </section>

      <section>
        <div class="wrap">
          <div class="sec-head" style="text-align:center;margin-left:auto;margin-right:auto">
            <div class="eyebrow" style="justify-content:center">
              {howEyebrow}
            </div>
            <h2>{locale === "en" ? "From meeting to live" : "Fra møde til live"}</h2>
          </div>
          <div class="steps3">
            {data.steps.map(([title, desc], i) => (
              <div class="step3" key={title}>
                <div class="step3-num">{i + 1}</div>
                <div class="workstep-title">{title}</div>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style="background:var(--dark2)">
        <div class="wrap">
          <div class="sec-head">
            <div class="eyebrow">{featuresEyebrow}</div>
            <h2>{featuresHeading}</h2>
          </div>
          <div class="grid g3">
            {data.features.map(([title, desc, icon]) => (
              <div class="card" key={title}>
                <Icon name={icon} />
                <h3 style="font-size:16px;font-weight:600;margin-bottom:8px;color:var(--light)">{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="bevis">
        <div class="wrap" style={data.proof.length > 1 ? "" : "max-width:760px"}>
          <div class="sec-head">
            <div class="eyebrow">{proofEyebrow}</div>
            <h2>{data.proofHeading}</h2>
          </div>
          <div class={data.proof.length > 1 ? "grid g2" : ""}>
            {data.proof.map((item) => (
              <ProofCard item={item} locale={locale} key={item.title} />
            ))}
          </div>
          {data.proofNote ? (
            <p style="max-width:760px;margin:18px auto 0;font-size:13px;color:var(--muted);font-style:italic;text-align:center">
              {data.proofNote}
            </p>
          ) : null}
        </div>
      </section>

      <section style="background:var(--dark2)">
        <div class="wrap">
          <div class="cta-final">
            <div class="eyebrow" style="display:inline-flex">
              {data.name}
            </div>
            <h2 dangerouslySetInnerHTML={{ __html: data.ctaHeadingHtml }} />
            <p class="lead" style="margin:18px auto 30px">
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
