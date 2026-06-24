/* Fallback content = mockup v6 copy. Lets the app render a complete, on-brand
   page before cms content is wired. Once cms is live, the home PageModel is
   built from cms `sections`/`platforms`/`cases`/`posts` docs and this becomes
   the dev/offline fallback only. */
import type { PageModel } from "@/content/types.ts";

export const FALLBACK_LIVE_FEED = [
  "<b>cardmem</b> leverede en feature → Live",
  "<b>buddy</b> reviewede et kodeskift ✓",
  "<b>Lens</b> verificerede en side ✓",
  "<b>ai-sdk</b> håndterede et AI-kald",
  "<b>trail</b> gemte en ny indsigt",
  "<b>upmetrics</b> fangede en fejl før brugeren",
  "<b>cms</b> udgav nyt indhold → Live",
  "<b>Contracts</b> sendte en signeret aftale ✓",
];

export const homeFallback: PageModel = {
  title: "broberg.ai — En teknologisk forstærker",
  description:
    "Vi bygger hurtige, arkitektonisk moderne AI-native løsninger og platforme — leveret i en brøkdel af tiden, fordi vi har bygget hele maskinen der bygger dem.",
  sections: [
    {
      kind: "hero",
      data: {
        eyebrow: "broberg.ai · Aalborg",
        titleHtml: 'Ikke et bureau.<br>En <em class="o">teknologisk forstærker</em>.',
        leadHtml:
          "Vi bygger <strong>hurtige og arkitektonisk moderne AI-native</strong> løsninger og platforme — leveret i en brøkdel af tiden, fordi vi har bygget hele maskinen der bygger dem.",
        ctas: [
          { label: "Se universet", scroll: "universet", testid: "hero-cta-primary" },
          { label: "Lad os bygge", scroll: "kontakt", testid: "hero-cta-secondary", ghost: true },
        ],
        stats: [
          { target: 30, suf: "+", label: "år som digital pioner" },
          { target: 1000, suf: "+", label: "løsninger & platforme leveret" },
          { target: 16, label: "AI-native produktioner i drift" },
          { target: 1669, pre: "~", label: "leverede milepæle" },
          { target: 5, label: "kontinenter betjent" },
        ],
        livePillLabel: "Live",
      },
    },
    {
      kind: "universe",
      data: {
        eyebrow: "Universet",
        headingHtml: "Et <em>selv-byggende</em> AI-univers.",
        lead: "broberg.ai er ikke ét produkt — det er et helt hold af AI-medarbejdere der planlægger, bygger, tjekker og udgiver rigtige kundeløsninger. Tre lag arbejder sammen.",
        core: "cardmem",
        infra: [
          { label: "buddy" },
          { label: "ai-sdk" },
          { label: "trail" },
          { label: "upmetrics" },
          { label: "components" },
          { label: "cms" },
        ],
        customers: [
          { label: "X RT platform" },
          { label: "Fysio DK Sport" },
          { label: "Sanne Andersen" },
          { label: "Fysio DK Aalborg" },
        ],
        tiers: [
          {
            title: "Kernen — motorerne",
            body: "Platformene der driver det hele: projektstyring, kvalitetssikring, fælles hukommelse, AI-adgang og overvågning. Fundamentet hver løsning står på.",
          },
          {
            title: "Byggeklodserne",
            body: "Et voksende bibliotek af færdige, gennemtestede dele — login, betaling, mail, billeder, AI og meget mere. Nye løsninger samles af stykker der allerede virker.",
          },
          {
            title: "Beviset — kundeløsninger i drift",
            body: "Rigtige sites og apps, bygget lynhurtigt oven på universet. Se Cases.",
          },
        ],
      },
    },
    {
      kind: "platforms",
      data: {
        eyebrow: "Flagskibe",
        heading: "Motorerne bag det hele.",
        lead: "De AI-native platforme vi selv har bygget — og som hver ny kundeløsning står på skuldrene af. Alt hænger sammen.",
        items: [
          {
            name: "cardmem",
            logoKey: "cardmem",
            status: "live",
            blurb:
              "AI-native projektstyring der skriver sine egne planer. Enhver AI-agent kan planlægge, bygge og udgive — mens du bliver i førersædet.",
          },
          {
            name: "cms",
            logoKey: "cms",
            status: "live",
            blurb:
              "AI-native CMS der gør en idé til et færdigt, live website. AI skriver, oversætter og udgiver — du kuraterer i stedet for at kode.",
          },
          {
            name: "trail",
            logoKey: "trail",
            status: "live",
            blurb:
              "Universets fælles hukommelse. Indsigt og beslutninger gemmes og genfindes, så det samme aldrig læres to gange.",
          },
          {
            name: "buddy",
            logoKey: "buddy",
            status: "live",
            blurb:
              "Den altid-vågne medspiller: holder øje med kvaliteten i hvert trin og binder hele holdet sammen.",
          },
          {
            name: "ai-sdk",
            logoKey: "ai-sdk",
            status: "live",
            blurb:
              "Ét sted at tale med al verdens AI. Skift og opgradér AI-model uden besvær — og hver krone holdes der regnskab med.",
          },
          {
            name: "upmetrics",
            logoKey: "upmetrics",
            status: "live",
            blurb: "Holder øje med at alt kører. Fanger fejl før brugerne gør — og viser hvad tingene koster.",
          },
          {
            name: "Contracts",
            logoKey: "contracts",
            status: "live",
            blurb:
              "AI-genererede, brandede kontrakter med elektronisk signatur på sekunder — og fuld sporing af hvem der har læst hvad.",
          },
          {
            name: "Pitch Vault",
            logoKey: "pitch-vault",
            status: "live",
            blurb:
              "Det sikre hvælv for præsentationer — beskyt, del og spor pitches. Hver færdig pitch bliver til søgbar inspiration for den næste.",
          },
        ],
        allLink: { label: "Se alle flagskibe i dybden", href: "/flagskibe", testid: "platforme-all-link" },
      },
    },
    {
      kind: "cases",
      data: {
        eyebrow: "Cases",
        headingHtml: 'Bygget <em class="o">lynhurtigt</em>. Bygget rigtigt.',
        lead: "Rigtige kunder fik rigtige resultater — leveret på en brøkdel af den normale tid, fordi fundamentet allerede lå klar.",
        items: [
          {
            kicker: "Klubplatform",
            title: "X RT platform",
            body: "En forening fik hele klublivet samlet i én app i lommen på hvert medlem — møder og program, medier, sangbog, beskeder og regnskab. Fra idé til produktion på rekordtid.",
          },
          {
            kicker: "Sundhed · app",
            title: "Fysio Danmark Sport",
            body: "Fra idé til en færdig app i både App Store og Google Play — uden et separat app-hold. Atleter indberetter en skade på under et minut, og klinikken har sagen med det samme.",
            quote:
              "Vi gik fra idé til to app-stores uden et separat udviklerhold — en rigtig app i lommen på vores atleter, lynhurtigt.",
            attr: "Fysio Danmark Sport",
          },
          {
            kicker: "Klinik · webshop",
            title: "Sanne Andersen",
            body: "En klinik blev til en online forretning: webshop med betaling, online-booking, medlemskab og en digital Qi Gong-skole. Klar til at tjene penge fra dag ét.",
          },
          {
            kicker: "Klinik · platform",
            title: "Fysio Danmark Aalborg",
            body: "En komplet, driftsklar klinik-platform leveret samlet — booking, indhold og den daglige drift ét sted, så klinikken kan passe patienter i stedet for systemer.",
          },
        ],
      },
    },
    {
      kind: "method",
      data: {
        eyebrow: "Metoden",
        headingHtml: "Hvorfor så hurtigt? Fordi <em>maskinen bygger sig selv</em>.",
        lead: "Hver opgave følger samme spor — fra idé til live — drevet af AI-agenter og tjekket undervejs. Det er vores SDLC: en samlebåndsdisciplin for digital udvikling.",
        steps: [
          { label: "Idé" },
          { label: "Plan" },
          { label: "Opgavetavle" },
          { label: "AI-agent bygger" },
          { label: "Kvalitetstjek" },
          { label: "Live", live: true },
        ],
        cards: [
          {
            html: "<strong>Genbrug frem for gentænkning.</strong> Færdige byggeklodser betyder at det samme aldrig bygges to gange — derfor går det stærkt.",
          },
          {
            html: "<strong>Plan før kode.</strong> Hver opgave starter med en klar plan, så intet bygges i blinde — sporbart fra idé til levering.",
          },
          {
            html: "<strong>Tjekket før det går live.</strong> Med <em>Lens</em> — vores indbyggede kvalitetskontrol — åbnes hver side i en rigtig browser og tjekkes visuelt, så fejl fanges før brugerne ser dem.",
          },
        ],
      },
    },
    {
      kind: "insights",
      data: {
        eyebrow: "Indsigter",
        headingHtml: 'Tanker fra <em class="o">maskinrummet</em>.',
        lead: "Ugentlige nedslag om AI-native udvikling og automatisering — for builders, product managers og nysgerrige.",
        posts: [
          {
            tag: "Nyt",
            slug: "reuse-vs-reroll",
            category: "indsigter",
            title: 'Derfor er "reuse > re-roll" din hurtigste vej til produktion',
            excerpt: "Hvorfor genbrug af byggeklodser slår at bygge alt forfra — hver gang.",
          },
          {
            tag: "Nyt",
            slug: "ai-native-vs-ai-pyntet",
            category: "indsigter",
            title: "AI-native vs. AI-pyntet: hvad er forskellen?",
            excerpt: "De fleste apps får AI smurt udenpå. Få er bygget med AI i kernen.",
          },
          {
            tag: "Nyt",
            slug: "fra-ide-til-to-app-stores",
            category: "cases",
            title: "Fra idé til app i to app-stores — uden et native-team",
            excerpt: "Et kig bag kulissen på hvordan Fysio Danmark Sport blev til.",
          },
        ],
      },
    },
    {
      kind: "about",
      data: {
        eyebrow: "Om",
        headingHtml: 'Softwarearkitekt.<br>Digital pioner. <em class="o">AI-builder</em>.',
        leadHtml:
          "Christian Broberg grundlagde <strong>WebHouse</strong> i Aalborg i <strong>1995</strong> — da ingen vidste hvad en hjemmeside var. Lige siden har han bygget digitale platforme for kunder på fem kontinenter. I dag bygger han AI-native platforme: et CMS der skriver sit eget indhold, en videnmotor der samler ekspertise, og et orkestrationssystem der styrer 15+ AI-medarbejdere på én gang.",
        pills: [
          "MCP-servere",
          "Agent Swarm",
          "Knowledge Management",
          "Second Brain",
          "AI chat-platforme",
          "Machine Learning",
          "Text-to-Speech",
          "Vision",
          "CI/CD",
        ],
        clientsLabel: "Betroet gennem 30 år af bl.a.",
        clients: ["FIA", "Ole Lynggaard", "Lundbeck", "Grundfos", "COWI", "40+ kommuner"],
      },
    },
    {
      kind: "contact",
      data: {
        eyebrow: "Kontakt",
        headingHtml: 'Lad os bygge noget<br>der ikke fandtes <em class="o">i går</em>.',
        lead: "Et website, en platform, en AI-native løsning — leveret hurtigt og gennemtænkt. Skriv til os, så tager vi en snak.",
        email: "christian@broberg.ai",
      },
    },
  ],
};
