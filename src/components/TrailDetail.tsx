/* Bespoke flagship page for trail — generalised from the syttensyvogtres pitch's
   two trail slides (cms #117.2): bureau = just ONE example; "din virksomhed/din
   stemme"; honest stat cards (no "2800+"); the RAG-vs-Trail table + "Curator,
   not dictator"; a 4-step workflow; and 3 customer-type cards. The table / stat
   / workflow / card pieces are written to be reusable for the other flagships.
   v1 copy is bespoke here; can move to cms fields later. */
import { Logo } from "@/components/Logos.tsx";
import { Illustration, hasIllustration } from "@/components/Illustrations.tsx";

const FLOW = ["Brand guides", "Billeder & logoer", "Skabeloner", "Kampagner", "Faglig viden", "Lyd · Video"];

const CTABLE: [string, string, string][] = [
  ["Arbejdsmodel", "Query-time retrieval", "Ingest-time kompilering"],
  ["Brand-konsistens", "Ingen garanti", "Din stemme altid"],
  ["Videnakkumulering", "Statiske chunks", "Wiki vokser over tid"],
  ["Kvalitetssikring", "Ingen", "Kureret godkendelseskø"],
];

const STATS: [string, string][] = [
  ["∞", "vidensbasen vokser organisk"],
  ["24/7", "altid-vågen assistent"],
  ["100%", "i din egen stemme"],
];

const STEPS: [string, string][] = [
  [
    "Onboarding — videns-upload",
    "Upload dine brand guides, content-historik, faglig viden og tone-of-voice. Trail kompilerer det til Neurons — videns-celler med proveniens.",
  ],
  [
    "AI genererer — altid on-brand",
    'Bed Trail om content: "Skriv 5 LinkedIn-opslag om [emne]." Output er i din stemme, med dine fakta — ikke en generisk LLM-gæt.',
  ],
  [
    "Kuration — du godkender",
    "Alt AI-foreslået lander i en kureret kø. Du reviewer, tilpasser og godkender — AI gør det tunge løft, du giver finalen.",
  ],
  [
    "Deploy — AI-assistent på dit site",
    "Via @webhouse/cms bliver Trail vidensbase for en AI-chat på dit website. Besøgende spørger — AI svarer i din stemme, med kildehenvisninger.",
  ],
];

const CUSTOMERS: [string, string][] = [
  ["Bureau", "En brand intelligence-base pr. klient → AI der er on-brand for hver enkelt klient, automatisk. Skalér content uden at skalere headcount."],
  [
    "Fagekspert",
    "Al din akkumulerede faglige viden samlet ét sted → en assistent der svarer i dit fagsprog, på dit website, 24/7. (Fx en klinik som Sanne Andersen.)",
  ],
  [
    "Kundeplatform",
    "Trail som chatbot-motor — en <trail-chat>-widget der matcher og hjælper besøgende, svarer med kildehenvisninger, og vokser klogere for hver artikel du publicerer. (Fx Fysio Danmark.)",
  ],
];

export function TrailDetail({ slug }: { slug: string }) {
  return (
    <>
      <section id="top">
        <div class="wrap reveal">
          <div class={hasIllustration(slug) ? "plat-detail-head" : "plat-detail-head one-col"}>
            <div class="plat-detail-text">
              <div class="logot logot-lg">
                <Logo k="trail" />
              </div>
              <div class="eyebrow">Flagskib · videnmotor &amp; anden hjerne</div>
              <h2>
                AI der kender din virksomhed <em>indefra</em>.
              </h2>
              <p class="lead">
                Trail kompilerer dit materiale — briefings, brand guides, eksisterende content, kampagner, faglig viden — til
                en levende <strong>brand intelligence base</strong>.
              </p>
              <p class="lead" style="margin-top:12px">
                Resultatet: AI der skriver i <strong>din stemme</strong>, med dine fakta, i din tone of voice. Altid — ikke kun
                når du husker at fortælle det.
              </p>
            </div>
            {hasIllustration(slug) ? (
              <div class="plat-illu">
                <Illustration k="trail" />
              </div>
            ) : null}
          </div>

          <div class="quote" style="margin-top:30px;max-width:620px">
            LLM'en foreslår. Du godkender.
            <br />
            <span class="orange">Curator, not dictator.</span>
          </div>

          {/* what Trail ingests */}
          <div style="margin-top:34px">
            <div class="eyebrow">Trail indlæser alt fra dig</div>
            <div class="flowchips">
              {FLOW.map((f, i) => (
                <>
                  <span class="flowchip" key={f}>
                    {f}
                  </span>
                  {i < FLOW.length - 1 ? <span class="flowchip-arrow">→</span> : null}
                </>
              ))}
            </div>
          </div>

          {/* RAG vs Trail + honest stats */}
          <div class="trail-grid">
            <div class="card">
              <div class="eyebrow">Forskellig fra RAG</div>
              <table class="ctable">
                <thead>
                  <tr>
                    <th>Dimension</th>
                    <th>Traditionel RAG</th>
                    <th>Trail</th>
                  </tr>
                </thead>
                <tbody>
                  {CTABLE.map((row) => (
                    <tr key={row[0]}>
                      <td>{row[0]}</td>
                      <td>{row[1]}</td>
                      <td class="ctable-win">{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div class="stat-trio">
              {STATS.map((s) => (
                <div class="card stat-card" key={s[1]}>
                  <div class="stat-num">{s[0]}</div>
                  <div class="stat-cap">{s[1]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* workflow */}
      <section style="background:var(--dark2)">
        <div class="wrap reveal">
          <div class="sec-head">
            <div class="eyebrow">Konkret workflow</div>
            <h2>
              Fra brief til <em class="o">levende AI-assistent</em>.
            </h2>
            <div class="divider" />
          </div>
          <ol class="worksteps">
            {STEPS.map(([t, d]) => (
              <li key={t}>
                <div class="workstep-title">{t}</div>
                <p>{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* customer types */}
      <section>
        <div class="wrap reveal">
          <div class="sec-head">
            <div class="eyebrow">Hvem er det for</div>
            <h2>Tre måder at bruge en anden hjerne.</h2>
            <div class="divider" />
          </div>
          <div class="grid g3">
            {CUSTOMERS.map(([t, d]) => (
              <div class="card" key={t}>
                <div class="case-h">{t}</div>
                <p>{d}</p>
              </div>
            ))}
          </div>
          <div class="cta-row" style="margin-top:36px">
            <a class="btn btn-ghost" href="/flagskibe" data-testid="flagship-all">
              Alle flagskibe <span class="ar">→</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
