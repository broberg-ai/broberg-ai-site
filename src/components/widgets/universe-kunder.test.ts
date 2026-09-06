import { describe, test as it, expect } from "bun:test";
import { kundePladser, vaelgKunder, vaelgNoder, ringPladser, egeLinjer, CUST_MAX, INFRA_MAX, INFRA_R } from "./UniverseDiagram.tsx";
import type { DiagramNode } from "@/content/types.ts";

/**
 * En kunde må ALDRIG forsvinde tavst fra universet.
 *
 * Kundepladserne var en fast liste på FIRE, og diagrammet render'ede
 * `CUSTOMER_SLOTS.map(...)` — altså én node pr. PLADS, ikke pr. kunde. Da ejeren
 * bad om en femte (FD Sundhed) 6/9-2026, ville den femte være blevet skrevet i
 * CMS'et, gemt korrekt, og aldrig vist. Intet ville have fejlet: ingen advarsel,
 * intet hul i ringen, bare fire planeter som altid.
 *
 * Det er husets gennemgående fejlform — den grønne retning er den tavse — så den
 * forsegles her frem for at blive fanget af at nogen tæller prikker på skærmen.
 */
const kunder = (n: number): DiagramNode[] =>
  Array.from({ length: n }, (_, i) => ({ label: `kunde-${i}`, scroll: "cases" }));

describe("universets kundering", () => {
  it("giver plads til præcis så mange kunder som der er", () => {
    for (const n of [1, 2, 4, 5, 6, CUST_MAX]) {
      expect(kundePladser(n)).toHaveLength(n);
      expect(vaelgKunder(kunder(n))).toHaveLength(n);
    }
  });

  it("taber ingen kunde op til grænsen — og bevarer rækkefølgen", () => {
    const ind = kunder(CUST_MAX);
    expect(vaelgKunder(ind).map((k) => k.label)).toEqual(ind.map((k) => k.label));
  });

  it("den femte kunde FÅR en plads (den fejl testen findes for)", () => {
    const femte = vaelgKunder(kunder(5))[4];
    expect(femte).toBeDefined();
    expect(kundePladser(5)[4]).toBeDefined();
  });

  it("over grænsen vises et tilfældigt udsnit — aldrig flere end der er plads til", () => {
    const ind = kunder(CUST_MAX + 7);
    const vist = vaelgKunder(ind);
    expect(vist).toHaveLength(CUST_MAX);
    // hver vist kunde er en ægte kunde, og ingen går igen
    const labels = vist.map((k) => k.label);
    expect(new Set(labels).size).toBe(CUST_MAX);
    for (const l of labels) expect(ind.some((k) => k.label === l)).toBe(true);
  });

  it("udsnittet skifter mellem visninger, så ingen er permanent usynlig", () => {
    const ind = kunder(CUST_MAX + 7);
    const set = new Set<string>();
    for (let i = 0; i < 40; i++) set.add(vaelgKunder(ind).map((k) => k.label).join(","));
    expect(set.size).toBeGreaterThan(1);
  });

  it("pladserne ligger på kundernes egen ring, jævnt fordelt", () => {
    const pladser = kundePladser(5);
    const radier = pladser.map((p) => Math.hypot(p.cx - 220, p.cy - 220));
    for (const r of radier) expect(Math.abs(r - 195)).toBeLessThanOrEqual(1);
    // vinklerne skal være 72° fra hinanden (360/5)
    const vinkler = pladser.map((p) => (Math.atan2(p.cx - 220, 220 - p.cy) * 180) / Math.PI);
    for (let i = 1; i < vinkler.length; i++) {
      const d = ((vinkler[i]! - vinkler[i - 1]! + 360) % 360);
      expect(Math.abs(d - 72)).toBeLessThan(1);
    }
  });

  it("etiketten står over noden i toppen og under den i bunden", () => {
    for (const p of kundePladser(6)) {
      if (p.cy < 220) expect(p.ty).toBeLessThan(p.cy);
      else expect(p.ty).toBeGreaterThan(p.cy);
    }
  });
});

/**
 * Motorernes ring havde nøjagtig samme fejl som kunderingen, og den var
 * STØRRE: en fast liste på syv pladser mens CMS'et holdt 13 platforme, så seks
 * af dem — cardmem, buddy, cms, components, ai-sdk, consulting — aldrig blev
 * tegnet. Ejeren bad 6/9 om at få «upmetrics» med; den var bare den ene han
 * lagde mærke til.
 */
describe("universets motorring", () => {
  it("giver plads til alle 13 platforme der ligger i CMS'et", () => {
    expect(ringPladser(13, INFRA_R, 0)).toHaveLength(13);
    expect(vaelgNoder(kunder(13), INFRA_MAX)).toHaveLength(13);
  });

  it("taber ingen platform op til grænsen", () => {
    const ind = kunder(INFRA_MAX);
    expect(vaelgNoder(ind, INFRA_MAX).map((k) => k.label)).toEqual(ind.map((k) => k.label));
  });

  it("der er præcis én ege pr. node — aldrig en ege der peger på ingenting", () => {
    for (const n of [3, 7, 13]) {
      expect(egeLinjer(n, 0)).toHaveLength(ringPladser(n, INFRA_R, 0).length);
    }
  });

  it("hver ege peger UD mod sin egen node, fra kernen og næsten til prikken", () => {
    const n = 9;
    const eger = egeLinjer(n, 0);
    const noder = ringPladser(n, INFRA_R, 0);
    eger.forEach((e, i) => {
      const nodeVinkel = Math.atan2(noder[i]!.cx - 220, 220 - noder[i]!.cy);
      const egeVinkel = Math.atan2(e.x2 - 220, 220 - e.y2);
      expect(Math.abs(nodeVinkel - egeVinkel)).toBeLessThan(0.02);
      // starter uden for kernen (r=40) og stopper lige før prikken
      expect(Math.hypot(e.x1 - 220, e.y1 - 220)).toBeCloseTo(40, 0);
      expect(Math.hypot(e.x2 - 220, e.y2 - 220)).toBeCloseTo(INFRA_R - 8, 0);
    });
  });

  it("motorerne ligger inden for kundernes ring, så de to ikke blandes", () => {
    for (const p of ringPladser(13, INFRA_R, 0)) {
      expect(Math.hypot(p.cx - 220, p.cy - 220)).toBeLessThan(195 - 17);
    }
  });
});
