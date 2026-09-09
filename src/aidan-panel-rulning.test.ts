/* F018.14 — panelet må aldrig kunne ende rullet ud af sit eget udsnit. */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("./styles/brand.css", import.meta.url), "utf8");
const enhance = readFileSync(new URL("./client/enhance.ts", import.meta.url), "utf8");

function blok(kilde: string, start: string): string {
  const i = kilde.indexOf(start);
  if (i < 0) return "";
  const j = kilde.indexOf("}", i);
  return j < 0 ? "" : kilde.slice(i, j);
}

describe("layoutet kan ikke blive højere end panelet", () => {
  it(".aidan-msgs har min-height: 0", () => {
    // UDEN den nægter flex-elementet at krympe under sit eget indhold, og
    // kolonnen bliver højere end panelet (målt 1115 mod 578 px på produktion).
    const b = blok(css, ".aidan-msgs {");
    expect(b, ".aidan-msgs findes ikke").not.toBe("");
    expect(b, "min-height: 0 mangler — flexbox-fælden er åben igen").toMatch(/min-height:\s*0\s*;/);
    expect(b, "kassen skal stadig rulle indeni").toMatch(/overflow-y:\s*auto/);
  });

  it("panelet klipper stadig — det er dét der gør en rulning uoprettelig", () => {
    expect(blok(css, ".aidan-panel {")).toMatch(/overflow:\s*hidden/);
  });
});

describe("og en rulning kan ikke overleve", () => {
  it("panelet har en scroll-vagt der sætter scrollTop tilbage til 0", () => {
    expect(enhance, "ingen scroll-lytter på panelet").toContain('panel.addEventListener("scroll"');
    expect(enhance, "vagten sætter ikke scrollTop tilbage").toMatch(/panel\.scrollTop\s*!==\s*0\)\s*panel\.scrollTop\s*=\s*0/);
  });
});
