/* Reusable 3-slide flagship page with a blue→orange colour journey (Christian's
   choice, cms #121): slide 1 (blue) "what it is" · slide 2 (transition) "how it
   works" · slide 3 (orange) "why it matters". Same building blocks as the trail
   page (flowchips / worksteps / ctable / stat cards), parametrised per flagship.
   v1 copy is bespoke here; can move to cms fields later. */
import { Logo } from "@/components/Logos.tsx";
import { Illustration, hasIllustration } from "@/components/Illustrations.tsx";

export interface SlideData {
  slug: string;
  s1: { eyebrow: string; heading: string; headingEmHtml?: string; lead: string; chips: string[] };
  s2: {
    eyebrow: string;
    heading: string;
    steps: [string, string][];
    table: { cols: [string, string, string]; rows: [string, string, string][] };
  };
  s3: {
    eyebrow: string;
    heading: string;
    prose: string;
    stats: [string, string][];
    cta: { label: string; href: string };
  };
}

const components: SlideData = {
  slug: "components",
  s1: {
    eyebrow: "components · fælles inventar",
    heading: "Byg aldrig det samme to gange.",
    lead: "broberg.ai's fælles lager af genbrugelige dele — 20+ gennemtestede @broberg/*-pakker plus UI-komponenter og infra-mønstre i ét live katalog. Princippet er enkelt: reuse > re-roll.",
    chips: ["Mail", "Web-push", "AI-gateway", "Cron", "Betaling", "Medie", "Auth", "Secrets"],
  },
  s2: {
    eyebrow: "Sådan virker det",
    heading: "Én kilde. Forplanter sig til alt.",
    steps: [
      ["Slå op i kataloget", "Tjek discovery.broberg.ai før du bygger — er delen der allerede?"],
      ["Genbrug den færdige pakke", "Træk @broberg/*-pakken ind, exact-pinned — ikke en kopi."],
      ["Mangler noget? Udvid pakken", "Tilføj til den fælles pakke — aldrig en lokal afart."],
      ["Én rettelse opdaterer alle", "Et fix ét sted forplanter sig til alle der bruger den."],
    ],
    table: {
      cols: ["Dimension", "Genopfind", "components"],
      rows: [
        ["Hastighed", "Fra bunden hver gang", "Samlet af færdige dele"],
        ["Konsistens", "Driver fra hinanden", "Ens overalt"],
        ["Sikkerhed", "Fixes pr. projekt", "Fix for hele flåden"],
        ["Vedligehold", "N kopier", "Én kilde"],
      ],
    },
  },
  s3: {
    eyebrow: "Hvorfor det betyder noget",
    heading: "Sikkerhed i top.",
    prose: "Hver pakke er gennemtestet og hærdet i drift. Fordi hvert kundeprojekt bygger på de samme dele, valideres hver pakke af HELE flåden på én gang — en svaghed fanget ét sted lukkes for alle.",
    stats: [
      ["20+", "pakker"],
      ["1", "kilde"],
      ["∞", "genbrug"],
    ],
    cta: { label: "Udforsk kataloget på discovery.broberg.ai", href: "https://discovery.broberg.ai" },
  },
};

const REGISTRY: Record<string, SlideData> = { components };

export function hasSlides(slug: string): boolean {
  return slug.toLowerCase() in REGISTRY;
}

export function slideMeta(slug: string): { title: string; description: string } | null {
  const d = REGISTRY[slug.toLowerCase()];
  if (!d) return null;
  return { title: `${d.slug} — broberg.ai`, description: d.s1.lead };
}

export function FlagshipSlides({ slug }: { slug: string }) {
  const d = REGISTRY[slug.toLowerCase()];
  if (!d) return null;
  const illu = hasIllustration(d.slug);
  return (
    <>
      {/* SLIDE 1 — blue: what it is */}
      <section class="fslide fslide-1" id="top">
        <div class="wrap reveal">
          <div class={illu ? "plat-detail-head" : "plat-detail-head one-col"}>
            <div class="plat-detail-text">
              <div class="logot logot-lg">
                <Logo k={d.slug} />
              </div>
              <div class="eyebrow">{d.s1.eyebrow}</div>
              <h2>{d.s1.heading}</h2>
              <p class="lead">{d.s1.lead}</p>
            </div>
            {illu ? (
              <div class="plat-illu">
                <Illustration k={d.slug} />
              </div>
            ) : null}
          </div>
          <div class="flowchips" style="margin-top:26px">
            {d.s1.chips.map((c, i) => (
              <>
                <span class="flowchip" key={c}>
                  {c}
                </span>
                {i < d.s1.chips.length - 1 ? <span class="flowchip-arrow">·</span> : null}
              </>
            ))}
          </div>
        </div>
      </section>

      {/* SLIDE 2 — transition: how it works */}
      <section class="fslide fslide-2">
        <div class="wrap reveal">
          <div class="sec-head">
            <div class="eyebrow">{d.s2.eyebrow}</div>
            <h2>{d.s2.heading}</h2>
            <div class="divider" />
          </div>
          <div class="trail-grid">
            <ol class="worksteps">
              {d.s2.steps.map(([t, desc]) => (
                <li key={t}>
                  <div class="workstep-title">{t}</div>
                  <p>{desc}</p>
                </li>
              ))}
            </ol>
            <div class="card" style="min-width:0">
              <div class="eyebrow">Genbrug vs. genopfind</div>
              <table class="ctable">
                <thead>
                  <tr>
                    {d.s2.table.cols.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {d.s2.table.rows.map((row) => (
                    <tr key={row[0]}>
                      <td>{row[0]}</td>
                      <td>{row[1]}</td>
                      <td class="ctable-win">{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* SLIDE 3 — orange: why it matters */}
      <section class="fslide fslide-3">
        <div class="wrap reveal">
          <div class="sec-head">
            <div class="eyebrow">{d.s3.eyebrow}</div>
            <h2>{d.s3.heading}</h2>
            <div class="divider" />
          </div>
          <p class="lead">{d.s3.prose}</p>
          <div class="stat-row">
            {d.s3.stats.map((s) => (
              <div class="card stat-card" key={s[1]}>
                <div class="stat-num">{s[0]}</div>
                <div class="stat-cap">{s[1]}</div>
              </div>
            ))}
          </div>
          <div class="cta-row" style="margin-top:34px">
            <a class="btn btn-ghost" href={d.s3.cta.href} target="_blank" rel="noopener" data-testid="flagship-visit">
              {d.s3.cta.label} <span class="ar">→</span>
            </a>
            <a class="btn btn-ghost" href="/flagskibe" data-testid="flagship-all">
              Alle flagskibe <span class="ar">→</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
