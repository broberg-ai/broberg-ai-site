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
    </footer>
  );
}
