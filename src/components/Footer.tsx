import type { FooterData, CmsRef } from "@/content/types.ts";
import { cmsAttrs } from "@/components/sections.tsx";

// F157 — the footer is 100% globals-driven (footerTagline / footerColumns /
// techTicker), so `cmsRef` (the globals doc) makes every label inline-editable.
// loadFooter drops no entries (verified: no empty links/ticker words), so the
// rendered index equals the stored index — dot-paths address them directly.
export function Footer({ data, cmsRef }: { data: FooterData; cmsRef?: CmsRef }) {
  return (
    <footer>
      <div class="wrap foot-grid">
        <div class="foot-brand">
          <div class="logo" style="font-size:17px">
            broberg<span class="ai">.ai</span>
          </div>
          <p {...cmsAttrs(cmsRef, "footerTagline")}>{data.tagline}</p>
        </div>
        {data.columns.map((col, ci) => (
          <div class="foot-col" key={col.heading}>
            <div class="foot-col-h" {...cmsAttrs(cmsRef, `footerColumns.${ci}.heading`)}>{col.heading}</div>
            {col.links.map((l, li) => (
              <a href={l.href} key={l.href} data-testid={`footer-link-${ci}-${li}`} target={l.href.startsWith("http") ? "_blank" : undefined} rel={l.href.startsWith("http") ? "noopener" : undefined}>
                <span {...cmsAttrs(cmsRef, `footerColumns.${ci}.links.${li}.label`)}>{l.label}</span>
              </a>
            ))}
          </div>
        ))}
      </div>
      <div class="wrap foot-legal" {...cmsAttrs(cmsRef, "footerLegal")}>{data.legal}</div>
      {data.techTicker.length ? (
        <div class="foot-ticker">
          <div class="foot-ticker-track">
            {/* Real, focusable copy first; a second aria-hidden copy completes the
                seamless -50% loop without doubling every link in the tab order. */}
            {[false, true].map((hidden) => (
              <div class="foot-ticker-set" aria-hidden={hidden ? "true" : undefined} key={String(hidden)}>
                {data.techTicker.map((t, i) => {
                  // Wire only the visible copy — the aria-hidden duplicate must
                  // not carry a second data-cms-field for the same stored index.
                  const wire = hidden ? {} : cmsAttrs(cmsRef, `techTicker.${i}.label`);
                  return t.href ? (
                    <a
                      class="foot-ticker-item foot-ticker-tag"
                      href={t.href}
                      key={i}
                      tabIndex={hidden ? -1 : undefined}
                      data-testid={hidden ? undefined : `foot-ticker-tag-${i}`}
                    >
                      <span {...wire}>{t.label}</span>
                      <span class="foot-ticker-dot">·</span>
                    </a>
                  ) : (
                    <span class="foot-ticker-item" key={i}>
                      <span {...wire}>{t.label}</span>
                      <span class="foot-ticker-dot">·</span>
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </footer>
  );
}
