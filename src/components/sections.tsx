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
// property it was mapped to — that's the key @broberg/cms-inline-edit PATCHes.
// Only rendered when cmsRef is present (i.e. the section came from a real cms
// doc, not the fallback copy) — never guess a doc reference.
export function cmsAttrs(cmsRef: CmsRef | undefined, field: string): Record<string, string> {
  if (!cmsRef) return {};
  return {
    "data-cms-collection": cmsRef.collection,
    "data-cms-slug": cmsRef.slug,
    "data-cms-field": field,
  };
}

// Same, but for INTENTIONAL-HTML fields (headings/bios/hero with a branded
// <em class="o"> accent stored as raw HTML, rendered via dangerouslySetInnerHTML).
// data-cms-html tells @broberg/cms-inline-edit to save innerHTML verbatim rather
// than convert to Markdown (which would strip the accent).
export function cmsHtmlAttrs(cmsRef: CmsRef | undefined, field: string): Record<string, string> {
  if (!cmsRef) return {};
  return {
    "data-cms-collection": cmsRef.collection,
    "data-cms-slug": cmsRef.slug,
    "data-cms-field": field,
    "data-cms-html": "true",
  };
}

// For MARKDOWN richtext fields (cms `richtext` contract — stored as Markdown,
// rendered via marked). data-cms-richtext tells @broberg/cms-inline-edit to
// convert the edited innerHTML back to Markdown on save (not verbatim HTML).
export function cmsRichAttrs(cmsRef: CmsRef | undefined, field: string): Record<string, string> {
  if (!cmsRef) return {};
  return {
    "data-cms-collection": cmsRef.collection,
    "data-cms-slug": cmsRef.slug,
    "data-cms-field": field,
    "data-cms-richtext": "true",
  };
}

function CtaButton({ cta }: { cta: Cta }) {
  const cls = cta.ghost ? "btn btn-ghost" : "btn";
  const scroll = cta.scroll ? { "data-scroll": cta.scroll } : {};
  // Label is inline-editable when the cta carries a cms target. Wrapping only
  // the text (not the whole button) keeps the arrow out of the saved value.
  const label =
    cta.cmsRef && cta.labelField ? (
      <span {...cmsAttrs(cta.cmsRef, cta.labelField)}>{cta.label}</span>
    ) : (
      cta.label
    );
  if (cta.href) {
    return (
      <a class={cls} href={cta.href} data-testid={cta.testid} {...scroll}>
        {label} <span class="ar">→</span>
      </a>
    );
  }
  return (
    <button class={cls} data-testid={cta.testid} {...scroll}>
      {label} <span class="ar">→</span>
    </button>
  );
}

// `fields` lets a caller override which cms field each part saves to. Default
// (eyebrow → "eyebrow", lead → "subheading", heading unwired) matches a
// `sections` doc — used by the block renderer. The homepage passes landing-doc
// field names (casesEyebrow/casesHeadingHtml/casesLead …) instead, and a
// `heading` field opts the h2 into inline-edit as HTML (branded <em> accent).
function SecHead({
  eyebrow,
  headingHtml,
  lead,
  cmsRef,
  fields,
}: {
  eyebrow: string;
  headingHtml: string;
  lead: string;
  cmsRef?: CmsRef;
  fields?: { eyebrow?: string; heading?: string; lead?: string };
}) {
  const fEyebrow = fields?.eyebrow ?? "eyebrow";
  const fLead = fields?.lead ?? "subheading";
  // Heading defaults to the section doc's own "heading" field (HTML — every
  // section heading carries the branded <em class="o"> accent). A caller on a
  // different doc (homepage Cases/Insights → landing) overrides via fields.heading.
  const fHeading = fields?.heading ?? "heading";
  return (
    <div class="sec-head">
      <div class="eyebrow" {...cmsAttrs(cmsRef, fEyebrow)}>{eyebrow}</div>
      <h2 {...cmsHtmlAttrs(cmsRef, fHeading)} dangerouslySetInnerHTML={{ __html: headingHtml }} />
      <div class="divider" />
      <p class="lead" {...cmsAttrs(cmsRef, fLead)}>{lead}</p>
    </div>
  );
}

export function Hero({ data, cmsRef }: { data: HeroData; cmsRef?: CmsRef }) {
  return (
    <section class="hero" id="top">
      <div class="wrap hero-grid">
        <div>
          <div class="eyebrow" {...cmsAttrs(cmsRef, "eyebrow")}>{data.eyebrow}</div>
          <h1 {...cmsHtmlAttrs(cmsRef, "heading")} dangerouslySetInnerHTML={{ __html: data.titleHtml }} />
          <p class="lead" {...cmsHtmlAttrs(cmsRef, "subheading")} dangerouslySetInnerHTML={{ __html: data.leadHtml }} />
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

export function Universe({ data, cmsRef }: { data: UniverseData; cmsRef?: CmsRef }) {
  return (
    <section id="universet">
      <div class="wrap reveal">
        <SecHead eyebrow={data.eyebrow} headingHtml={data.headingHtml} lead={data.lead} cmsRef={cmsRef} />
        <div class="universe-grid">
          <UniverseDiagram infra={data.infra} customers={data.customers} />
          <div>
            {data.tiers.map((t, i) => (
              <div class="tier" key={i}>
                <b {...cmsAttrs(cmsRef, `blocks.${t.cmsIndex}.heading`)}>{t.title}</b>
                <br />
                {/* body is Markdown (richtextInline) → rich-edit path saves it back as Markdown. */}
                <span {...cmsRichAttrs(cmsRef, `blocks.${t.cmsIndex}.body`)} dangerouslySetInnerHTML={{ __html: t.body }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Platforms({ data, cmsRef, fields }: { data: PlatformsData; cmsRef?: CmsRef; fields?: { eyebrow?: string; heading?: string; lead?: string } }) {
  return (
    <section id="platforme" style="background:var(--dark2)">
      <div class="wrap reveal">
        <SecHead eyebrow={data.eyebrow} headingHtml={data.heading} lead={data.lead} cmsRef={cmsRef} fields={fields} />
        <div class="grid g4">
          {data.items.map((p) => (
            <a class="card" href={`${data.pathPrefix ?? "/flagskibe"}/${p.logoKey}`} key={p.name} data-testid={`flagship-card-${p.logoKey}`}>
              <div class="plat-h">
                <div class="logot">
                  <Logo k={p.logoKey} />
                </div>
                <div class="nm" {...cmsAttrs(p.cmsRef, "name")}>{p.name}</div>
                {/* status="live" → green LIVE; anything else (e.g. ideation) → a
                    discreet grey "Snart" so a not-yet-live node makes no false claim. */}
                {p.status === "live" ? (
                  <span class="badge">{p.status}</span>
                ) : (
                  <span class="badge badge-soon">Snart</span>
                )}
              </div>
              <p {...cmsAttrs(p.cmsRef, "blurb")}>{p.blurb}</p>
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

export function Cases({ data, cmsRef, fields }: { data: CasesData; cmsRef?: CmsRef; fields?: { eyebrow?: string; heading?: string; lead?: string } }) {
  return (
    <section id="cases">
      <div class="wrap reveal">
        <SecHead eyebrow={data.eyebrow} headingHtml={data.headingHtml} lead={data.lead} cmsRef={cmsRef} fields={fields} />
        <div class="grid g2">
          {data.items.map((c) => {
            // Case fields live on the underlying `posts` doc (c.cmsRef), NOT the
            // cases section: kicker→client, title→title, body→excerpt, quote→quote.
            const inner = (
              <>
                <div class="kicker" {...cmsAttrs(c.cmsRef, "client")}>{c.kicker}</div>
                <div class="case-h" {...cmsAttrs(c.cmsRef, "title")}>{c.title}</div>
                <p {...cmsAttrs(c.cmsRef, "excerpt")}>{c.body}</p>
                {c.quote && (
                  <div class="quote">
                    <span {...cmsAttrs(c.cmsRef, "quote")}>{c.quote}</span>
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

export function Method({ data, cmsRef }: { data: MethodData; cmsRef?: CmsRef }) {
  return (
    <section id="metoden" style="background:var(--dark2)">
      <div class="wrap reveal">
        <SecHead eyebrow={data.eyebrow} headingHtml={data.headingHtml} lead={data.lead} cmsRef={cmsRef} />
        <div class="flow">
          {data.steps.map((s, i) => (
            <>
              <span class={s.live ? "step live" : "step"} {...cmsAttrs(cmsRef, `steps.${i}.label`)}>{s.label}</span>
              {i < data.steps.length - 1 && <span class="arr">→</span>}
            </>
          ))}
        </div>
        <div class="grid g3">
          {data.cards.map((c, i) => (
            <div class="card" key={i}>
              <p {...cmsHtmlAttrs(cmsRef, `cards.${i}.html`)} dangerouslySetInnerHTML={{ __html: c.html }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Insights({ data, cmsRef, fields }: { data: InsightsData; cmsRef?: CmsRef; fields?: { eyebrow?: string; heading?: string; lead?: string } }) {
  return (
    <section id="indsigter">
      <div class="wrap reveal">
        <SecHead eyebrow={data.eyebrow} headingHtml={data.headingHtml} lead={data.lead} cmsRef={cmsRef} fields={fields} />
        <div class="grid g3">
          {data.posts.map((p) => (
            <a class="blogcard" key={p.slug} href={p.href} data-testid={`blog-${p.slug}`}>
              <div class="blogthumb">
                <Illustration k={pickNewsIllustration(p.slug)} />
              </div>
              <div class="blogbody">
                <span class="nyt">{p.tag}</span>
                <h3 {...cmsAttrs(p.cmsRef, "title")}>{p.title}</h3>
                <p {...cmsAttrs(p.cmsRef, "excerpt")}>{p.excerpt}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// `globalsRef` targets the globals doc, where the bio (aboutBio, Markdown) and
// client names (clients[].name) actually live — cross-doc from the section's
// own eyebrow/heading/clientsLabel. Undefined on the /universe block path (About
// only renders on the homepage), so those stay unwired there.
export function About({ data, cmsRef, globalsRef }: { data: AboutData; cmsRef?: CmsRef; globalsRef?: CmsRef }) {
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
            <h2 style="margin-bottom:12px" {...cmsHtmlAttrs(cmsRef, "heading")} dangerouslySetInnerHTML={{ __html: data.headingHtml }} />
            <p class="lead" {...cmsRichAttrs(globalsRef, "aboutBio")} dangerouslySetInnerHTML={{ __html: data.leadHtml }} />
            <div style="margin-top:16px">
              {data.pills.map((p, i) => (
                <span class="pill" key={p} {...cmsAttrs(globalsRef, `skills.${i}`)}>
                  {p}
                </span>
              ))}
            </div>
            <div class="clients">
              <span class="lbl" {...cmsAttrs(cmsRef, "subheading")}>{data.clientsLabel}</span>
              {data.clients.map((c, i) => (
                <span class="c" key={c} {...cmsAttrs(globalsRef, `clients.${i}.name`)}>
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
          <h2 {...cmsHtmlAttrs(cmsRef, "heading")} dangerouslySetInnerHTML={{ __html: data.headingHtml }} />
          <p class="lead" style="margin:18px auto 30px" {...cmsAttrs(cmsRef, "subheading")}>
            {data.lead}
          </p>
          <a href={data.formHref} class="btn" data-testid="kontakt-cta-mail">
            <span {...cmsAttrs(cmsRef, "ctaPrimary")}>{data.ctaLabel}</span> <span class="ar">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
