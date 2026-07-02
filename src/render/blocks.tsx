/* Block renderer — the one place that maps a section's `kind` to its component.
   When cms content is wired this stays the same; only the adapter that turns cms
   `sections` docs into SectionData changes. */
import type { SectionData } from "@/content/types.ts";
import { Hero, Universe, Platforms, Cases, Method, Insights, About, Contact } from "@/components/sections.tsx";

export function RenderSection({ section }: { section: SectionData }) {
  switch (section.kind) {
    case "hero":
      return <Hero data={section.data} cmsRef={section.cmsRef} />;
    case "universe":
      return <Universe data={section.data} cmsRef={section.cmsRef} />;
    case "platforms":
      return <Platforms data={section.data} cmsRef={section.cmsRef} />;
    case "cases":
      return <Cases data={section.data} cmsRef={section.cmsRef} />;
    case "method":
      return <Method data={section.data} cmsRef={section.cmsRef} />;
    case "insights":
      return <Insights data={section.data} cmsRef={section.cmsRef} />;
    case "about":
      return <About data={section.data} cmsRef={section.cmsRef} />;
    case "contact":
      return <Contact data={section.data} cmsRef={section.cmsRef} />;
    default:
      return null;
  }
}

export function RenderSections({ sections }: { sections: SectionData[] }) {
  return (
    <>
      {sections.map((s, i) => (
        <RenderSection key={i} section={s} />
      ))}
    </>
  );
}
