/**
 * F024.4 — POST /api/bekraeft. Indløsningen, og kun den.
 *
 * Browseren kalder VORES rute frem for HelpDesks åbne rute direkte. Det koster
 * et ekstra led og køber to ting: vi ejer fejlteksterne (deres er engelske og
 * skrevet til en udvikler), og et svar kan ikke afgives ved at nogen henter en
 * URL — det kræver et POST med en krop, hvilket en mailscanner ikke laver.
 */
import type { Context } from "hono";
import { indloes, type Afvist } from "@/bekraeftelse.ts";

/** F024.4 — så «folk bekræfter faktisk» kan læses som et tal frem for en
 *  påstand. `nej` tælles for sig: det er signalet der gør supporten bedre, og
 *  et samlet «bekræftet» ville skjule det. */
export const bekraeftTaeller = { ja: 0, nej: 0, afvist: 0 };

export async function handleBekraeft(c: Context): Promise<Response> {
  const krop = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const token = String(krop.token ?? "").trim();
  const svar = String(krop.svar ?? "");

  // Hvidliste, ikke sortliste: et ukendt udfald må ikke nå deres API og blive
  // gemt som noget vi ikke kan gøre op bagefter.
  if (!token || (svar !== "solved" && svar !== "not_solved")) {
    return c.json({ ok: false, grund: "ugyldig" as const }, 400);
  }

  const r = await indloes(token, svar);
  if (!r.ok) {
    bekraeftTaeller.afvist++;
    return c.json({ ok: false, grund: (r.grund ?? "ukendt-grund") as Afvist }, 409);
  }
  if (svar === "solved") bekraeftTaeller.ja++;
  else bekraeftTaeller.nej++;
  return c.json({ ok: true });
}
