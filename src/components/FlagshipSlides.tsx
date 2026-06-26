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
type Card = [string, string] | [string, string, string]; // [title, desc, icon?]
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

// Inline Lucide icon paths (the site has no client icon lib; these SSR as static
// SVG). Stroked, currentColor → tinted via .card-icon. Only the keys used here.
const ICONS: Record<string, string> = {
  FileText:
    '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  Sparkles:
    '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
  Image:
    '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  Bot: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
  CalendarClock:
    '<path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4.3"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h5"/><circle cx="16" cy="16" r="6"/><path d="M16 14v2l1 1"/>',
  Rocket:
    '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
  ClipboardList:
    '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
  Brain:
    '<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/>',
  Globe:
    '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
};

const Icon = ({ name }: { name: string }) => {
  const paths = ICONS[name];
  if (!paths) return null;
  return (
    <svg
      class="card-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: paths }}
    />
  );
};

const Cards = ({ items }: { items: Card[] }) => (
  <div class="grid g3" style="margin-top:20px">
    {items.map(([t, desc, icon]) => (
      <div class="card" key={t}>
        {icon ? <Icon name={icon} /> : null}
        <div class="case-h">{t}</div>
        <p>{desc}</p>
      </div>
    ))}
  </div>
);

const Stats = ({ items }: { items: Stat[] }) => (
  <div class="stat-row">
    {items.map((s) => {
      // Word/phrase values (e.g. "Sekunder", "Anden sky") don't fit the big
      // number size on one line — render them smaller + no-wrap; short numeric
      // tokens ("95+", "24/7") keep the punchy size.
      const word = s[0].length > 5 || /\s/.test(s[0]);
      return (
        <div class="card stat-card" key={s[1]}>
          <div class={word ? "stat-num stat-num-word" : "stat-num"}>{s[0]}</div>
          <div class="stat-cap">{s[1]}</div>
        </div>
      );
    })}
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
    "buddy er det altid-vågne lag i universet: det læser hver eneste ændring kritisk igennem før den lander, lader AI-medarbejderne tale sammen på tværs af projekter, og vækker dem præcis når der er arbejde.",
  slides: [
    {
      hero: true,
      eyebrow: "buddy · altid vågen",
      heading: "Et AI-hold der bygger som ét — med kvalitetskontrol indbygget.",
      blocks: [
        {
          k: "lead",
          text: "buddy er det altid-vågne lag i universet: det læser hver eneste ændring kritisk igennem før den lander, lader AI-medarbejderne tale sammen på tværs af projekter, og vækker dem præcis når der er arbejde.",
        },
        {
          k: "prose",
          text: "Fordelen for os: vi bygger hurtigt, men aldrig blindt. Hver ændring får en medlæser der fanger fejl, smutveje og påstande uden dækning — så hastighed ikke koster kontrol.",
        },
        {
          k: "chips",
          items: [
            "Kritisk medlæser",
            "Fanger fejl før de lander",
            "Fælles samtalelinje",
            "Vækker ved arbejde",
            "Døgnet rundt",
            "Fælles hukommelse",
            "Stopknap",
          ],
        },
      ],
    },
    {
      eyebrow: "Sådan virker det",
      heading: "For dig som kunde: bedre arbejde, hurtigere.",
      blocks: [
        {
          k: "steps",
          items: [
            ["Færre fejl når dig", "Hver ændring er læst kritisk igennem før den ship'er."],
            [
              "Hurtigere levering",
              "Holdet arbejder døgnet rundt og koordinerer som ét, så dit projekt skrider frem — også mens du sover.",
            ],
            ["Samme standard overalt", "Ét kvalitetsniveau på tværs af alt du modtager."],
            ["Intet tabt", "Beslutninger om dit projekt holdes i fælles hukommelse mellem hænder."],
          ],
        },
        {
          k: "table",
          label: "Uden vs. med",
          cols: ["Dimension", "Uden", "Med"],
          rows: [
            ["Kvalitetskontrol", "Afhænger af én udvikler", "Hver ændring medlæst kritisk"],
            ["Fremdrift", "Kontortid", "Døgnet rundt"],
            ["Overblik", "Spredt", "Ét system, én hukommelse"],
          ],
        },
      ],
    },
    {
      eyebrow: "Hvorfor det betyder noget",
      heading: "Ét hold, ikke ni løsrevne dele.",
      blocks: [
        {
          k: "prose",
          text: "buddy er grunden til at de mange motorer opfører sig som ét hold. Det fanger fejlene mens de er små, holder beskederne flydende og er vågent døgnet rundt — så du får et produkt der er bygget hurtigt og holdt i kort snor på samme tid.",
        },
        {
          k: "stats",
          items: [
            ["Hver ændring", "tjekket"],
            ["24/7", "vågent"],
            ["1", "kvalitetsniveau"],
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
      eyebrow: "cms · motoren bag dit site",
      heading: "Styr hele dit website ved at tale til det.",
      blocks: [
        {
          k: "lead",
          text: "Bed om en kampagneside på dansk og engelsk — den står klar, SEO-optimeret, på minutter. Dit site loader på under et sekund, kan ikke hackes som et WordPress, og bliver fundet af ChatGPT og Perplexity. Samme motor kører bag hvert site i universet — teknikken under den er avanceret, men det er ikke din hovedpine. Det er din fordel.",
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
      heading: "64 værktøjer. Ét sprog: dit eget.",
      blocks: [
        {
          k: "lead",
          text: "Komplet chat-platform med 64 MCP-værktøjer — styr sitet via naturlig dialog, på ethvert sprog. Vil du ikke taste? Selvstyrende content-agenter bygger det selv.",
        },
        {
          k: "cards",
          items: [
            ["Indhold", "Opret · rediger · publicer · klon", "FileText"],
            ["AI-generering", "Skriv · omskriv · oversæt", "Sparkles"],
            ["Medie", "Upload, optimering og styring af billeder og filer", "Image"],
            ["Agenter", "Kør selvstyrende content-agenter — godkend via curation-kø", "Bot"],
            ["Planlægning", "Publicer fremad i tid · fuld revisionshistorik", "CalendarClock"],
            ["Site", "Byg · deploy · Lighthouse · linktjek", "Rocket"],
            ["Formularer", "Indsaml og håndter henvendelser direkte i sitet", "ClipboardList"],
            ["Hukommelse", "Sitet husker brand, beslutninger og kontekst", "Brain"],
            ["Web", "Søg nettet og træk frisk viden ind i indholdet", "Globe"],
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
      heading: "Dine rettelser er fredede — det eneste CMS hvor AI aldrig overskriver et menneske.",
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
      heading: "Samme motor bag hver kunde — derfor er dit site aldrig det svage led.",
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

// upmetrics — 3 slides, gradient t=0/0.5/1, no external CTA (cms #153/#154).
const upmetrics: FlagshipPage = {
  slug: "upmetrics",
  description:
    "Bag hvert site i broberg.ai-universet kører et lag der hele tiden holder øje — fanger fejl og crashes, sporer hvad alt koster, og slår alarm i sekundet noget knækker, på web og mobil. Du opdager sjældent at noget gik galt, fordi det er fanget og fikset først.",
  slides: [
    {
      hero: true,
      eyebrow: "upmetrics · @upmetrics/sdk",
      heading: "Dit site fanger sine egne fejl — før dine kunder gør.",
      blocks: [
        {
          k: "lead",
          text: "Bag hvert site i broberg.ai-universet kører et lag der hele tiden holder øje — fanger fejl og crashes, sporer hvad alt koster, og slår alarm i sekundet noget knækker, på web og mobil. Du opdager sjældent at noget gik galt, fordi det er fanget og fikset først.",
        },
        {
          k: "chips",
          items: ["Fejl fanges automatisk", "Crashes", "Uptime", "AI-forbrug i kr.", "Web", "iOS"],
        },
      ],
    },
    {
      eyebrow: "Sådan virker det",
      heading: "Et stille brud bliver aldrig en stille katastrofe.",
      blocks: [
        {
          k: "steps",
          items: [
            ["Fanget", "En fejl, et crash, en langsom side opdages automatisk."],
            ["Forstået", "Tusind alarmer bliver til ét klart issue, knyttet til den ændring der udløste det."],
            ["Fikset", "Fundet hurtigt, så nedetid bliver minutter, ikke dage."],
            ["Bevist", "Hvert deploy får en sund/regredieret-dom."],
          ],
        },
        {
          k: "table",
          label: "Uden vs. med",
          cols: ["Dimension", "Uden", "Med"],
          rows: [
            ["Du opdager en fejl", "Fra en sur kunde-mail", "Automatisk, før kunden ser den"],
            ["Når noget bryder", "Timer i blinde", "Fundet og fikset i minutter"],
            ["Et dårligt deploy", "Opdages dage senere", "Fanget med det samme"],
          ],
        },
      ],
    },
    {
      eyebrow: "Ingen blinde vinkler",
      heading: "Nogen holder altid øje — også når du sover.",
      blocks: [
        {
          k: "prose",
          text: "Du skal ikke babysitte dit site. Det overvåges døgnet rundt — og selve vagten er bevogtet af en uafhængig watchdog i en anden sky, så selv et fuldt nedbrud fanges udefra. Resultatet er ro i maven: dit site er oppe, det passer på sig selv, og skulle noget ske, ved vi det før dig.",
        },
        {
          k: "stats",
          items: [
            ["24/7", "overvåget"],
            ["Fanget", "før kunden"],
            ["Ro i maven", "site passer på sig selv"],
          ],
        },
      ],
    },
  ],
};

// contracts — broberg.ai Contracts (NOT "webhouse Contract Manager"). 3 slides,
// gradient t=0/0.5/1, no external CTA yet (cms #157/#158).
const contracts: FlagshipPage = {
  slug: "contracts",
  description:
    "broberg.ai Contracts sætter samarbejdet juridisk og teknisk på plads fra dag ét: en samarbejdsaftale der beskriver løsningen og den anvendte teknologi, en supportaftale der fastlægger vilkårene, og en databehandleraftale der holder GDPR i orden — så både du og din kunde ved præcis hvad I har sagt ja til.",
  slides: [
    {
      hero: true,
      eyebrow: "contracts · broberg.ai",
      heading: "Klarhed for begge parter — fra første underskrift.",
      blocks: [
        {
          k: "lead",
          text: "broberg.ai Contracts sætter samarbejdet juridisk og teknisk på plads fra dag ét: en samarbejdsaftale der beskriver løsningen og den anvendte teknologi, en supportaftale der fastlægger vilkårene, og en databehandleraftale der holder GDPR i orden — så både du og din kunde ved præcis hvad I har sagt ja til.",
        },
        {
          k: "prose",
          text: "Alt brandet i dit udtryk, bygget af genbrugelige skabeloner og klausuler — underskrevet elektronisk på sekunder, og sporet så du ved hvem der har læst hvad.",
        },
        {
          k: "chips",
          items: [
            "Samarbejdsaftale",
            "Supportaftale",
            "Databehandleraftale",
            "Skabeloner",
            "Klausuler",
            "Kontraktpakker",
            "E-signatur",
            "Læse-sporing",
          ],
        },
      ],
    },
    {
      eyebrow: "Sådan virker det",
      heading: "Fra skabelon til samlet underskrift.",
      blocks: [
        {
          k: "steps",
          items: [
            ["Skabeloner & klausuler", "Genbrugelige juridiske byggeklodser, korrekte hver gang."],
            ["Konfigurér pr. kunde", "Teknologi, GDPR-grundlag og vilkår sat op for den konkrete aftale."],
            ["Saml i en pakke", "Samarbejds-, support- og databehandleraftale klar til ÉN samlet underskrift."],
            ["Send & spor", "Kladde → sendt → underskrevet, versioneret, med læse-kvitteringer."],
          ],
        },
        {
          k: "table",
          label: "Manuelt vs. Contracts",
          cols: ["Dimension", "Manuelt", "Contracts"],
          rows: [
            ["Aftalegrundlag", "Copy-paste fra sidste PDF", "Skabeloner + klausuler, korrekt hver gang"],
            ["GDPR/databehandler", "Glemt eller løs", "Indbygget aftale-type"],
            ["Underskrift", "Print, scan, vent", "E-signatur på sekunder"],
            ["Status", "“Har du set den?”", "Kladde → sendt → underskrevet, sporet"],
          ],
        },
      ],
    },
    {
      eyebrow: "Hvorfor det betyder noget",
      heading: "Samarbejdet står juridisk og teknisk solidt.",
      blocks: [
        {
          k: "prose",
          text: "En aftale er ikke en formalitet — den er fundamentet under samarbejdet. Contracts sikrer at fundamentet er korrekt hver gang: teknologien bag løsningen er beskrevet, GDPR-ansvaret ligger i en rigtig databehandleraftale, og vilkårene er klare for begge parter. Versioneret, sporet og underskrevet — så ingen er i tvivl om hvad de har sagt ja til.",
        },
        {
          k: "stats",
          items: [
            ["3 aftaler", "ét underskrift"],
            ["GDPR", "indbygget"],
            ["Fuld", "læse-sporing"],
          ],
        },
      ],
    },
  ],
};

// pitch-vault — 3 slides, gradient t=0/0.5/1, no external CTA (cms #161/#162).
const pitchVault: FlagshipPage = {
  slug: "pitch-vault",
  description:
    "Skab dine præsentationer i high-fidelity HTML — pixel-perfekte, interaktive og web-native, åbnet med ét link i enhver browser, uden PowerPoint eller PDF. Din kunde åbner en levende præsentation på enhver skærm, ikke en tung vedhæftning.",
  slides: [
    {
      hero: true,
      eyebrow: "pitch-vault · broberg.ai",
      heading: "Pixel-perfekte pitches. Ét sikkert hvælv.",
      blocks: [
        {
          k: "lead",
          text: "Skab dine præsentationer i high-fidelity HTML — pixel-perfekte, interaktive og web-native, åbnet med ét link i enhver browser, uden PowerPoint eller PDF. Din kunde åbner en levende præsentation på enhver skærm, ikke en tung vedhæftning.",
        },
        {
          k: "prose",
          text: "Hver pitch er en rigtig webside, ikke en flad fil — den ser ud præcis som du har bygget den. Gem dem ét sted: beskyttet, delt og sporet, med thumbnails så du ser hver pitch på et øjeblik.",
        },
        {
          k: "chips",
          items: ["High-fidelity HTML", "Interaktiv", "Beskyt", "Del", "Spor", "Thumbnails", "Søgbar", "Mapper"],
        },
      ],
    },
    {
      eyebrow: "Sådan virker det",
      heading: "Fra HTML-pitch til genbrugelig inspiration.",
      blocks: [
        {
          k: "steps",
          items: [
            ["Skab", "Byg pitchen i high-fidelity HTML, pixel-perfekt i dit brand."],
            ["Gem", "I hvælvet, i mapper, med auto-thumbnail."],
            ["Del", "Ét sikkert link, åbnes i enhver browser."],
            ["Spor", "Se hvem der åbnede og hvor længe."],
            ["Genbrug", "Søg på tværs, find den rette gamle pitch som afsæt."],
          ],
        },
        {
          k: "table",
          label: "Slides/PDF vs. Pitch Vault",
          cols: ["Dimension", "Slides/PDF", "Pitch Vault"],
          rows: [
            ["Format", "Flad fil (PPT/PDF)", "Levende high-fidelity HTML"],
            ["Deling", "Tung vedhæftning", "Ét link, enhver browser"],
            ["Find en gammel", "Led i filsystemet", "Søg + se thumbnails"],
            ["Sporing", "Ingen", "Hvem åbnede, hvor længe"],
          ],
        },
      ],
    },
    {
      eyebrow: "Hvorfor det betyder noget",
      heading: "Du starter aldrig på en blank side igen.",
      blocks: [
        {
          k: "prose",
          text: "Hver pitch du laver gør hvælvet rigere — et voksende, søgbart bibliotek af dit bedste arbejde. Næste gang du skal pitche, begynder du ikke fra nul, men fra alt det du allerede har skabt: genbrug en struktur, en sektion, et helt deck. Pixel-perfekt, beskyttet og sporet.",
        },
        {
          k: "stats",
          items: [
            ["HTML", "high-fidelity"],
            ["Voksende", "bibliotek"],
            ["Sporet", "deling"],
          ],
        },
      ],
    },
  ],
};

const REGISTRY: Record<string, FlagshipPage> = {
  components,
  cardmem,
  buddy,
  trail,
  cms,
  "ai-sdk": aiSdk,
  upmetrics,
  contracts,
  "pitch-vault": pitchVault,
};

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
