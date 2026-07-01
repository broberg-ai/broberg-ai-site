// Locale + slug routing. DA is canonical at the root; EN lives under /en/.
// The flagships path SEGMENT is mapped here (/flagskibe ↔ /en/flagships) —
// urlPrefix /flagskibe in cms is metadata only (intercom #59.6).
//
// NOTE (cms #59.6): item slugs are PER-LOCALE and DIFFERENT (om-os ↔ about-us),
// linked by a shared translationGroup UUID — NOT the same slug with a prefix.
// So a detail route resolves the doc by its own locale's slug; the twin is found
// by matching translationGroup across locales (wired when cms content lands).
import { DEFAULT_LOCALE, type Locale } from "@/config.ts";

export function splitLocale(pathname: string): { locale: Locale; rest: string } {
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const rest = pathname.slice(3) || "/";
    return { locale: "en", rest };
  }
  return { locale: DEFAULT_LOCALE, rest: pathname };
}

// Localized first path segment for the flagships section.
export const SEGMENTS = {
  flagships: { da: "flagskibe", en: "flagships" },
} as const;

export function flagshipsSegment(locale: Locale): string {
  return SEGMENTS.flagships[locale];
}

export function withLocale(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return locale === "en" ? `/en${clean === "/" ? "" : clean}` : clean;
}

// URL-safe tag slug (kept lowercase Danish, no transliteration) — a leaf
// utility so both content/compose.ts and components (FlagshipSlides.tsx)
// can import it without a circular dependency between the two.
export function slugifyTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9æøå]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
