/**
 * Hvilke ordbogsord bliver FAKTISK ramt i vores artikler — og i hvilken stavemåde?
 *
 * ai-sdk's skarpe spørgsmål (11/9-2026), og det er et andet end det nemme:
 * ikke «hvor mange små bogstaver findes der», men «findes der et sted hvor
 * aliasset ville være FORKERT at anvende?». En optælling der normaliserer først,
 * kan ikke se det den leder efter — så her opgøres stavemåden SOM DEN STÅR.
 *
 * Matcheren er ai-sdk's egen, ordret fra src/providers/pronunciation.ts:
 *   (?<!\w)(alternation)(?!\w)   · case-insensitivt · længste først
 *   + et ord ved siden af en BINDESTREG får ikke sit alias
 *
 * Kør:  bun scripts/maal-udtale-varianter.ts
 */
import { tilTale, udtaleFor } from "@/aidan-laes.ts";

const token = process.env.CMS_ADMIN_TOKEN;
if (!token) {
  console.error("CMS_ADMIN_TOKEN mangler — porten kan ikke måle, og siger det frem for at melde grønt.");
  process.exit(1);
}

const svar = await fetch("https://webhouse.app/api/cms/posts?site=broberg-ai", {
  headers: { Authorization: `Bearer ${token}` },
});
const raa = await svar.json();
const docs: Record<string, any>[] = Array.isArray(raa) ? raa : (raa.documents ?? []);

interface Fund {
  ord: string;        // stavemåden SOM DEN STÅR
  post: string;       // ordbogspostens kanoniske form
  alias?: string;
  ipa?: string;
  bindestreg: boolean;
  artikel: string;
  klip: string;
}

const fund: Fund[] = [];
let artikler = 0;

for (const doc of docs) {
  const d = (doc.data ?? {}) as Record<string, unknown>;
  if (!d.content) continue;
  const locale = (doc.locale ?? d.locale ?? "da") === "en" ? "en" : "da";
  const titel = String(d.title ?? doc.slug).replace(/<[^>]+>/g, "").trim();
  const tale = tilTale([titel, String(d.excerpt ?? ""), String(d.content)].join("\n\n"));
  artikler++;

  const ordbog = udtaleFor(locale);
  const sorteret = [...ordbog].sort((a, b) => b.word.length - a.word.length);
  const alt = sorteret.map((o) => o.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const re = new RegExp(`(?<!\\w)(${alt})(?!\\w)`, "gi");

  for (const m of tale.matchAll(re)) {
    const i = m.index!;
    const post = sorteret.find((o) => o.word.toLowerCase() === m[0].toLowerCase())!;
    fund.push({
      ord: m[0],
      post: post.word,
      alias: post.alias,
      ipa: post.ipa,
      bindestreg: tale[i - 1] === "-" || tale[i + m[0].length] === "-",
      artikel: `${locale}:${doc.slug}`,
      klip: tale.slice(Math.max(0, i - 28), i + m[0].length + 28).replace(/\s+/g, " "),
    });
  }
}

const afvigende = fund.filter((f) => f.ord !== f.post);
const springes = fund.filter((f) => f.bindestreg);

console.log(`\n${artikler} artikler · ${fund.length} træf i alt`);
console.log(`  stavet ANDERLEDES end ordbogsposten: ${afvigende.length}`);
console.log(`  springes over (bindestreg ved siden af): ${springes.length}`);

console.log("\n── pr. post: kanonisk / afvigende / sprunget over ──");
const perPost = new Map<string, Fund[]>();
for (const f of fund) (perPost.get(f.post) ?? perPost.set(f.post, []).get(f.post)!).push(f);
for (const [post, liste] of [...perPost].sort((a, b) => b[1].length - a[1].length)) {
  const a = liste.filter((f) => f.ord !== f.post).length;
  const b = liste.filter((f) => f.bindestreg).length;
  const type = liste[0]!.alias ? `alias «${liste[0]!.alias}»` : "ipa";
  console.log(`  ${post.padEnd(20)} ${String(liste.length).padStart(4)}  afvigende:${String(a).padStart(3)}  sprunget:${String(b).padStart(3)}  ${type}`);
}

if (afvigende.length) {
  console.log("\n── DE FOREKOMSTER HVOR EN FEJL KAN GEMME SIG ──");
  console.log("   (stavet anderledes end posten — altså ramt af case-flaget)");
  for (const f of afvigende) {
    console.log(`  «${f.ord}» (post: ${f.post}${f.alias ? ` → «${f.alias}»` : " · ipa"})${f.bindestreg ? " [sprunget: bindestreg]" : ""}`);
    console.log(`      ${f.artikel}: …${f.klip}…`);
  }
} else {
  console.log("\nIngen forekomster afviger fra ordbogens egen stavemåde.");
}
