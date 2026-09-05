// Seglet på /llms.txt: den SKAL bygge på siteIndexGroups — den ene kilde som
// sitemap.xml og Indeks-siden også læser. En håndrullet liste i llms.ts er
// præcis den fejlklasse der gav sanneandersen en llms.txt med 47 af 130 sider.
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const read = (f: string) => readFileSync(new URL(`./${f}`, import.meta.url).pathname, "utf8");

test("llms.ts læser fra siteIndexGroups — samme kilde som sitemap.xml", () => {
  const src = read("llms.ts");
  expect(src).toContain('import { siteIndexGroups } from "@/routes.tsx"');
  expect(src).toContain("siteIndexGroups(locale)");
});

test("llms.ts har ingen egen håndskrevet sideliste", () => {
  const src = read("llms.ts");
  // En hardkodet sti (ud over rod-normaliseringen) ville være en list nr. 2.
  const hardcoded = src.match(/href:\s*"|"\/(losninger|solutions|nyheder|news|featured|tags|universet)/);
  expect(hardcoded).toBeNull();
});

test("/llms.txt er registreret som rute i server.tsx", () => {
  expect(read("server.tsx")).toContain('app.get("/llms.txt"');
});
