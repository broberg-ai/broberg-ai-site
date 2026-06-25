/* The universe diagram: a pulsing cardmem core with infra engines (blue) and
   customer solutions (orange) orbiting it. The two rings orbit at different
   speeds (infra slow, customers a bit faster — CSS in brand.css), the signal
   spokes + dashed rings pulse, and every node is a clickable link. Labels
   counter-rotate so they stay upright while orbiting. Geometry + motion are in
   code; all TEXT (core / infra[] / customers[]) comes from cms. */
import type { JSX } from "preact";
import type { DiagramNode } from "@/content/types.ts";

// Fixed start positions (≈ a ring around the centre); the orbit animation
// rotates the whole group around 220,220. Labels are zipped on in order.
const INFRA_SLOTS = [
  { cx: 220, cy: 88, tx: 220, ty: 72 },
  { cx: 340, cy: 160, tx: 340, ty: 143 },
  { cx: 340, cy: 280, tx: 340, ty: 299 },
  { cx: 220, cy: 352, tx: 220, ty: 370 },
  { cx: 100, cy: 280, tx: 100, ty: 299 },
  { cx: 100, cy: 160, tx: 100, ty: 143 },
];
const CUSTOMER_SLOTS = [
  { cx: 316, cy: 74, tx: 330, ty: 62 },
  { cx: 392, cy: 336, tx: 380, ty: 354 },
  { cx: 48, cy: 336, tx: 60, ty: 354 },
  { cx: 112, cy: 62, tx: 108, ty: 50 },
];

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function NodeLink({ node, testid, children }: { node: DiagramNode; testid: string; children: JSX.Element[] }) {
  const ext = !!node.href && /^https?:/.test(node.href);
  const attrs: Record<string, string> = { class: "unode", "data-testid": testid };
  if (node.scroll) attrs["data-scroll"] = node.scroll;
  else if (node.href) {
    attrs.href = node.href;
    if (ext) {
      attrs.target = "_blank";
      attrs.rel = "noopener";
    }
  }
  return <a {...attrs}>{children}</a>;
}

export function UniverseDiagram({
  core,
  infra,
  customers,
}: {
  core: string;
  infra: DiagramNode[];
  customers: DiagramNode[];
}) {
  return (
    <svg
      class="svg-wrap"
      viewBox="0 0 440 440"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="broberg.ai-universet"
    >
      <defs>
        <radialGradient id="ug" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#00b2ff" stop-opacity=".22" />
          <stop offset="70%" stop-color="#00b2ff" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx="220" cy="220" r="210" fill="url(#ug)" />

      {/* Static orbit guides — the dashed ones pulse. */}
      <circle class="ring" cx="220" cy="220" r="80" stroke="rgba(0,178,255,.25)" stroke-width="1" fill="none" />
      <circle
        class="ring"
        style="animation-delay:.6s"
        cx="220"
        cy="220"
        r="135"
        stroke="rgba(0,178,255,.16)"
        stroke-width="1"
        fill="none"
        stroke-dasharray="3 5"
      />
      <circle class="ring" cx="220" cy="220" r="195" stroke="rgba(243,82,44,.18)" stroke-width="1" fill="none" stroke-dasharray="2 7" />

      {/* Infra engines — slow orbit; spokes ride along + keep their dash pulse. */}
      <g class="orbit-infra" font-family="'DM Sans',sans-serif" font-size="9.5" fill="rgba(240,244,248,.85)" text-anchor="middle">
        <g class="signal" stroke="rgba(0,178,255,.3)" stroke-width="1.2">
          <line x1="220" y1="180" x2="220" y2="92" />
          <line x1="258" y1="202" x2="336" y2="163" />
          <line x1="258" y1="238" x2="336" y2="277" />
          <line x1="220" y1="260" x2="220" y2="348" />
          <line x1="182" y1="238" x2="104" y2="277" />
          <line x1="182" y1="202" x2="104" y2="163" />
        </g>
        {INFRA_SLOTS.map((s, i) => {
          const n = infra[i];
          if (!n) return null;
          return (
            <NodeLink key={i} node={n} testid={`universe-node-${slugify(n.label)}`}>
              <circle cx={s.cx} cy={s.cy} r="16" fill="transparent" pointer-events="all" />
              <circle class="planet" cx={s.cx} cy={s.cy} r="5" fill="#00b2ff" />
              <text class="lbl" x={s.tx} y={s.ty}>
                {n.label}
              </text>
            </NodeLink>
          );
        })}
      </g>

      {/* Customer solutions — a bit faster orbit. */}
      <g class="orbit-cust" font-family="'DM Sans',sans-serif" font-size="8.5" fill="rgba(240,244,248,.6)" text-anchor="middle">
        {CUSTOMER_SLOTS.map((s, i) => {
          const n = customers[i];
          if (!n) return null;
          return (
            <NodeLink key={i} node={n} testid={`universe-node-${slugify(n.label)}`}>
              <circle cx={s.cx} cy={s.cy} r="14" fill="transparent" pointer-events="all" />
              <circle class="planet" cx={s.cx} cy={s.cy} r="4" fill="#F3522C" />
              <text class="lbl" x={s.tx} y={s.ty}>
                {n.label}
              </text>
            </NodeLink>
          );
        })}
      </g>

      {/* Core — on top, does not orbit. */}
      <circle class="pulse-core" cx="220" cy="220" r="40" fill="rgba(0,178,255,.12)" stroke="#00b2ff" stroke-width="1.5" />
      <text x="220" y="225" text-anchor="middle" font-family="'DM Sans',sans-serif" font-size="14" font-weight="600" fill="#f0f4f8">
        {core}
      </text>
    </svg>
  );
}
