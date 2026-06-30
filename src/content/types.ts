// Internal page model the renderer consumes. cms documents (sections/platforms/
// cases/posts/...) are adapted INTO this shape; until cms content is wired, the
// fallback (mockup v6 copy) fills it. The block-renderer switches on Section.kind.
export type SectionKind =
  | "hero"
  | "universe"
  | "platforms"
  | "cases"
  | "method"
  | "insights"
  | "about"
  | "contact";

export interface Cta {
  label: string;
  href?: string;
  scroll?: string;
  testid: string;
  ghost?: boolean;
}

export interface Stat {
  target: number;
  label: string;
  pre?: string;
  suf?: string;
}

export interface HeroData {
  eyebrow: string;
  titleHtml: string; // allows the <em> accent from the mockup
  leadHtml: string;
  ctas: Cta[];
  stats: Stat[];
  livePillLabel: string;
}

export interface Tier {
  title: string;
  body: string;
}
export interface DiagramNode {
  label: string;
  href?: string;
  scroll?: string;
}
export interface UniverseData {
  eyebrow: string;
  headingHtml: string;
  lead: string;
  tiers: Tier[];
  core: string;
  infra: DiagramNode[];
  customers: DiagramNode[];
}

export interface Platform {
  name: string;
  logoKey: string;
  blurb: string;
  status: string;
}
export interface PlatformsData {
  eyebrow: string;
  heading: string;
  lead: string;
  items: Platform[];
  allLink: Cta;
  pathPrefix?: string;
}

export interface CaseItem {
  kicker: string;
  title: string;
  body: string;
  quote?: string;
  attr?: string;
  slug?: string;
  href?: string;
}
export interface CasesData {
  eyebrow: string;
  headingHtml: string;
  lead: string;
  items: CaseItem[];
  allLink?: Cta;
}

export interface MethodData {
  eyebrow: string;
  headingHtml: string;
  lead: string;
  steps: { label: string; live?: boolean }[];
  cards: { html: string }[];
}

export interface PostCard {
  tag: string;
  title: string;
  excerpt: string;
  slug: string;
  category: string;
  href: string;
}
export interface InsightsData {
  eyebrow: string;
  headingHtml: string;
  lead: string;
  posts: PostCard[];
}

export interface AboutData {
  eyebrow: string;
  headingHtml: string;
  leadHtml: string;
  image?: string; // cms globals.aboutImage (square portrait URL); falls back to b.-monogram
  pills: string[];
  clientsLabel: string;
  clients: string[];
}

export interface ContactData {
  eyebrow: string;
  headingHtml: string;
  lead: string;
  email: string;
}

export type SectionData =
  | { kind: "hero"; data: HeroData }
  | { kind: "universe"; data: UniverseData }
  | { kind: "platforms"; data: PlatformsData }
  | { kind: "cases"; data: CasesData }
  | { kind: "method"; data: MethodData }
  | { kind: "insights"; data: InsightsData }
  | { kind: "about"; data: AboutData }
  | { kind: "contact"; data: ContactData };

export interface PageModel {
  title: string;
  description: string;
  sections: SectionData[];
}
