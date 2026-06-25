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

// A card travels the plan→board→build→check→live loop and rounds back; the core
// pulses. Nails: the self-repeating workflow that refines round by round.
const STAGES = [
  { cx: 180, cy: 48 },
  { cx: 267, cy: 112 },
  { cx: 234, cy: 214 },
  { cx: 126, cy: 214 },
  { cx: 92, cy: 112 },
];
const cardmem = wrap(
  <g>
    <circle class="illu-flow" cx="180" cy="140" r="92" fill="none" stroke="rgba(0,178,255,.32)" stroke-width="1.6" stroke-dasharray="4 7" />
    {STAGES.map((s, i) => (
      <circle
        class="node"
        key={i}
        cx={s.cx}
        cy={s.cy}
        r="6"
        fill={i === 4 ? "#F3522C" : "#00b2ff"}
        style={`animation-delay:${i * 0.4}s`}
      />
    ))}
    <circle class="pulse-core" cx="180" cy="140" r="30" fill="rgba(0,178,255,.12)" stroke="#00b2ff" stroke-width="1.5" />
    <circle cx="180" cy="140" r="5" fill="#40c8ff" />
    {/* the iterating card, orbiting the loop, kept upright */}
    <g>
      <animateTransform attributeName="transform" type="rotate" from="0 180 140" to="360 180 140" dur="9s" repeatCount="indefinite" />
      <g transform="translate(180 48)">
        <g>
          <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="-360 0 0" dur="9s" repeatCount="indefinite" />
          <rect x="-16" y="-11" width="32" height="22" rx="5" fill="rgba(243,82,44,.2)" stroke="#F3522C" stroke-width="1.6" />
          <line x1="-9" y1="-3" x2="9" y2="-3" stroke="#F3522C" stroke-width="1.4" />
          <line x1="-9" y1="3" x2="4" y2="3" stroke="rgba(243,82,44,.6)" stroke-width="1.4" />
        </g>
      </g>
    </g>
  </g>,
);

const REGISTRY: Record<string, JSX.Element> = { components, cardmem };

export function hasIllustration(k: string): boolean {
  return k.toLowerCase() in REGISTRY;
}

export function Illustration({ k }: { k: string }): JSX.Element | null {
  return REGISTRY[k.toLowerCase()] ?? null;
}
