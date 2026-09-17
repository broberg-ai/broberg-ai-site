/**
 * F024.10 — de to ruter: én at LYTTE på, én at SKRIVE fra.
 */
import type { Context } from "hono";
import { lyt, udsend, liveKonfigureret, liveTaeller, antalLyttere } from "@/live-bus.ts";

/** GET /api/live/:ref — SSE. Den besøgendes chat holder denne åben. */
export function handleLiveStream(c: Context): Response {
  const ref = c.req.param("ref");
  if (!ref) return c.json({ ok: false }, 400);

  const strøm = new ReadableStream({
    start(styring) {
      const enc = new TextEncoder();
      const skriv = (d: unknown) => {
        try { styring.enqueue(enc.encode(`data: ${JSON.stringify(d)}\n\n`)); } catch { /* lukket */ }
      };
      // Første besked siger at forbindelsen STÅR. Uden den kan «ingen svarede»
      // ikke skelnes fra «vi kom aldrig igennem» — og det er den skelnen hele
      // prøven findes for at afgøre.
      skriv({ type: "klar", ref });

      const afmeld = lyt(ref, (b) => skriv({ type: "besked", ...b }));

      // Et hjerteslag holder forbindelsen i live gennem proxyer der lukker en
      // tavs strøm. Uden det dør den efter ~60s uden at nogen kan se hvorfor.
      const puls = setInterval(() => skriv({ type: "puls", tid: Date.now() }), 25_000);

      c.req.raw.signal.addEventListener("abort", () => {
        clearInterval(puls);
        afmeld();
        try { styring.close(); } catch { /* allerede lukket */ }
      });
    },
  });

  return new Response(strøm, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Fly/Nginx buffrer ellers strømmen og beskeden kommer i klumper.
      "X-Accel-Buffering": "no",
    },
  });
}

/** POST /api/live/:ref — skriv til en sags kanal. LUKKET uden hemmeligheden. */
export async function handleLiveSend(c: Context): Promise<Response> {
  if (!liveKonfigureret()) return c.json({ ok: false, fejl: "ikke_konfigureret" }, 503);

  const token = c.req.header("x-live-token") ?? "";
  if (token !== process.env.LIVE_TEST_TOKEN) {
    liveTaeller.afvistToken++;
    return c.json({ ok: false, fejl: "token" }, 401);
  }

  const ref = c.req.param("ref");
  const krop = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const tekst = String(krop.tekst ?? "").trim();
  if (!ref || !tekst) return c.json({ ok: false, fejl: "ref_og_tekst_kraeves" }, 400);

  const naaede = udsend(ref, {
    fra: String(krop.fra ?? "").trim() || "Support",
    tekst,
    tid: Date.now(),
  });

  // SVARET SIGER HVOR MANGE DER FIK DEN. «ok» alene ville ikke kunne skelne
  // «sendt til hendes åbne fane» fra «sendt ud i ingenting fordi hun lukkede».
  return c.json({ ok: true, naaede, lyttere: antalLyttere(ref) });
}
