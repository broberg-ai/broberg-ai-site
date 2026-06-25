/* Reusable 3-slide flagship page with a blue→orange colour journey (Christian's
   choice, cms #121): slide 1 (blue) "what it is" · slide 2 (transition) "how it
   works" · slide 3 (orange) "why it matters / who it's for". The building blocks
   (flow-chips / worksteps / comparison table / quote / customer cards / stat
   cards / CTA) are all optional, so one template serves every flagship. v1 copy
   is bespoke here (cms #126/#127/#128); can move to cms fields later. */
import type { JSX } from "preact";
import { Logo } from "@/components/Logos.tsx";
import { Illustration, hasIllustration } from "@/components/Illustrations.tsx";

type Step = [string, string]; // [title, desc?] — desc may be ""
type Stat = [string, string]; // [value, caption]
type Card = [string, string]; // [title, desc]

export interface SlideData {
  slug: string;
  s1: { eyebrow: string; heading: string; headingHtml?: string; lead: string; prose?: string; chips: string[] };
  s2: {
    eyebrow: string;
    heading: string;
    steps: Step[];
    table?: { cols: [string, string, string]; rows: [string, string, string][] };
    prose?: string;
    quote?: string;
  };
  s3: {
    eyebrow: string;
    heading: string;
    prose?: string;
    cards?: Card[];
    stats: Stat[];
    cta?: { label: string; href: string };
  };
}

const H = ({ s }: { s: { heading: string; headingHtml?: string } }) =>
  s.headingHtml ? <h2 dangerouslySetInnerHTML={{ __html: s.headingHtml }} /> : <h2>{s.heading}</h2>;

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

const CTable = ({ label, table }: { label: string; table: NonNullable<SlideData["s2"]["table"]> }) => (
  <div class="card" style="min-width:0">
    <div class="eyebrow">{label}</div>
    <table class="ctable">
      <thead>
        <tr>
          {table.cols.map((c) => (
            <th key={c}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((row) => (
          <tr key={row[0]}>
            <td>{row[0]}</td>
            <td>{row[1]}</td>
            <td class="ctable-win">{row[2]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

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

const cardmem: SlideData = {
  slug: "cardmem",
  s1: {
    eyebrow: "cardmem · broberg.ai's kerne",
    heading: "Fra idé til færdig løsning — sporbart.",
    lead: "cardmem er den AI-native projektstyring der binder idé sammen med færdig løsning. Tanker bliver til planer, planer til opgaver, og opgaver til kode som AI-agenter bygger — mens du bliver i førersædet.",
    chips: ["Idé", "Plan", "Opgavetavle", "AI-agent", "Kvalitetstjek", "Live"],
  },
  s2: {
    eyebrow: "Sådan virker det",
    heading: "Løkken der gentager sig til det er færdigt.",
    steps: [
      ["Idé", ""],
      ["Plan", ""],
      ["Opgavetavle", ""],
      ["AI-agent bygger", ""],
      ["Kvalitetstjek", ""],
      ["Live — og rundt igen", ""],
    ],
    prose: "Det er ikke en engangs-rejse. Hele løkken kan køres igen og igen — du ser en version live, justerer, og samme workflow ruller forfra. Produktet bliver bedre for hver runde, indtil det er præcis som det skal være.",
  },
  s3: {
    eyebrow: "Hvorfor det betyder noget",
    heading: "Intet går live uventet.",
    prose: "Hver opgave har en skreven plan og klare succeskriterier, og bliver tjekket både visuelt og funktionelt før den lander. Indbygget kvalitetskontrol åbner hver ændring i en rigtig browser og verificerer den — fejl fanges før brugerne ser dem.",
    stats: [
      ["∞", "iterationer"],
      ["Plan", "før kode"],
      ["Du", "i førersædet"],
    ],
  },
};

const buddy: SlideData = {
  slug: "buddy",
  s1: {
    eyebrow: "buddy · altid vågen",
    heading: "Den der holder øje — døgnet rundt.",
    lead: "buddy er det altid-vågne lag i broberg.ai — en lokal makker der kører ved siden af hver AI-session og holder øje med at intet går skævt, og at alle motorer spiller sammen.",
    chips: ["Kritisk medlæser", "Fælles samtalelinje", "Planlagte job", "Stopknap", "Hukommelse"],
  },
  s2: {
    eyebrow: "Sådan virker det",
    heading: "Ser hver tur. Binder flåden sammen.",
    steps: [
      ["Læser hver ændring kritisk", "Fanger fejl, smutveje og påstande uden dækning."],
      ["Binder sessionerne sammen", "Lader dem tale sammen på tværs af projekter + sender det vigtigste til din telefon."],
      ["Vækker en session når der er arbejde", "Præcis når — og kun når — der er noget at gøre."],
      ["Holder beslutninger i fælles hukommelse", "De vigtige valg huskes på tværs af hele flåden."],
    ],
  },
  s3: {
    eyebrow: "Hvorfor det betyder noget",
    heading: "Ét system, ikke ni løsrevne dele.",
    prose: "buddy er grunden til at de mange motorer opfører sig som ét. Den fanger fejlene mens de er små, holder beskederne flydende og er vågen døgnet rundt — så du kan være orkestratoren i stedet for vagten.",
    stats: [
      ["24/7", "vågen"],
      ["Hver tur", "tjekket"],
      ["1", "stopknap for hele flåden"],
    ],
  },
};

const trail: SlideData = {
  slug: "trail",
  s1: {
    eyebrow: "trail · videnmotor & anden hjerne",
    heading: "AI der kender din virksomhed indefra.",
    headingHtml: 'AI der kender din virksomhed <em>indefra</em>.',
    lead: "Trail er virksomhedens ekstra hjerne — en levende videnmotor du kan chatte med og slå op i. Den kompilerer alt din virksomhed ved til en base som både dit team og en AI kan trække på — altid i din stemme, med dine fakta.",
    prose: "De fleste systemer husker kun det du lige har skrevet ind. Trail indlæser alt dit materiale på forhånd, forbinder det til Neurons (videnatomer med proveniens), og bliver klogere for hvert stykke du tilføjer.",
    chips: ["Brand guides", "Billeder & logoer", "Skabeloner", "Kampagner", "Faglig viden", "Lyd · Video"],
  },
  s2: {
    eyebrow: "Sådan virker det",
    heading: "Fra materiale til levende AI-assistent.",
    steps: [
      ["Onboarding — upload din viden", "Trail kompilerer det til Neurons — videns-celler med proveniens."],
      ["AI svarer & genererer", "Altid i din stemme, med dine fakta — ikke et generisk LLM-gæt."],
      ["Kuration", "Alt AI-foreslået lander i en kureret kø; mennesket godkender."],
      ["Deploy", "Trail kobles på som <trail-chat>-vidensbase på dit site, eller som intern opslagshjerne."],
    ],
    table: {
      cols: ["Dimension", "Traditionel RAG", "Trail"],
      rows: [
        ["Arbejdsmodel", "Query-time retrieval", "Ingest-time kompilering"],
        ["Stemme & brand", "Ingen garanti", "Din stemme altid"],
        ["Vidensakkumulering", "Statiske chunks", "Vokser organisk over tid"],
        ["Kvalitetssikring", "Ingen", "Kureret godkendelseskø"],
      ],
    },
    quote: "LLM'en foreslår. Du godkender. Curator, not dictator.",
  },
  s3: {
    eyebrow: "Hvem bruger det",
    heading: "Én hjerne, mange slags virksomheder.",
    cards: [
      ["Bureau", "En brand intelligence-base pr. klient → AI der er on-brand for hver enkelt klient, automatisk."],
      ["Fagekspert", "Al din akkumulerede faglige viden → en assistent i dit fagsprog, på dit eget website, 24/7. (Fx en klinik som Sanne Andersen.)"],
      ["Kundeplatform", "Trail som chatbot-motor med en <trail-chat>-widget: matcher og hjælper besøgende, og vidensbasen vokser for hver artikel du publicerer. (Fx Fysio Danmark Aalborg.)"],
    ],
    stats: [
      ["∞", "vokser organisk"],
      ["24/7", "altid-vågen"],
      ["100%", "i din stemme"],
    ],
    cta: { label: "Besøg trailmem.com", href: "https://trailmem.com" },
  },
};

const cms: SlideData = {
  slug: "cms",
  s1: {
    eyebrow: "cms · @webhouse/cms",
    heading: "Det tekniske fundament bag AI-native sites.",
    lead: "Motoren bag hvert site i broberg.ai-universet — en AI-native content-motor bygget fra bunden. Ikke WordPress, ikke Wix: framework-agnostisk, statisk-først (0 runtime-JS), 64 integrerede AI-værktøjer. Skemaet er kode; indholdet er fil-baseret JSON.",
    chips: ["22 felttyper", "Statisk output", "Media + AI-alt-tekst", "SEO + GEO", "i18n", "Formularer", "Interaktive", "Roller"],
  },
  s2: {
    eyebrow: "Tre måder at lave content",
    heading: "Chat med dit site — eller lad agenterne om det.",
    steps: [
      ["Indbygget chatbot", "Chat med dit site i admin'en (samme 64 værktøjer som MCP'en) og opret alt content via chat."],
      ["Mobil-app", "Det samme fra telefonen: chat med dit site, content på farten."],
      ["Selvstyrende content-agenter", "Content der bygger sig selv — AI skriver, oversætter og optimerer på egen hånd."],
      ["Du kuraterer", "AI Lock sikrer at agenter aldrig overskriver en menneskelig rettelse."],
    ],
    table: {
      cols: ["Egenskab", "WordPress", "@webhouse/cms"],
      rows: [
        ["Loadtid (mobil)", "3–6 sek", "0.4–0.8 sek"],
        ["Lighthouse", "55–70", "95–100"],
        ["Sikkerhed", "43% af alle hacks", "Ingen CMS-angreb"],
        ["AI", "Plugin-baseret", "Native · 64 værktøjer"],
        ["GEO", "Ingen", "llms.txt · RSS · JSON-LD"],
      ],
    },
  },
  s3: {
    eyebrow: "Hvorfor det betyder noget",
    heading: "Samme motor bag hver kunde — med en feature ingen andre har.",
    prose: "Hvert site i universet kører på samme CMS, så forbedringer og sikkerhed forplanter sig til alle på én gang. Og den har AI Lock — feltbaseret content-beskyttelse så AI aldrig overskriver hvad et menneske har redigeret. Det eneste CMS i verden med den funktion.",
    stats: [
      ["95+", "Lighthouse"],
      ["0", "runtime-JS"],
      ["64", "AI-værktøjer"],
    ],
    cta: { label: "Besøg webhouse.app", href: "https://webhouse.app" },
  },
};

const REGISTRY: Record<string, SlideData> = { components, cardmem, buddy, trail, cms };

export function hasSlides(slug: string): boolean {
  return slug.toLowerCase() in REGISTRY;
}

export function slideMeta(slug: string): { title: string; description: string } | null {
  const d = REGISTRY[slug.toLowerCase()];
  if (!d) return null;
  return { title: `${d.slug} — broberg.ai`, description: d.s1.lead };
}

export function FlagshipSlides({ slug }: { slug: string }): JSX.Element | null {
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
              <H s={d.s1} />
              <p class="lead">{d.s1.lead}</p>
              {d.s1.prose ? (
                <p class="lead" style="margin-top:12px">
                  {d.s1.prose}
                </p>
              ) : null}
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
            <H s={d.s2} />
            <div class="divider" />
          </div>
          {d.s2.table ? (
            <div class="trail-grid">
              <WorkSteps steps={d.s2.steps} />
              <CTable label="Sammenlign" table={d.s2.table} />
            </div>
          ) : (
            <WorkSteps steps={d.s2.steps} />
          )}
          {d.s2.prose ? (
            <p class="lead" style="margin-top:8px">
              {d.s2.prose}
            </p>
          ) : null}
          {d.s2.quote ? (
            <div class="quote" style="margin-top:22px;max-width:620px">
              {d.s2.quote}
            </div>
          ) : null}
        </div>
      </section>

      {/* SLIDE 3 — orange: why it matters / who it's for */}
      <section class="fslide fslide-3">
        <div class="wrap reveal">
          <div class="sec-head">
            <div class="eyebrow">{d.s3.eyebrow}</div>
            <H s={d.s3} />
            <div class="divider" />
          </div>
          {d.s3.prose ? <p class="lead">{d.s3.prose}</p> : null}
          {d.s3.cards ? (
            <div class="grid g3" style="margin-top:20px">
              {d.s3.cards.map(([t, desc]) => (
                <div class="card" key={t}>
                  <div class="case-h">{t}</div>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          ) : null}
          <div class="stat-row">
            {d.s3.stats.map((s) => (
              <div class="card stat-card" key={s[1]}>
                <div class="stat-num">{s[0]}</div>
                <div class="stat-cap">{s[1]}</div>
              </div>
            ))}
          </div>
          <div class="cta-row" style="margin-top:34px">
            {d.s3.cta ? (
              <a class="btn btn-ghost" href={d.s3.cta.href} target="_blank" rel="noopener" data-testid="flagship-visit">
                {d.s3.cta.label} <span class="ar">→</span>
              </a>
            ) : null}
            <a class="btn btn-ghost" href="/flagskibe" data-testid="flagship-all">
              Alle flagskibe <span class="ar">→</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
