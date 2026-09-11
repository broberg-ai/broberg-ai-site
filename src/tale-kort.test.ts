/**
 * F019.2 — talen må ikke ændre sig, og kortet skal pege rigtigt.
 *
 * DEN UFRAVIGELIGE PRØVE ER DEN FØRSTE. Talen indgår i lyd-cachens nøgle
 * (sha256 over stemme + tale), så en forskel på ét mellemrum mellem den gamle
 * tilTale og den nye tilTaleMedKort ville gøre HVER ENESTE cachet lydfil
 * ugyldig — og sende hele arkivet gennem Azure igen. Regningen kommer stille,
 * og ingen ville koble den til denne fil.
 *
 * Derfor køres den mod de ÆGTE artikler i indholdslageret, ikke mod opfundne
 * strenge. Et opdigtet eksempel beviser at min forestilling om teksten
 * round-tripper; 59 rigtige artikler beviser noget om teksten.
 */
import { describe, it, expect } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { tilTale } from "@/aidan-laes.ts";
import { tilTaleMedKort, taleTilKilde } from "@/tale-kort.ts";

function artikler(): { slug: string; md: string }[] {
  const dir = new URL("../.content-store/posts/", import.meta.url).pathname;
  let navne: string[] = [];
  try { navne = readdirSync(dir).filter((n) => n.endsWith(".json")); } catch { return []; }
  const ud: { slug: string; md: string }[] = [];
  for (const n of navne) {
    const d = JSON.parse(readFileSync(dir + n, "utf8")) as { data?: { content?: unknown } };
    if (typeof d.data?.content === "string" && d.data.content.length > 200)
      ud.push({ slug: n.replace(/\.json$/, ""), md: d.data.content });
  }
  return ud;
}

describe("talen er uændret", () => {
  const alle = artikler();

  it("prøven har noget at måle på — ellers beviser den ingenting", () => {
    // En tom liste ville få hver eneste påstand nedenfor til at bestå.
    expect(alle.length).toBeGreaterThan(20);
  });

  it("BYTE-IDENTISK med tilTale på hver eneste artikel i lageret", () => {
    const afvigende: string[] = [];
    for (const { slug, md } of alle) {
      if (tilTaleMedKort(md).tale !== tilTale(md)) afvigende.push(slug);
    }
    expect(afvigende).toEqual([]);
  });

  it("kortet har præcis ét indeks pr. tegn i talen", () => {
    for (const { md } of alle.slice(0, 15)) {
      const k = tilTaleMedKort(md);
      expect(k.kilde.length).toBe(k.tale.length);
    }
  });
});

describe("kortet peger rigtigt", () => {
  it("et ord i talen findes på samme sted i kilden", () => {
    for (const { md } of artikler().slice(0, 10)) {
      const k = tilTaleMedKort(md);
      // Tag et ord midt i talen og slå det op i kilden gennem kortet.
      const m = /\b[a-zæøå]{6,}\b/i.exec(k.tale.slice(Math.floor(k.tale.length / 2)));
      if (!m) continue;
      const fra = Math.floor(k.tale.length / 2) + m.index;
      const omraade = taleTilKilde(k, fra, m[0].length)!;
      expect(md.slice(omraade.fra, omraade.til)).toContain(m[0]);
    }
  });

  it("indekserne er ikke-aftagende — talen løber forlæns gennem kilden", () => {
    // Et kort der hopper tilbage ville få markeringen til at springe op og ned
    // i artiklen, og det ville ligne et afspilningsproblem.
    for (const { md } of artikler().slice(0, 10)) {
      const { kilde } = tilTaleMedKort(md);
      for (let i = 1; i < kilde.length; i++) expect(kilde[i]!).toBeGreaterThanOrEqual(kilde[i - 1]!);
    }
  });

  it("KONTROL: et interval uden for talen giver null, ikke et tilfældigt ord", () => {
    const k = tilTaleMedKort("Helt almindelig tekst uden noget særligt i sig.");
    expect(taleTilKilde(k, -1, 4)).toBeNull();
    expect(taleTilKilde(k, 10, 0)).toBeNull();
    expect(taleTilKilde(k, 9999, 4)).toBeNull();
  });

  it("en forkortelse med bindestreg peger tilbage på HELE det oprindelige ord", () => {
    // «AI-agenter» bliver til «AI agenter» i talen: ét tegn mere, og ordet
    // starter ikke længere samme sted. Det er netop her et rent tal-offset
    // begynder at skride.
    const md = "Her taler vi om AI-agenter og hvad de gør.";
    const k = tilTaleMedKort(md);
    expect(k.tale).toContain("AI agenter");
    const fra = k.tale.indexOf("agenter");
    const omraade = taleTilKilde(k, fra, "agenter".length)!;
    expect(md.slice(omraade.fra, omraade.til)).toContain("agenter");
  });

  it("markdown-tegn forskyder ikke markeringen", () => {
    const md = "Dette er **meget vigtigt** at forstå.";
    const k = tilTaleMedKort(md);
    expect(k.tale).toBe("Dette er meget vigtigt at forstå.");
    const fra = k.tale.indexOf("vigtigt");
    const omraade = taleTilKilde(k, fra, "vigtigt".length)!;
    expect(md.slice(omraade.fra, omraade.til)).toBe("vigtigt");
  });

  it("et link peger på linkets TEKST, ikke på dets adresse", () => {
    const md = "Se [vores flagskibe](/flagskibe) for mere.";
    const k = tilTaleMedKort(md);
    expect(k.tale).toBe("Se vores flagskibe for mere.");
    const fra = k.tale.indexOf("flagskibe");
    const omraade = taleTilKilde(k, fra, "flagskibe".length)!;
    expect(md.slice(omraade.fra, omraade.til)).toBe("flagskibe");
  });
});
