import { erAlleredeSendt, noterSendt } from "@/trail-sendt.ts";

/* Trail-klip — ÉN kilde til «side → markdown → KB» (F007).
 *
 * Deles af scripts/trail-sync.mjs (fuld re-sync af sitemappet) og
 * src/trail-push.ts (det faste job: udgiv i CMS → siden pushes automatisk).
 * To kopier af rensningen ville drive fra hinanden første gang én blev rettet.
 */

/** HTML → læsbar markdown-agtig tekst. Bevidst simpel: overskrifter, afsnit,
 *  lister og links overlever; alt chrome (nav/footer/scripts/Aidan) ryger. */
/**
 * Gør «>» inde i en attributværdi harmløs, FØR nogen af reglerne nedenfor
 * leder efter enden på en tag.
 *
 * Alle tag-reglerne herunder er skrevet som `[^>]*>` — de standser ved det
 * FØRSTE «>». Et «>» i en attributværdi er lovlig HTML, og så klipper de midt
 * i taggen og efterlader resten af attributten som brødtekst. Målt 6/9-2026:
 * artiklens `data-cms-slice` (2.988 tegn, inline-editorens kilde) indeholdt to
 * «>», og resterne — `">` og `cardmem</a>.` — endte i vidensbasen mellem
 * artiklens sætninger. Rapporteret af trail-sessionen.
 *
 * En scanner frem for en regex, fordi «hvor slutter denne tag» ikke kan
 * afgøres uden at holde styr på om man står inde i et citat.
 */
export function beskytTagGraenser(html: string): string {
  let ud = "";
  let i = 0;
  while (i < html.length) {
    const start = html.indexOf("<", i);
    if (start === -1) {
      ud += html.slice(i);
      break;
    }
    ud += html.slice(i, start);
    let j = start + 1;
    let citat: string | null = null;
    let tag = "<";
    while (j < html.length) {
      const c = html[j]!;
      if (citat) {
        tag += c === ">" ? "&gt;" : c;
        if (c === citat) citat = null;
      } else if (c === '"' || c === "'") {
        citat = c;
        tag += c;
      } else if (c === ">") {
        tag += ">";
        j++;
        break;
      } else {
        tag += c;
      }
      j++;
    }
    ud += tag;
    i = j;
  }
  return ud;
}

export function tilTekst(html: string): string {
  let s = beskytTagGraenser(html)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    // SIDENS KROM ER IKKE ARTIKLEN. Featured-båndet og -boksen viser ANDRE
    // siders titler, så de ændrer sig hver gang en HVILKEN SOM HELST artikel
    // featurees — og siden rotationen (F008.3) også ved hver sidevisning.
    // Målt 6/9-2026: det gjorde 39 artikler til 90 sider i KB'en, hver med sin
    // egen kompilering, så et spørgsmål kunne få tre forskellige svar.
    // En artikels tekst i vidensbasen skal være ARTIKLEN og intet andet.
    .replace(/<div class="f-baand"[\s\S]*?<\/div>\s*(?=<)/gi, "")
    .replace(/<div[^>]*data-testid="featured-baand"[\s\S]*?<\/div>\s*(?=<)/gi, "")
    .replace(/<section[^>]*data-testid="featured-boks"[\s\S]*?<\/section>/gi, "")
    .replace(/<div id="aidan"[\s\S]*$/i, "");
  const main = /<main[\s\S]*?<\/main>/i.exec(s);
  if (main) s = main[0];
  return s
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n- $1")
    .replace(/<a [^>]*href="(\/[^"]*|https:\/\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
    .replace(/<(p|br|div|section|article|tr|ul|ol)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Side-URL → filnavn i KB'en (stabilt: samme side = samme navn). */
export function trailFilnavn(url: string): string {
  const p = new URL(url).pathname.replace(/\/$/, "") || "/forside";
  return p.replace(/^\//, "").replace(/[^a-zA-Z0-9æøåÆØÅ-]+/g, "_") + ".md";
}

function auth(): { token: string; kb: string; tenant: string } | null {
  const token = process.env.TRAIL_TOKEN;
  const kb = process.env.TRAIL_KB;
  if (!token || !kb) return null;
  return { token, kb, tenant: process.env.TRAIL_TENANT ?? "broberg-ai" };
}

const API = () => process.env.TRAIL_API ?? "https://app.trailmem.com/api/v1";

/** Har KB'en allerede et dokument for denne side? Bruges som dublet-spærre
 *  indtil trails upsert-på-sourceUrl (deres F243.1) er live — derefter kan
 *  spærren fjernes og et gen-push blive en opdatering. */
export async function trailHarSide(sourceUrl: string): Promise<boolean> {
  const a = auth();
  if (!a) return false;
  const res = await fetch(
    `${API()}/knowledge-bases/${encodeURIComponent(a.kb)}/search?q=${encodeURIComponent(`Kilde: ${sourceUrl}`)}&limit=5`,
    { headers: { authorization: `Bearer ${a.token}`, "x-trail-tenant": a.tenant } },
  );
  if (!res.ok) return false;
  const data = (await res.json()) as { documents?: Array<{ content?: string; highlight?: string }> };
  return (data.documents ?? []).some((d) =>
    String(d.content ?? d.highlight ?? "").includes(`Kilde: ${sourceUrl}`),
  );
}

/** Upload én side (markdown) til KB'en. Kaster ved fejl — kalderen afgør om
 *  det er et log-og-videre (det faste job) eller en rød kørsel (sync-scriptet). */
export async function trailUploadSide(md: string, sourceUrl: string): Promise<"sendt" | "uaendret"> {
  const a = auth();
  if (!a) throw new Error("TRAIL_TOKEN/TRAIL_KB er ikke sat");
  // VORES EGEN SPÆRRE, før noget forlader huset. Vi stolede før på at Trail
  // afviste dubletten; da deres indgang holdt op med det, blev 39 artikler til
  // 90 sider. En spærre hos modtageren er ikke vores spærre. Se trail-sendt.ts.
  if (erAlleredeSendt(sourceUrl, md)) return "uaendret";
  const form = new FormData();
  form.set("file", new File([md], trailFilnavn(sourceUrl), { type: "text/markdown" }));
  form.set("path", "/broberg-ai-site");
  form.set("metadata", JSON.stringify({ connector: "broberg-ai-site-sync", sourceUrl }));
  // ?localCompile=true — «local ingest» (Christians ordre 4/9): kilden gemmes
  // identisk men PARKERES til gratis kompilering på Max-planen i stedet for
  // betalt sky-kompilering (~20¢/kilde). Målt konsekvens af at mangle flaget:
  // de første 169 kilder kørte betalt (~$35) — det må aldrig ske igen.
  const res = await fetch(`${API()}/knowledge-bases/${encodeURIComponent(a.kb)}/documents/upload?localCompile=true`, {
    method: "POST",
    headers: { authorization: `Bearer ${a.token}`, "x-trail-tenant": a.tenant },
    body: form,
  });
  if (res.status === 409) {
    // Trails egen indholds-hash-spærre: NØJAGTIG samme indhold findes allerede.
    // Målt live 4/9 (gen-udgivelse uden tekstændring → 409 duplicate_source).
    // Det er jobbets FORVENTEDE udfald for en uændret side — ikke en fejl.
    noterSendt(sourceUrl, md); // KB'en HAR det — husk det, så vi ikke spørger igen
    return "uaendret";
  }
  if (!res.ok) throw new Error(`trail-upload ${res.status}: ${(await res.text()).slice(0, 200)}`);
  // F243.1 (trails upsert-på-sourceUrl, live 4/9): 200 kan nu betyde
  // «uændret» (nul skrivninger) eller «opdateret» (samme dokument, version+1).
  const krop = await res.json().catch(() => ({}));
  noterSendt(sourceUrl, md);
  if (krop?.upsert === "unchanged") return "uaendret";
  return "sendt";
}
