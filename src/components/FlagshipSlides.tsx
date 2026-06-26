/* Reusable N-slide flagship page with a blue→orange colour journey spread across
   N slides (cms FINAL spec #137/#138 — Christian-approved). Each <section> carries
   a gradient position --t (0=blue → 1=orange, computed i/(n-1)); the accent +
   background tint interpolate in CSS, so the page flows blue→orange regardless of
   slide count (3 or 5). The building blocks (lead/prose/chips/worksteps/table/
   quote/cards/stats/chat/callout) are all optional, so one template serves every
   flagship. v1 copy is bespoke here (can move to cms fields later). */
import type { JSX } from "preact";
import { Logo } from "@/components/Logos.tsx";
import { Illustration, hasIllustration } from "@/components/Illustrations.tsx";

type Step = [string, string]; // [title, desc?] — desc may be ""
type Stat = [string, string]; // [value, caption]
type Card = [string, string]; // [title, desc]
type ChatTurn = [string, "you" | "ai"];
type Link = { label: string; href: string };
// A table header is a plain string, or a {full,short} pair when the desktop label
// (e.g. "@webhouse/cms") is too wide for a narrow mobile column and needs a short
// phone form (e.g. "cms").
type ColHead = string | { full: string; short: string };

type Block =
  | { k: "lead"; text?: string; html?: string }
  | { k: "prose"; text: string }
  | { k: "chips"; items: string[] }
  | { k: "steps"; items: Step[] }
  | { k: "table"; label: string; cols: ColHead[]; rows: string[][] }
  | { k: "quote"; text: string }
  | { k: "cards"; items: Card[] }
  | { k: "stats"; items: Stat[] }
  | { k: "chat"; turns: ChatTurn[] }
  | { k: "callout"; title: string; text: string };

interface Slide {
  eyebrow: string;
  heading: string;
  headingHtml?: string;
  hero?: boolean; // slide-1 layout: logo + illustration beside the heading
  blocks: Block[];
}

interface FlagshipPage {
  slug: string;
  description: string;
  slides: Slide[];
  cta?: Link[]; // external links appended to the last slide's CTA row
}

const H = ({ s }: { s: { heading: string; headingHtml?: string } }) =>
  s.headingHtml ? <h2 dangerouslySetInnerHTML={{ __html: s.headingHtml }} /> : <h2>{s.heading}</h2>;

/* ---- block views ---- */

const Lead = ({ b }: { b: Extract<Block, { k: "lead" }> }) =>
  b.html ? <p class="lead" dangerouslySetInnerHTML={{ __html: b.html }} /> : <p class="lead">{b.text}</p>;

const WorkSteps = ({ steps }: { steps: Step[] }) => (
  <ol class="worksteps">
    {steps.map(([t, d]) => (
      <li key={t}>
        <div class="workstep-title">{t}</div>
        {d ? <p>{d}</p> : null}
      </li>
    ))}
  </ol>
);

// A header that is wider than its narrow mobile column renders a short phone-only
// label (display-toggled in CSS) so it never breaks mid-word; plain headers and
// the desktop full label render as-is.
const ColTh = ({ c }: { c: ColHead }) =>
  typeof c === "string" ? (
    <th>{c}</th>
  ) : (
    <th>
      <span class="ct-full">{c.full}</span>
      <span class="ct-short">{c.short}</span>
    </th>
  );

const CTable = ({ label, cols, rows }: { label: string; cols: ColHead[]; rows: string[][] }) => (
  <div class="card" style="min-width:0">
    <div class="eyebrow">{label}</div>
    <table class="ctable">
      <thead>
        <tr>
          {cols.map((c) => (
            <ColTh key={typeof c === "string" ? c : c.full} c={c} />
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row[0]}>
            {row.map((cell, ci) => (
              <td key={ci} class={ci === row.length - 1 ? "ctable-win" : undefined}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Chips = ({ items }: { items: string[] }) => (
  <div class="flowchips" style="margin-top:26px">
    {items.map((c, i) => (
      <>
        <span class="flowchip" key={c}>
          {c}
        </span>
        {i < items.length - 1 ? <span class="flowchip-arrow">·</span> : null}
      </>
    ))}
  </div>
);

const Cards = ({ items }: { items: Card[] }) => (
  <div class="grid g3" style="margin-top:20px">
    {items.map(([t, desc]) => (
      <div class="card" key={t}>
        <div class="case-h">{t}</div>
        <p>{desc}</p>
      </div>
    ))}
  </div>
);

const Stats = ({ items }: { items: Stat[] }) => (
  <div class="stat-row">
    {items.map((s) => (
      <div class="card stat-card" key={s[1]}>
        <div class="stat-num">{s[0]}</div>
        <div class="stat-cap">{s[1]}</div>
      </div>
    ))}
  </div>
);

const Chat = ({ turns }: { turns: ChatTurn[] }) => (
  <div class="chatdemo">
    {turns.map(([text, role], i) => (
      <div class={`chatbubble ${role}`} key={i}>
        {text}
      </div>
    ))}
  </div>
);

const BlockView = ({ b }: { b: Block }) => {
  switch (b.k) {
    case "lead":
      return <Lead b={b} />;
    case "prose":
      return (
        <p class="lead" style="margin-top:12px">
          {b.text}
        </p>
      );
    case "chips":
      return <Chips items={b.items} />;
    case "steps":
      return <WorkSteps steps={b.items} />;
    case "table":
      return <CTable label={b.label} cols={b.cols} rows={b.rows} />;
    case "quote":
      return (
        <div class="quote" style="margin-top:22px;max-width:620px">
          {b.text}
        </div>
      );
    case "cards":
      return <Cards items={b.items} />;
    case "stats":
      return <Stats items={b.items} />;
    case "chat":
      return <Chat turns={b.turns} />;
    case "callout":
      return (
        <div class="card callout">
          <div class="case-h">{b.title}</div>
          <p>{b.text}</p>
        </div>
      );
  }
};

// Render a slide's blocks. A `steps` block immediately followed by a `table` is
// laid out side-by-side in the `.trail-grid` (the proven worksteps + comparison
// layout); every other block renders linearly.
function renderBlocks(blocks: Block[]): JSX.Element[] {
  const out: JSX.Element[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const next = blocks[i + 1];
    if (b.k === "steps" && next && next.k === "table") {
      out.push(
        <div class="trail-grid" key={`grid-${i}`}>
          <WorkSteps steps={b.items} />
          <CTable label={next.label} cols={next.cols} rows={next.rows} />
        </div>,
      );
      i++; // consume the paired table
      continue;
    }
    out.push(<BlockView b={b} key={i} />);
  }
  return out;
}

const CtaRow = ({ cta }: { cta?: Link[] }) => (
  <div class="cta-row" style="margin-top:34px">
    {(cta ?? []).map((l, i) => (
      <a
        class="btn btn-ghost"
        key={l.href}
        href={l.href}
        target="_blank"
        rel="noopener"
        data-testid={i === 0 ? "flagship-visit" : `flagship-visit-${i}`}
      >
        {l.label} <span class="ar">→</span>
      </a>
    ))}
    <a class="btn btn-ghost" href="/flagskibe" data-testid="flagship-all">
      Alle flagskibe <span class="ar">→</span>
    </a>
  </div>
);

function SlideView({ page, slide, idx, total }: { page: FlagshipPage; slide: Slide; idx: number; total: number }) {
  const t = total > 1 ? idx / (total - 1) : 0;
  const last = idx === total - 1;
  const ctaRow = last ? <CtaRow cta={page.cta} /> : null;

  if (slide.hero) {
    const illu = hasIllustration(page.slug);
    const head = slide.blocks.filter((b) => b.k === "lead" || b.k === "prose");
    const body = slide.blocks.filter((b) => b.k !== "lead" && b.k !== "prose");
    return (
      <section class="fslide" id="top" style={`--t:${t}`}>
        <div class="wrap reveal">
          <div class={illu ? "plat-detail-head" : "plat-detail-head one-col"}>
            <div class="plat-detail-text">
              <div class="logot logot-lg">
                <Logo k={page.slug} />
              </div>
              <div class="eyebrow">{slide.eyebrow}</div>
              <H s={slide} />
              {head.map((b, i) => (
                <BlockView b={b} key={i} />
              ))}
            </div>
            {illu ? (
              <div class="plat-illu">
                <Illustration k={page.slug} />
              </div>
            ) : null}
          </div>
          {renderBlocks(body)}
          {ctaRow}
        </div>
      </section>
    );
  }

  return (
    <section class="fslide" style={`--t:${t}`}>
      <div class="wrap reveal">
        <div class="sec-head">
          <div class="eyebrow">{slide.eyebrow}</div>
          <H s={slide} />
          <div class="divider" />
        </div>
        {renderBlocks(slide.blocks)}
        {ctaRow}
      </div>
    </section>
  );
}

/* ---- flagship copy ---- */

const components: FlagshipPage = {
  slug: "components",
  description:
    "broberg.ai's fælles lager af genbrugelige dele — 20+ gennemtestede @broberg/*-pakker plus UI-komponenter og infra-mønstre i ét live katalog. Princippet er enkelt: reuse > re-roll.",
  cta: [{ label: "Udforsk kataloget på discovery.broberg.ai", href: "https://discovery.broberg.ai" }],
  slides: [
    {
      hero: true,
      eyebrow: "components · fælles inventar",
      heading: "Byg aldrig det samme to gange.",
      blocks: [
        {
          k: "lead",
          text: "broberg.ai's fælles lager af genbrugelige dele — 20+ gennemtestede @broberg/*-pakker plus UI-komponenter og infra-mønstre i ét live katalog. Princippet er enkelt: reuse > re-roll.",
        },
        { k: "chips", items: ["Mail", "Web-push", "AI-gateway", "Cron", "Betaling", "Medie", "Auth", "Secrets"] },
      ],
    },
    {
      eyebrow: "Sådan virker det",
      heading: "Én kilde. Forplanter sig til alt.",
      blocks: [
        {
          k: "steps",
          items: [
            ["Slå op i kataloget", "Tjek discovery.broberg.ai før du bygger — er delen der allerede?"],
            ["Genbrug den færdige pakke", "Træk @broberg/*-pakken ind, exact-pinned — ikke en kopi."],
            ["Mangler noget? Udvid pakken", "Tilføj til den fælles pakke — aldrig en lokal afart."],
            ["Én rettelse opdaterer alle", "Et fix ét sted forplanter sig til alle der bruger den."],
          ],
        },
        {
          k: "table",
          label: "Sammenlign",
          cols: ["Dimension", "Genopfind", "components"],
          rows: [
            ["Hastighed", "Fra bunden hver gang", "Samlet af færdige dele"],
            ["Konsistens", "Driver fra hinanden", "Ens overalt"],
            ["Sikkerhed", "Fixes pr. projekt", "Fix for hele flåden"],
            ["Vedligehold", "N kopier", "Én kilde"],
          ],
        },
      ],
    },
    {
      eyebrow: "Hvorfor det betyder noget",
      heading: "Sikkerhed i top.",
      blocks: [
        {
          k: "prose",
          text: "Hver pakke er gennemtestet og hærdet i drift. Fordi hvert kundeprojekt bygger på de samme dele, valideres hver pakke af HELE flåden på én gang — en svaghed fanget ét sted lukkes for alle.",
        },
        {
          k: "stats",
          items: [
            ["20+", "pakker"],
            ["1", "kilde"],
            ["∞", "genbrug"],
          ],
        },
      ],
    },
  ],
};

const cardmem: FlagshipPage = {
  slug: "cardmem",
  description:
    "cardmem er den AI-native projektstyring der binder idé sammen med færdig løsning. Tanker bliver til planer, planer til opgaver, og opgaver til kode som AI-agenter bygger — mens du bliver i førersædet.",
  slides: [
    {
      hero: true,
      eyebrow: "cardmem · broberg.ai's kerne",
      heading: "Fra idé til færdig løsning — sporbart.",
      blocks: [
        {
          k: "lead",
          text: "cardmem er den AI-native projektstyring der binder idé sammen med færdig løsning. Tanker bliver til planer, planer til opgaver, og opgaver til kode som AI-agenter bygger — mens du bliver i førersædet.",
        },
        { k: "chips", items: ["Idé", "Plan", "Opgavetavle", "AI-agent", "Kvalitetstjek", "Live"] },
      ],
    },
    {
      eyebrow: "Sådan virker det",
      heading: "Løkken der gentager sig til det er færdigt.",
      blocks: [
        {
          k: "steps",
          items: [
            ["Idé", ""],
            ["Plan", ""],
            ["Opgavetavle", ""],
            ["AI-agent bygger", ""],
            ["Kvalitetstjek", ""],
            ["Live — og rundt igen", ""],
          ],
        },
        {
          k: "prose",
          text: "Det er ikke en engangs-rejse. Hele løkken kan køres igen og igen — du ser en version live, justerer, og samme workflow ruller forfra. Produktet bliver bedre for hver runde, indtil det er præcis som det skal være.",
        },
      ],
    },
    {
      eyebrow: "Hvorfor det betyder noget",
      heading: "Intet går live uventet.",
      blocks: [
        {
          k: "prose",
          text: "Hver opgave har en skreven plan og klare succeskriterier, og bliver tjekket både visuelt og funktionelt før den lander. Indbygget kvalitetskontrol åbner hver ændring i en rigtig browser og verificerer den — fejl fanges før brugerne ser dem.",
        },
        {
          k: "stats",
          items: [
            ["∞", "iterationer"],
            ["Plan", "før kode"],
            ["Du", "i førersædet"],
          ],
        },
      ],
    },
  ],
};

const buddy: FlagshipPage = {
  slug: "buddy",
  description:
    "buddy er det altid-vågne lag i broberg.ai — en lokal makker der kører ved siden af hver AI-session og holder øje med at intet går skævt, og at alle motorer spiller sammen.",
  slides: [
    {
      hero: true,
      eyebrow: "buddy · altid vågen",
      heading: "Den der holder øje — døgnet rundt.",
      blocks: [
        {
          k: "lead",
          text: "buddy er det altid-vågne lag i broberg.ai — en lokal makker der kører ved siden af hver AI-session og holder øje med at intet går skævt, og at alle motorer spiller sammen.",
        },
        { k: "chips", items: ["Kritisk medlæser", "Fælles samtalelinje", "Planlagte job", "Stopknap", "Hukommelse"] },
      ],
    },
    {
      eyebrow: "Sådan virker det",
      heading: "Ser hver tur. Binder flåden sammen.",
      blocks: [
        {
          k: "steps",
          items: [
            ["Læser hver ændring kritisk", "Fanger fejl, smutveje og påstande uden dækning."],
            [
              "Binder sessionerne sammen",
              "Lader dem tale sammen på tværs af projekter + sender det vigtigste til din telefon.",
            ],
            ["Vækker en session når der er arbejde", "Præcis når — og kun når — der er noget at gøre."],
            ["Holder beslutninger i fælles hukommelse", "De vigtige valg huskes på tværs af hele flåden."],
          ],
        },
      ],
    },
    {
      eyebrow: "Hvorfor det betyder noget",
      heading: "Ét system, ikke ni løsrevne dele.",
      blocks: [
        {
          k: "prose",
          text: "buddy er grunden til at de mange motorer opfører sig som ét. Den fanger fejlene mens de er små, holder beskederne flydende og er vågen døgnet rundt — så du kan være orkestratoren i stedet for vagten.",
        },
        {
          k: "stats",
          items: [
            ["24/7", "vågen"],
            ["Hver tur", "tjekket"],
            ["1", "stopknap for hele flåden"],
          ],
        },
      ],
    },
  ],
};

const trail: FlagshipPage = {
  slug: "trail",
  description:
    "Trail er virksomhedens ekstra hjerne — en levende videnmotor du kan chatte med og slå op i. Den kompilerer alt din virksomhed ved til en base som både dit team og en AI kan trække på — altid i din stemme, med dine fakta.",
  cta: [{ label: "Besøg trailmem.com", href: "https://trailmem.com" }],
  slides: [
    {
      hero: true,
      eyebrow: "trail · videnmotor & anden hjerne",
      heading: "AI der kender din virksomhed indefra.",
      headingHtml: "AI der kender din virksomhed <em>indefra</em>.",
      blocks: [
        {
          k: "lead",
          text: "Trail er virksomhedens ekstra hjerne — en levende videnmotor du kan chatte med og slå op i. Den kompilerer alt din virksomhed ved til en base som både dit team og en AI kan trække på — altid i din stemme, med dine fakta.",
        },
        {
          k: "prose",
          text: "De fleste systemer husker kun det du lige har skrevet ind. Trail indlæser alt dit materiale på forhånd, forbinder det til Neurons (videnatomer med proveniens), og bliver klogere for hvert stykke du tilføjer.",
        },
        {
          k: "chips",
          items: ["Brand guides", "Billeder & logoer", "Skabeloner", "Kampagner", "Faglig viden", "Lyd · Video"],
        },
      ],
    },
    {
      eyebrow: "Sådan virker det",
      heading: "Fra materiale til levende AI-assistent.",
      blocks: [
        {
          k: "steps",
          items: [
            ["Onboarding — upload din viden", "Trail kompilerer det til Neurons — videns-celler med proveniens."],
            ["AI svarer & genererer", "Altid i din stemme, med dine fakta — ikke et generisk LLM-gæt."],
            ["Kuration", "Alt AI-foreslået lander i en kureret kø; mennesket godkender."],
            ["Deploy", "Trail kobles på som <trail-chat>-vidensbase på dit site, eller som intern opslagshjerne."],
          ],
        },
        {
          k: "table",
          label: "Sammenlign",
          cols: ["Dimension", "Traditionel RAG", "Trail"],
          rows: [
            ["Arbejdsmodel", "Query-time retrieval", "Ingest-time kompilering"],
            ["Stemme & brand", "Ingen garanti", "Din stemme altid"],
            ["Vidensakkumulering", "Statiske chunks", "Vokser organisk over tid"],
            ["Kvalitetssikring", "Ingen", "Kureret godkendelseskø"],
          ],
        },
        { k: "quote", text: "LLM'en foreslår. Du godkender. Curator, not dictator." },
      ],
    },
    {
      eyebrow: "Hvem bruger det",
      heading: "Én hjerne, mange slags virksomheder.",
      blocks: [
        {
          k: "cards",
          items: [
            ["Bureau", "En brand intelligence-base pr. klient → AI der er on-brand for hver enkelt klient, automatisk."],
            [
              "Fagekspert",
              "Al din akkumulerede faglige viden → en assistent i dit fagsprog, på dit eget website, 24/7. (Fx en klinik som Sanne Andersen.)",
            ],
            [
              "Kundeplatform",
              "Trail som chatbot-motor med en <trail-chat>-widget: matcher og hjælper besøgende, og vidensbasen vokser for hver artikel du publicerer. (Fx Fysio Danmark Aalborg.)",
            ],
          ],
        },
        {
          k: "stats",
          items: [
            ["∞", "vokser organisk"],
            ["24/7", "altid-vågen"],
            ["100%", "i din stemme"],
          ],
        },
      ],
    },
  ],
};

// cms — the 5-slide FINAL spec (cms #137/#138), gradient spread across all 5.
const cms: FlagshipPage = {
  slug: "cms",
  description:
    "Motoren bag hvert site i broberg.ai-universet — AI-native, framework-agnostisk, statisk-først, med 64 integrerede værktøjer du kan styre med din stemme.",
  cta: [
    { label: "Besøg webhouse.app", href: "https://webhouse.app" },
    { label: "Læs docs", href: "https://docs.webhouse.app" },
  ],
  slides: [
    {
      hero: true,
      eyebrow: "cms · @webhouse/cms",
      heading: "Det tekniske fundament bag AI-native sites.",
      blocks: [
        {
          k: "lead",
          html: "<strong>Ikke WordPress. Ikke Wix.</strong> Motoren bag hvert site i broberg.ai-universet — bygget fra bunden: AI-native, framework-agnostisk, statisk-først (0 runtime-JS), 64 integrerede værktøjer.",
        },
        {
          k: "table",
          label: "Ikke som et gammelt CMS",
          cols: ["Egenskab", "WordPress", { full: "@webhouse/cms", short: "cms" }],
          rows: [
            ["Loadtid (mobil)", "3–6 sek", "0,4–0,8 sek"],
            ["Lighthouse", "55–70", "95–100"],
            ["Sikkerhed", "43% af alle hacks", "Ingen CMS-angreb"],
            ["AI", "Plugin-baseret", "Native · 64 værktøjer"],
            ["GEO", "Ingen", "llms.txt · RSS · JSON-LD"],
          ],
        },
        {
          k: "chips",
          items: ["Next.js", "Astro", "Hugo", "Django", ".NET", "Java", "Rails", "Laravel", "PHP", "Rust", "Swift"],
        },
      ],
    },
    {
      eyebrow: "@webhouse/cms · chat platform",
      heading: "64 værktøjer. Styr hele sitet med din stemme.",
      blocks: [
        {
          k: "lead",
          text: "Komplet chat-platform med 64 MCP-værktøjer — styr sitet via naturlig dialog, på ethvert sprog. Vil du ikke taste? Selvstyrende content-agenter bygger det selv.",
        },
        {
          k: "cards",
          items: [
            ["Indhold", "Opret · rediger · publicer · klon"],
            ["AI-generering", "Skriv · omskriv · oversæt"],
            ["Medie", "Upload, optimering og styring af billeder og filer"],
            ["Agenter", "Kør selvstyrende content-agenter — godkend via curation-kø"],
            ["Planlægning", "Publicer fremad i tid · fuld revisionshistorik"],
            ["Site", "Byg · deploy · Lighthouse · linktjek"],
            ["Formularer", "Indsaml og håndter henvendelser direkte i sitet"],
            ["Hukommelse", "Sitet husker brand, beslutninger og kontekst"],
            ["Web", "Søg nettet og træk frisk viden ind i indholdet"],
          ],
        },
        {
          k: "chat",
          turns: [
            ["Skriv en kampagneside om vores sommersalg — dansk og engelsk, SEO-optimeret.", "you"],
            ["Siden er klar (dansk + engelsk), SEO-score 96, intern linking til 3 sider. Publicere nu?", "ai"],
            ["Ja.", "you"],
            ["Publiceret på begge sprog. Sitemap opdateret. ✓ Done", "ai"],
          ],
        },
        {
          k: "callout",
          title: "Native app (på vej)",
          text: "Bare tal til dit website fra telefonen — diktér en opdatering, godkend AI-forslag fra sofaen. App Store + Google Play.",
        },
      ],
    },
    {
      eyebrow: "Unik feature",
      heading: "AI Lock — det eneste CMS der beskytter menneske-rettelser.",
      blocks: [
        {
          k: "prose",
          text: "Feltbaseret content-beskyttelse: AI kan aldrig overskrive hvad et menneske har redigeret. Selvstyrende agenter skriver, oversætter og optimerer på egen hånd — men mennesket har altid det sidste ord via curation-køen. Det eneste CMS i verden med den funktion.",
        },
      ],
    },
    {
      eyebrow: "Det konkrete regnestykke",
      heading: "Hvad er potentialet?",
      blocks: [
        {
          k: "table",
          label: "Uden vs. med AI-platform",
          cols: ["Dimension", "Uden AI-platform", "Med AI-platform"],
          rows: [
            ["Content-produktion", "Manuelt, tid = penge", "AI-drafts + menneskelig finish"],
            ["Brand-konsistens", "Guidelines i PDF", "AI kender brandet indefra"],
            ["Site-opdateringer", "Kræver udviklertimer", "Du taler til sitet"],
            ["Flersproglig", "Dyrt at oversætte", "AI på minutter"],
            ["AI-assistent", "Ikke muligt / dyrt", "trail + cms native"],
            ["GEO-synlighed", "Ingen", "ChatGPT · Perplexity · Gemini"],
          ],
        },
        {
          k: "stats",
          items: [
            ["5×", "mere content output"],
            ["95+", "Lighthouse"],
          ],
        },
      ],
    },
    {
      eyebrow: "Hvorfor det betyder noget",
      heading: "Samme motor bag hver kunde.",
      blocks: [
        {
          k: "prose",
          text: "Hvert site i universet — fra broberg.ai til hver kundeløsning — kører på samme CMS. Forbedringer og sikkerhed forplanter sig til alle på én gang. Du redigerer ét sted; det går live på sekunder.",
        },
        {
          k: "stats",
          items: [
            ["95+", "Lighthouse"],
            ["0", "runtime-JS"],
            ["64", "værktøjer"],
          ],
        },
      ],
    },
  ],
};

// ai-sdk — 4 slides, gradient t=0/0.33/0.67/1, no external CTA (cms #144/#145).
const aiSdk: FlagshipPage = {
  slug: "ai-sdk",
  description:
    "Hvert AI-kald i broberg.ai-universet går gennem ÉN facade — Claude, GPT, Gemini, Mistral, Black Forest Labs. Skift model ved at ændre et niveau, ikke din kode. Og er data personfølsomt, bliver det i Europa.",
  slides: [
    {
      hero: true,
      eyebrow: "ai-sdk · @broberg/ai-sdk",
      heading: "Én AI-motor bag det hele.",
      blocks: [
        {
          k: "lead",
          html: "Hvert AI-kald i broberg.ai-universet går gennem ÉN facade — Claude, GPT, Gemini, Mistral, Black Forest Labs. Skift model ved at ændre et <em>niveau</em>, ikke din kode. Og er data personfølsomt, bliver det i Europa.",
        },
        {
          k: "chips",
          items: [
            "Chat",
            "Vision",
            "Video",
            "Oversæt",
            "Billede",
            "Embedding",
            "Tale→tekst",
            "OCR",
            "Moderation",
            "Podcast",
            "TTS",
            "Kontrakter",
          ],
        },
      ],
    },
    {
      eyebrow: "Sådan virker det",
      heading: "Start billigt. Gå op kun når det betaler sig.",
      blocks: [
        {
          k: "chips",
          items: [
            "fast = Haiku",
            "smart = Sonnet",
            "powerful = Opus",
            "cheap = Mistral (EU)",
            "vision",
            "video",
            "embedding",
          ],
        },
        {
          k: "table",
          label: "Rå provider-SDK vs. ai-sdk",
          cols: ["Dimension", "Direkte", "ai-sdk"],
          rows: [
            ["Skift udbyder", "Overalt i koden", "Ét niveau"],
            ["Pris-overblik", "Ingen", "tokens + pris + latency pr. kald"],
            ["Når en model dør", "Crash hos brugeren", "Graceful fallback"],
            ["Følsom data", "Manuelt ansvar", "Automatisk i EU"],
          ],
        },
      ],
    },
    {
      eyebrow: "Databeskyttelse · GDPR",
      heading: "Følsom data forlader aldrig Europa.",
      blocks: [
        {
          k: "prose",
          text: "ai-sdk vælger den bedste model til opgaven — men i samme sekund data er personfølsomt, dirigeres det AUTOMATISK til en europæisk model (Mistral, Paris-hosted, ingen Schrems II). Aldrig US, aldrig CN. Du skal ikke huske det; det er indbygget.",
        },
        {
          k: "cards",
          items: [
            ["Fysioterapeut", "Patientdata — journaler og helbredsoplysninger der aldrig må forlade EU."],
            ["Bureau", "Klientdata på tværs af mange kunder — beskyttet pr. kald, automatisk."],
            ["Fagekspert", "Helbred / journal og anden følsom faglig viden — automatisk i EU."],
          ],
        },
        {
          k: "stats",
          items: [
            ["🇪🇺", "EU-hosted"],
            ["0", "Schrems II"],
            ["Auto", "pr. kald"],
          ],
        },
      ],
    },
    {
      eyebrow: "Det du kan se",
      heading: "Billeder i din stil. Portrætter af en rigtig person.",
      blocks: [
        {
          k: "prose",
          text: "Lær ai-sdk dit visuelle udtryk: en stil-model trænet på dine egne billeder leverer on-brand grafik — hver gang, i din palet, for få ører pr. styk. Og fra blot en håndfuld fotos skaber den fotorealistiske portrætter af en rigtig person, ramt i ét eneste kald og hostet i Europa. Dit brand, gengivet i skala — ikke et stockfoto i sigte.",
        },
        {
          k: "stats",
          items: [
            ["~0,18 kr.", "pr. billede (stil)"],
            ["1–8", "fotos → portræt"],
            ["EU", "hosted"],
          ],
        },
      ],
    },
  ],
};

const REGISTRY: Record<string, FlagshipPage> = { components, cardmem, buddy, trail, cms, "ai-sdk": aiSdk };

export function hasSlides(slug: string): boolean {
  return slug.toLowerCase() in REGISTRY;
}

export function slideMeta(slug: string): { title: string; description: string } | null {
  const d = REGISTRY[slug.toLowerCase()];
  if (!d) return null;
  return { title: `${d.slug} — broberg.ai`, description: d.description };
}

export function FlagshipSlides({ slug }: { slug: string }): JSX.Element | null {
  const d = REGISTRY[slug.toLowerCase()];
  if (!d) return null;
  return (
    <>
      {d.slides.map((slide, i) => (
        <SlideView key={i} page={d} slide={slide} idx={i} total={d.slides.length} />
      ))}
    </>
  );
}
