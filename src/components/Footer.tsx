import type { FooterData } from "@/content/types.ts";

export function Footer({ data }: { data: FooterData }) {
  return (
    <footer>
      <div class="wrap foot-grid">
        <div class="foot-brand">
          <div class="logo" style="font-size:17px">
            broberg<span class="ai">.ai</span>
          </div>
          <p>{data.tagline}</p>
        </div>
        {data.columns.map((col) => (
          <div class="foot-col" key={col.heading}>
            <div class="foot-col-h">{col.heading}</div>
            {col.links.map((l) => (
              <a href={l.href} key={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel={l.href.startsWith("http") ? "noopener" : undefined}>
                {l.label}
              </a>
            ))}
          </div>
        ))}
      </div>
      <div class="wrap foot-legal">© 2026 broberg.ai · Aalborg · Blokhus · Copenhagen · Build &amp; Powered by the broberg.ai universe.</div>
      {data.techTicker.length ? (
        <div class="foot-ticker">
          <div class="foot-ticker-track">
            {/* Real, focusable copy first; a second aria-hidden copy completes the
                seamless -50% loop without doubling every link in the tab order. */}
            {[false, true].map((hidden) => (
              <div class="foot-ticker-set" aria-hidden={hidden ? "true" : undefined} key={String(hidden)}>
                {data.techTicker.map((t, i) =>
                  t.href ? (
                    <a
                      class="foot-ticker-item foot-ticker-tag"
                      href={t.href}
                      key={i}
                      tabIndex={hidden ? -1 : undefined}
                      data-testid={hidden ? undefined : `foot-ticker-tag-${i}`}
                    >
                      {t.label}
                      <span class="foot-ticker-dot">·</span>
                    </a>
                  ) : (
                    <span class="foot-ticker-item" key={i}>
                      {t.label}
                      <span class="foot-ticker-dot">·</span>
                    </span>
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </footer>
  );
}
