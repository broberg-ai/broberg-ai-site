/* Bespoke per-flagship illustrations — a context illustration that "nails" what
   each flagship page is about (Christian's design standard, cms #111). A visual
   family: dark canvas, blue #00b2ff line work, orange #F3522C accent, subtle
   CSS/SMIL motion, shared viewBox 0 0 360 280. Keyed on slug (a rendering asset
   like the logo — no cms field). cms supplies the 1-line concept; we build the SVG. */
import type { JSX } from "preact";

const wrap = (children: JSX.Element) => (
  <svg class="svg-wrap" viewBox="0 0 360 280" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
    {children}
  </svg>
);

// 3×3 assembled grid; two blocks snap in from a left stash ("reuse"), one green
// (atom nod) + one orange accent, two blocks glow. Nails: reuse > re-roll.
const components = wrap(
  <g>
    {/* left stash + flow arrow */}
    <g opacity=".55">
      <rect x="34" y="120" width="22" height="22" rx="6" fill="rgba(0,178,255,.10)" stroke="#00b2ff" stroke-width="1.4" />
      <rect x="42" y="134" width="22" height="22" rx="6" fill="rgba(0,178,255,.07)" stroke="#00b2ff" stroke-width="1.4" />
    </g>
    <path class="illu-flow" d="M72 138 H126" stroke="#F3522C" stroke-width="1.6" stroke-dasharray="3 5" />
    {/* assembled component */}
    <g stroke-width="1.8">
      <rect class="illu-snap" x="150" y="64" width="38" height="38" rx="9" fill="rgba(0,178,255,.14)" stroke="#00b2ff" />
      <rect x="196" y="64" width="38" height="38" rx="9" fill="rgba(0,178,255,.10)" stroke="#00b2ff" />
      <rect x="242" y="64" width="38" height="38" rx="9" fill="rgba(52,211,153,.14)" stroke="#34d399" />
      <rect x="150" y="110" width="38" height="38" rx="9" fill="rgba(0,178,255,.10)" stroke="#00b2ff" />
      <rect class="illu-glow" x="196" y="110" width="38" height="38" rx="9" fill="rgba(0,178,255,.18)" stroke="#40c8ff" />
      <rect x="242" y="110" width="38" height="38" rx="9" fill="rgba(0,178,255,.10)" stroke="#00b2ff" />
      <rect class="illu-snap d2" x="150" y="156" width="38" height="38" rx="9" fill="rgba(0,178,255,.14)" stroke="#00b2ff" />
      <rect x="196" y="156" width="38" height="38" rx="9" fill="rgba(243,82,44,.16)" stroke="#F3522C" />
      <rect class="illu-glow" style="animation-delay:1.1s" x="242" y="156" width="38" height="38" rx="9" fill="rgba(0,178,255,.16)" stroke="#40c8ff" />
    </g>
  </g>,
);

// The work-loop with its real, labelled stages: a card travels Idé → Plan →
// Opgavetavle → AI-agent bygger → Kvalitetstjek → Live and rounds back to Idé;
// the core pulses. "Live" is green. Nails: the concrete steps a piece of work
// runs through, repeating round by round until it's finished.
const CM_C = 135;
const CM_STAGES = [
  { cx: 180, cy: 55, lx: 180, ly: 37, anchor: "middle", label: "Idé" },
  { cx: 249, cy: 95, lx: 262, ly: 91, anchor: "start", label: "Plan" },
  { cx: 249, cy: 175, lx: 262, ly: 180, anchor: "start", label: "Opgavetavle" },
  { cx: 180, cy: 215, lx: 180, ly: 240, anchor: "middle", label: "AI-agent bygger" },
  { cx: 111, cy: 175, lx: 98, ly: 180, anchor: "end", label: "Kvalitetstjek" },
  { cx: 111, cy: 95, lx: 98, ly: 91, anchor: "end", label: "Live", green: true },
];
const cardmem = wrap(
  <g font-family="'DM Sans',sans-serif" font-size="10.5">
    <circle class="illu-flow" cx="180" cy={CM_C} r="80" fill="none" stroke="rgba(0,178,255,.3)" stroke-width="1.6" stroke-dasharray="4 7" />
    {CM_STAGES.map((s, i) => (
      <g key={i}>
        <circle class="node" cx={s.cx} cy={s.cy} r="6" fill={s.green ? "#2ecc71" : "#00b2ff"} style={`animation-delay:${i * 0.5}s`} />
        <text x={s.lx} y={s.ly} text-anchor={s.anchor} fill={s.green ? "#2ecc71" : "rgba(240,244,248,.82)"} font-weight={s.green ? "600" : "400"}>
          {s.label}
        </text>
      </g>
    ))}
    <circle class="pulse-core" cx="180" cy={CM_C} r="26" fill="rgba(0,178,255,.12)" stroke="#00b2ff" stroke-width="1.5" />
    <circle cx="180" cy={CM_C} r="4.5" fill="#40c8ff" />
    {/* the iterating card, orbiting the loop, kept upright */}
    <g>
      <animateTransform attributeName="transform" type="rotate" from={`0 180 ${CM_C}`} to={`360 180 ${CM_C}`} dur="10s" repeatCount="indefinite" />
      <g transform={`translate(180 55)`}>
        <g>
          <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="-360 0 0" dur="10s" repeatCount="indefinite" />
          <rect x="-14" y="-10" width="28" height="20" rx="5" fill="rgba(243,82,44,.2)" stroke="#F3522C" stroke-width="1.5" />
          <line x1="-8" y1="-2" x2="8" y2="-2" stroke="#F3522C" stroke-width="1.3" />
          <line x1="-8" y1="3" x2="3" y2="3" stroke="rgba(243,82,44,.6)" stroke-width="1.3" />
        </g>
      </g>
    </g>
  </g>,
);

// An always-awake eye at the centre with a radar sweep; thin lines reach out to
// fleet nodes that pulse as the sweep passes. Nails: always watching + binds the
// fleet as one nervous system.
const BUDDY_NODES = [
  { cx: 180, cy: 40 },
  { cx: 296, cy: 92 },
  { cx: 300, cy: 196 },
  { cx: 180, cy: 240 },
  { cx: 60, cy: 196 },
  { cx: 64, cy: 92, orange: true },
];
const buddy = wrap(
  <g>
    <g stroke="rgba(0,178,255,.16)" stroke-width="1.2">
      {BUDDY_NODES.map((n, i) => (
        <line key={i} x1="180" y1="140" x2={n.cx} y2={n.cy} />
      ))}
    </g>
    <circle cx="180" cy="140" r="50" fill="none" stroke="rgba(0,178,255,.18)" stroke-width="1.2" />
    <circle cx="180" cy="140" r="86" fill="none" stroke="rgba(0,178,255,.12)" stroke-width="1.2" />
    <circle class="illu-flow" cx="180" cy="140" r="116" fill="none" stroke="rgba(0,178,255,.14)" stroke-width="1.2" stroke-dasharray="4 7" />
    {/* radar sweep */}
    <g>
      <animateTransform attributeName="transform" type="rotate" from="0 180 140" to="360 180 140" dur="6s" repeatCount="indefinite" />
      <path d="M180 140 L180 24 A116 116 0 0 1 258 56 Z" fill="rgba(0,178,255,.10)" />
      <line x1="180" y1="140" x2="180" y2="24" stroke="#00b2ff" stroke-width="2" stroke-linecap="round" opacity=".85" />
    </g>
    {/* fleet nodes — pulse as the sweep passes */}
    <g>
      {BUDDY_NODES.map((n, i) => (
        <circle class="node" key={i} cx={n.cx} cy={n.cy} r="5.5" fill={n.orange ? "#F3522C" : "#00b2ff"} style={`animation-delay:${i * 0.9}s`} />
      ))}
    </g>
    {/* always-awake eye */}
    <path d="M150 140 Q180 120 210 140 Q180 160 150 140 Z" fill="rgba(0,178,255,.10)" stroke="#00b2ff" stroke-width="1.6" />
    <circle class="pulse-core" cx="180" cy="140" r="9" fill="rgba(0,178,255,.3)" stroke="#40c8ff" stroke-width="1.5" />
    <circle cx="180" cy="140" r="3.4" fill="#f0f4f8" />
  </g>,
);

// A growing memory graph / second brain: nodes (experiences, decisions) linked
// by thin edges, new nodes sprouting in, and an active path lighting up orange
// when "searched" (RAG). Nails: knowledge learned once, remembered forever; the
// graph grows wiser over time.
const TR_NODES = [
  { cx: 180, cy: 140, r: 13, core: true },
  { cx: 92, cy: 74 },
  { cx: 268, cy: 78 },
  { cx: 304, cy: 158 },
  { cx: 250, cy: 222 },
  { cx: 138, cy: 232 },
  { cx: 60, cy: 168 },
  { cx: 112, cy: 118 },
  { cx: 232, cy: 122 },
];
const TR_EDGES = [
  [0, 7], [0, 8], [0, 4], [0, 5], [7, 1], [7, 6], [8, 2], [8, 3], [4, 3], [5, 6],
];
const TR_PATH = [
  [0, 8], [8, 2],
]; // active retrieval path (orange)
const trail = wrap(
  <g>
    <g stroke="rgba(0,178,255,.22)" stroke-width="1.2">
      {TR_EDGES.map(([a, b], i) => (
        <line key={i} x1={TR_NODES[a].cx} y1={TR_NODES[a].cy} x2={TR_NODES[b].cx} y2={TR_NODES[b].cy} />
      ))}
    </g>
    {/* active retrieval path — lights up orange */}
    <g class="illu-flow" stroke="#F3522C" stroke-width="2" stroke-dasharray="3 5" fill="none">
      {TR_PATH.map(([a, b], i) => (
        <line key={i} x1={TR_NODES[a].cx} y1={TR_NODES[a].cy} x2={TR_NODES[b].cx} y2={TR_NODES[b].cy} />
      ))}
    </g>
    {TR_NODES.map((n, i) =>
      n.core ? (
        <g key={i}>
          <circle class="pulse-core" cx={n.cx} cy={n.cy} r={n.r} fill="rgba(0,178,255,.14)" stroke="#00b2ff" stroke-width="1.6" />
          <circle cx={n.cx} cy={n.cy} r="4.5" fill="#40c8ff" />
        </g>
      ) : (
        <circle
          class="node"
          key={i}
          cx={n.cx}
          cy={n.cy}
          r="6"
          fill={i === 2 ? "#F3522C" : "#00b2ff"}
          style={`animation-delay:${i * 0.45}s`}
        />
      ),
    )}
  </g>,
);

const REGISTRY: Record<string, JSX.Element> = { components, cardmem, buddy, trail };

export function hasIllustration(k: string): boolean {
  return k.toLowerCase() in REGISTRY;
}

export function Illustration({ k }: { k: string }): JSX.Element | null {
  return REGISTRY[k.toLowerCase()] ?? null;
}
