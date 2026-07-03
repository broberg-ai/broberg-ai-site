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
  // Raw index into the universe section's `blocks` array (the view filters to
  // `_block:"tier"`, so the view index ≠ raw index) — for inline-edit paths.
  cmsIndex?: number;
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
  cmsRef?: CmsRef;
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
  // Each case maps to a `posts` doc (client/title/excerpt/quote), NOT the cases
  // section — so inline-edit targets the post, like insights cards do.
  cmsRef?: CmsRef;
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
  cmsRef?: CmsRef;
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
  formHref: string;
  ctaLabel: string;
}

export interface FooterLink {
  label: string;
  href: string;
}
export interface FooterColumn {
  heading: string;
  links: FooterLink[];
}
export interface TechTickerItem {
  label: string;
  href?: string; // set when the word matches a real site tag — links to /tags/:slug
}

export interface FooterData {
  tagline: string;
  columns: FooterColumn[];
  techTicker: TechTickerItem[];
}

// F157 — identifies the cms document a section's plain-text fields came from,
// for the inline-edit package's data-cms-collection/data-cms-slug attributes.
// Only threaded for section kinds enabled for inline editing (Phase 1: hero,
// about, contact) — undefined elsewhere, no behavior change.
export interface CmsRef {
  collection: string;
  slug: string;
  locale: string;
}

export type SectionData =
  | { kind: "hero"; data: HeroData; cmsRef?: CmsRef }
  | { kind: "universe"; data: UniverseData; cmsRef?: CmsRef }
  | { kind: "platforms"; data: PlatformsData; cmsRef?: CmsRef }
  | { kind: "cases"; data: CasesData; cmsRef?: CmsRef }
  | { kind: "method"; data: MethodData; cmsRef?: CmsRef }
  | { kind: "insights"; data: InsightsData; cmsRef?: CmsRef }
  | { kind: "about"; data: AboutData; cmsRef?: CmsRef }
  | { kind: "contact"; data: ContactData; cmsRef?: CmsRef };

export interface PageModel {
  title: string;
  description: string;
  sections: SectionData[];
}
