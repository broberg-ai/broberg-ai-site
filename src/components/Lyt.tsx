import { cmsAttrs } from "@/components/sections.tsx";
import type { CmsRef } from "@/content/types.ts";

/**
 * F019.6 — «Lyt»-knappen i toppen af en artikel.
 *
 * Christian: «På broberg.ai — ikke i Aidan, men et sted i toppen af en side.»
 * Pladsen er linjen med forfatter og læsetid; det er dér Medium har den, og den
 * findes allerede på vores artikler.
 *
 * SKJULT INDTIL JS HAR FAT I DEN. En knap der ikke kan gøre noget er værre end
 * ingen knap — og oplæsningen ER javascript hele vejen. Derfor `hidden` i
 * markuppen og synlig først når enhance.ts har bundet den.
 *
 * AFSPILLEREN BYGGES I JS, ikke her. Den findes kun mens der spilles, og
 * teksterne den skal bruge følger med som data-attributter — så de kommer fra
 * CMS'et selvom elementet først opstår ved et klik.
 */
export interface LytTekster {
  knap: string;
  henter: string;
  fejl: string;
  afspil: string;
  pause: string;
  luk: string;
}

export function Lyt({ t, globalsRef }: { t: LytTekster; globalsRef?: CmsRef }) {
  return (
    <div
      class="lyt"
      data-testid="lyt"
      hidden
      data-henter={t.henter}
      data-fejl={t.fejl}
      data-afspil={t.afspil}
      data-pause={t.pause}
      data-luk={t.luk}
    >
      <button type="button" class="lyt-start" data-testid="lyt-knap">
        <span class="lyt-ikon" aria-hidden="true">▶</span>
        <span {...cmsAttrs(globalsRef, "lytKnap")}>{t.knap}</span>
      </button>
    </div>
  );
}
