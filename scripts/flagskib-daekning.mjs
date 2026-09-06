#!/usr/bin/env bun
/**
 * Hvilke artikler er koblet til hvilke flagskibe — og hvor er hullerne?
 *
 * Koblingen sker på TAG eller LINK (se loadFlagshipArtikler). Dette script
 * viser desuden den TREDJE kategori: artikler der NÆVNER et flagskib uden at
 * være koblet til det. Den liste er ikke en fejlliste — de fleste omtaler er
 * netop kun omtaler — men det er dér man kigger hvis en side føles tom.
 *
 *   bun scripts/flagskib-daekning.mjs
 */
const BASE = "https://webhouse.app/api/cms";
const SITE = "broberg-ai";
const token = process.env.CMS_ADMIN_TOKEN;
if (!token) { console.error("CMS_ADMIN_TOKEN mangler — kør med .env indlæst"); process.exit(1); }

const hent = async (c) =>
  (await (await fetch(`${BASE}/${c}?site=${SITE}`, { headers: { Authorization: `Bearer ${token}` } })).json());

const slugify = (t) => String(t).toLowerCase().trim().replace(/[^a-z0-9æøå]+/g, "-").replace(/^-+|-+$/g, "");

const [platforms, posts] = await Promise.all([hent("platforms"), hent("posts")]);
const flagskibe = platforms
  .filter((p) => !String(p.slug).startsWith("en-"))
  .sort((a, b) => (a.data?.order ?? 99) - (b.data?.order ?? 99));
const udgivne = posts.filter((p) => p.status === "published");

let ialt = 0, huller = 0;
console.log(`\n${"flagskib".padEnd(14)} ${"tag".padStart(4)} ${"link".padStart(5)} ${"i alt".padStart(6)}   nævnt-men-ikke-koblet`);
console.log("─".repeat(78));

for (const f of flagskibe) {
  const n = String(f.slug).toLowerCase();
  const navn = f.data?.name ?? n;
  const linkRe = new RegExp(`\\]\\((?:/en)?/(?:flagskibe|flagships)/${n}(?:[)/#?]|$)`);
  const ordRe = new RegExp(`(?<![a-zæøå-])${n.replace(/-/g, "[- ]?")}(?![a-zæøå-])`, "i");

  const tag = [], link = [], kun_naevnt = [];
  for (const p of udgivne) {
    const d = p.data ?? {};
    const erTag = (d.tags ?? []).some((t) => slugify(t) === n);
    const erLink = linkRe.test(d.content ?? "");
    if (erTag) tag.push(p.slug);
    else if (erLink) link.push(p.slug);
    else if (ordRe.test(`${d.title ?? ""} ${d.content ?? ""}`)) kun_naevnt.push(p.slug);
  }
  const sum = tag.length + link.length;
  ialt += sum;
  if (sum === 0 && kun_naevnt.length) huller++;
  const flag = sum === 0 && kun_naevnt.length ? " ←" : "";
  console.log(
    `${String(navn).padEnd(14)} ${String(tag.length).padStart(4)} ${String(link.length).padStart(5)} ${String(sum).padStart(6)}   ${kun_naevnt.length}${flag}`,
  );
  if (kun_naevnt.length && sum === 0) console.log(`${" ".repeat(16)}${kun_naevnt.slice(0, 5).join(", ")}`);
}

console.log("─".repeat(78));
console.log(`${ialt} koblinger · ${huller} flagskib(e) uden én eneste, men nævnt et sted`);
console.log(`\nEn side får artikler ved at artiklen TAGGES med flagskibets slug`);
console.log(`eller LINKER til /flagskibe/<slug>. Begge tæller.\n`);
