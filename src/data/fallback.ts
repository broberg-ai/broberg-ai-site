/* THIN offline/dev skeleton ONLY. cms is the single source of all authored
   content (Christian's #1 non-negotiable). This renders solely when the local
   store is empty — i.e. a cold boot before backfill completes, or local dev
   without a read token. No marketing copy lives here; the real copy is in cms
   and editable there. */
import type { PageModel } from "@/content/types.ts";

// Live-pill feed = OUR fleet-activity aggregate (placeholder until the live feed
// is wired). This is widget demo data, NOT authored cms content.
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
  title: "broberg.ai",
  description: "broberg.ai",
  sections: [
    {
      kind: "hero",
      data: {
        eyebrow: "broberg.ai",
        titleHtml: 'broberg<em class="o">.ai</em>',
        leadHtml: "Indholdet hentes fra cms.",
        ctas: [],
        stats: [],
        livePillLabel: "Live",
      },
    },
  ],
};
