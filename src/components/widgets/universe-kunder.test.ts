import { describe, test as it, expect } from "bun:test";
import { kundePladser, vaelgKunder, CUST_MAX } from "./UniverseDiagram.tsx";
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
