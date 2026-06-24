/* The universe diagram: a pulsing cardmem core, 6 infra nodes and 4 customer
   nodes orbiting it. Animation is CSS (.ring/.pulse-core/.node/.signal in
   brand.css); the labels come from cms (core / infra[] / customers[]) so the
   text is editable while the geometry + motion stay in code. */
import type { DiagramNode } from "@/content/types.ts";

// Fixed layout from mockup v6 — labels are zipped onto these slots in order.
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
      <circle cx="220" cy="220" r="195" stroke="rgba(243,82,44,.14)" stroke-width="1" fill="none" stroke-dasharray="2 7" />
      <g class="signal" stroke="rgba(0,178,255,.3)" stroke-width="1.2">
        <line x1="220" y1="180" x2="220" y2="92" />
        <line x1="258" y1="202" x2="336" y2="163" />
        <line x1="258" y1="238" x2="336" y2="277" />
        <line x1="220" y1="260" x2="220" y2="348" />
        <line x1="182" y1="238" x2="104" y2="277" />
        <line x1="182" y1="202" x2="104" y2="163" />
      </g>
      <circle class="pulse-core" cx="220" cy="220" r="40" fill="rgba(0,178,255,.12)" stroke="#00b2ff" stroke-width="1.5" />
      <text x="220" y="225" text-anchor="middle" font-family="DM Sans" font-size="14" font-weight="600" fill="#f0f4f8">
        {core}
      </text>
      <g font-family="DM Sans" font-size="9.5" fill="rgba(240,244,248,.85)" text-anchor="middle">
        {INFRA_SLOTS.map((s, i) => (
          <g key={i}>
            <circle class="node" cx={s.cx} cy={s.cy} r="5" fill="#00b2ff" />
            <text x={s.tx} y={s.ty}>
              {infra[i]?.label ?? ""}
            </text>
          </g>
        ))}
      </g>
      <g font-family="DM Sans" font-size="8.5" fill="rgba(240,244,248,.6)" text-anchor="middle">
        {CUSTOMER_SLOTS.map((s, i) => (
          <g key={i}>
            <circle class="node" cx={s.cx} cy={s.cy} r="4" fill="#F3522C" />
            <text x={s.tx} y={s.ty}>
              {customers[i]?.label ?? ""}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
