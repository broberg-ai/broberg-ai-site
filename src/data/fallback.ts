/* THIN offline/dev skeleton ONLY. cms is the single source of all authored
   content (Christian's #1 non-negotiable). This renders solely when the local
   store is empty — i.e. a cold boot before backfill completes, or local dev
   without a read token. No marketing copy lives here; the real copy is in cms
   and editable there. */
import type { PageModel } from "@/content/types.ts";

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
        slides: [{ titleHtml: 'broberg<em class="o">.ai</em>', leadHtml: "Indholdet hentes fra cms." }],
        slidesLabel: "Budskaber",
      },
    },
  ],
};
