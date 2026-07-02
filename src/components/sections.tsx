/* The eight landing sections. Each takes its typed data (from cms, or the
   fallback). Rich copy carries <em>/<strong>/<br> from the approved mockup, so a
   few fields render as HTML. The block-renderer (render/blocks.tsx) dispatches
   on section kind. */
import type {
  HeroData,
  UniverseData,
  PlatformsData,
  CasesData,
  MethodData,
  InsightsData,
  AboutData,
  ContactData,
  Cta,
  CmsRef,
} from "@/content/types.ts";
import { HeroFrequency } from "@/components/widgets/HeroFrequency.tsx";
import { UniverseDiagram } from "@/components/widgets/UniverseDiagram.tsx";
import { CountUp } from "@/components/widgets/CountUp.tsx";
import { Logo } from "@/components/Logos.tsx";
import { Illustration, pickNewsIllustration } from "@/components/Illustrations.tsx";

// F157 Phase 1 — marks a plain-text element as inline-editable. `field` MUST
// be the raw cms field name (e.g. "eyebrow"/"subheading"), not the view-model
// property it was mapped to — that's the key @webhouse/cms-inline-edit PATCHes.
// Only rendered when cmsRef is present (i.e. the section came from a real cms
// doc, not the fallback copy) — never guess a doc reference.
function cmsAttrs(cmsRef: CmsRef | undefined, field: string): Record<string, string> {
  if (!cmsRef) return {};
  return {
    "data-cms-collection": cmsRef.collection,
    "data-cms-slug": cmsRef.slug,
    "data-cms-field": field,
  };
}

function CtaButton({ cta }: { cta: Cta }) {
  const cls = cta.ghost ? "btn btn-ghost" : "btn";
  const scroll = cta.scroll ? { "data-scroll": cta.scroll } : {};
  if (cta.href) {
    return (
      <a class={cls} href={cta.href} data-testid={cta.testid} {...scroll}>
        {cta.label} <span class="ar">→</span>
      </a>
    );
  }
  return (
    <button class={cls} data-testid={cta.testid} {...scroll}>
      {cta.label} <span class="ar">→</span>
    </button>
  );
}

function SecHead({ eyebrow, headingHtml, lead }: { eyebrow: string; headingHtml: string; lead: string }) {
  return (
    <div class="sec-head">
      <div class="eyebrow">{eyebrow}</div>
      <h2 dangerouslySetInnerHTML={{ __html: headingHtml }} />
      <div class="divider" />
      <p class="lead">{lead}</p>
    </div>
  );
}

export function Hero({ data, cmsRef }: { data: HeroData; cmsRef?: CmsRef }) {
  return (
    <section class="hero" id="top">
      <div class="wrap hero-grid">
        <div>
          <div class="eyebrow" {...cmsAttrs(cmsRef, "eyebrow")}>{data.eyebrow}</div>
          <h1 dangerouslySetInnerHTML={{ __html: data.titleHtml }} />
          <p class="lead" dangerouslySetInnerHTML={{ __html: data.leadHtml }} />
          <div class="cta-row">
            {data.ctas.map((c) => (
              <CtaButton key={c.testid} cta={c} />
            ))}
          </div>
        </div>
        <div class="hero-art">
          <HeroFrequency />
        </div>
      </div>
      <div class="wrap">
        <div class="statbar">
          {data.stats.map((s, i) => (
            <CountUp key={i} stat={s} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function Universe({ data }: { data: UniverseData }) {
  return (
    <section id="universet">
      <div class="wrap reveal">
        <SecHead eyebrow={data.eyebrow} headingHtml={data.headingHtml} lead={data.lead} />
        <div class="universe-grid">
          <UniverseDiagram infra={data.infra} customers={data.customers} />
          <div>
            {data.tiers.map((t, i) => (
              <div class="tier" key={i}>
                <b>{t.title}</b>
                <br />
                <span dangerouslySetInnerHTML={{ __html: t.body }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Platforms({ data }: { data: PlatformsData }) {
  return (
    <section id="platforme" style="background:var(--dark2)">
      <div class="wrap reveal">
        <SecHead eyebrow={data.eyebrow} headingHtml={data.heading} lead={data.lead} />
        <div class="grid g4">
          {data.items.map((p) => (
            <a class="card" href={`${data.pathPrefix ?? "/flagskibe"}/${p.logoKey}`} key={p.name} data-testid={`flagship-card-${p.logoKey}`}>
              <div class="plat-h">
                <div class="logot">
                  <Logo k={p.logoKey} />
                </div>
                <div class="nm">{p.name}</div>
                {/* status="live" → green LIVE; anything else (e.g. ideation) → a
                    discreet grey "Snart" so a not-yet-live node makes no false claim. */}
                {p.status === "live" ? (
                  <span class="badge">{p.status}</span>
                ) : (
                  <span class="badge badge-soon">Snart</span>
                )}
              </div>
              <p>{p.blurb}</p>
            </a>
          ))}
        </div>
        <div style="margin-top:24px">
          <CtaButton cta={data.allLink} />
        </div>
      </div>
    </section>
  );
}

export function Cases({ data }: { data: CasesData }) {
  return (
    <section id="cases">
      <div class="wrap reveal">
        <SecHead eyebrow={data.eyebrow} headingHtml={data.headingHtml} lead={data.lead} />
        <div class="grid g2">
          {data.items.map((c) => {
            const inner = (
              <>
                <div class="kicker">{c.kicker}</div>
                <div class="case-h">{c.title}</div>
                <p>{c.body}</p>
                {c.quote && (
                  <div class="quote">
                    {c.quote}
                    {c.attr && <div class="attr">— {c.attr}</div>}
                  </div>
                )}
              </>
            );
            // A case post → clickable card to its detail page (mirrors the /cases
            // index + the Platforms cards). Fallback items (no slug) stay plain.
            return c.href ? (
              <a class="card" href={c.href} key={c.title} data-testid={`case-card-${c.slug}`}>
                {inner}
              </a>
            ) : (
              <div class="card" key={c.title}>
                {inner}
              </div>
            );
          })}
        </div>
        {data.allLink && (
          <div style="margin-top:24px">
            <CtaButton cta={data.allLink} />
          </div>
        )}
      </div>
    </section>
  );
}

export function Method({ data }: { data: MethodData }) {
  return (
    <section id="metoden" style="background:var(--dark2)">
      <div class="wrap reveal">
        <SecHead eyebrow={data.eyebrow} headingHtml={data.headingHtml} lead={data.lead} />
        <div class="flow">
          {data.steps.map((s, i) => (
            <>
              <span class={s.live ? "step live" : "step"}>{s.label}</span>
              {i < data.steps.length - 1 && <span class="arr">→</span>}
            </>
          ))}
        </div>
        <div class="grid g3">
          {data.cards.map((c, i) => (
            <div class="card" key={i}>
              <p dangerouslySetInnerHTML={{ __html: c.html }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Insights({ data }: { data: InsightsData }) {
  return (
    <section id="indsigter">
      <div class="wrap reveal">
        <SecHead eyebrow={data.eyebrow} headingHtml={data.headingHtml} lead={data.lead} />
        <div class="grid g3">
          {data.posts.map((p) => (
            <a class="blogcard" key={p.slug} href={p.href} data-testid={`blog-${p.slug}`}>
              <div class="blogthumb">
                <Illustration k={pickNewsIllustration(p.slug)} />
              </div>
              <div class="blogbody">
                <span class="nyt">{p.tag}</span>
                <h3>{p.title}</h3>
                <p>{p.excerpt}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function About({ data, cmsRef }: { data: AboutData; cmsRef?: CmsRef }) {
  return (
    <section id="om" style="background:var(--dark2)">
      <div class="wrap reveal">
        <div class="about">
          <div>
            {data.image ? (
              <img class="about-photo" src={data.image} alt="Christian Broberg" width="190" height="190" loading="lazy" />
            ) : (
              <svg class="svg-wrap" viewBox="0 0 200 200" style="max-width:190px" role="img" aria-label="monogram">
                <circle cx="100" cy="100" r="92" fill="rgba(0,178,255,.06)" stroke="rgba(0,178,255,.32)" stroke-width="1.5" />
                <text x="100" y="103" text-anchor="middle" dominant-baseline="central" font-family="'DM Sans', -apple-system, sans-serif" font-size="86" font-weight="600" letter-spacing="-3" fill="#f0f4f8">
                  b<tspan fill="#F3522C">.</tspan>
                </text>
              </svg>
            )}
          </div>
          <div>
            <div class="eyebrow" {...cmsAttrs(cmsRef, "eyebrow")}>{data.eyebrow}</div>
            <h2 style="margin-bottom:12px" dangerouslySetInnerHTML={{ __html: data.headingHtml }} />
            <p class="lead" dangerouslySetInnerHTML={{ __html: data.leadHtml }} />
            <div style="margin-top:16px">
              {data.pills.map((p) => (
                <span class="pill" key={p}>
                  {p}
                </span>
              ))}
            </div>
            <div class="clients">
              <span class="lbl" {...cmsAttrs(cmsRef, "subheading")}>{data.clientsLabel}</span>
              {data.clients.map((c) => (
                <span class="c" key={c}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Contact({ data, cmsRef }: { data: ContactData; cmsRef?: CmsRef }) {
  return (
    <section id="kontakt">
      <div class="wrap reveal">
        <div class="cta-final">
          <div class="eyebrow" style="display:inline-flex" {...cmsAttrs(cmsRef, "eyebrow")}>
            {data.eyebrow}
          </div>
          <h2 dangerouslySetInnerHTML={{ __html: data.headingHtml }} />
          <p class="lead" style="margin:18px auto 30px" {...cmsAttrs(cmsRef, "subheading")}>
            {data.lead}
          </p>
          <a href={data.formHref} class="btn" data-testid="kontakt-cta-mail">
            {data.ctaLabel} <span class="ar">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
