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

// Speak to your site → a rendered page, guarded by AI Lock. A voice bubble flows
// into a browser frame (header dots + content + a palette of tools); an orange
// shield-lock badge guards the top-right corner. Nails: chat-driven CMS, 64
// værktøjer, and the unique human-edit protection (AI Lock).
const CMS_TOOLS = Array.from({ length: 16 }, (_, i) => ({
  cx: 196 + (i % 8) * 14,
  cy: 162 + Math.floor(i / 8) * 16,
}));
const cms = wrap(
  <g>
    {/* voice / chat bubble — "talk to your site" */}
    <g>
      <rect x="24" y="98" width="86" height="56" rx="14" fill="rgba(0,178,255,.10)" stroke="#00b2ff" stroke-width="1.6" />
      <path d="M44 154 v16 l16 -16 Z" fill="rgba(0,178,255,.10)" stroke="#00b2ff" stroke-width="1.6" />
      <rect x="60" y="112" width="14" height="22" rx="7" fill="none" stroke="#40c8ff" stroke-width="1.6" />
      <path d="M53 128 a14 14 0 0 0 28 0" fill="none" stroke="#40c8ff" stroke-width="1.6" />
      <path d="M67 142 v6" stroke="#40c8ff" stroke-width="1.6" />
    </g>
    {/* flow → */}
    <path class="illu-flow" d="M118 126 H170" stroke="#F3522C" stroke-width="1.6" stroke-dasharray="3 5" />
    {/* rendered page */}
    <g>
      <rect x="178" y="54" width="156" height="168" rx="12" fill="rgba(0,178,255,.05)" stroke="#00b2ff" stroke-width="1.6" />
      <line x1="178" y1="80" x2="334" y2="80" stroke="rgba(0,178,255,.4)" stroke-width="1.2" />
      <circle cx="194" cy="67" r="3" fill="#F3522C" />
      <circle cx="206" cy="67" r="3" fill="rgba(0,178,255,.7)" />
      <circle cx="218" cy="67" r="3" fill="#34d399" />
      <rect x="196" y="96" width="78" height="8" rx="4" fill="rgba(240,244,248,.5)" />
      <rect x="196" y="114" width="120" height="5" rx="2.5" fill="rgba(240,244,248,.2)" />
      <rect x="196" y="126" width="104" height="5" rx="2.5" fill="rgba(240,244,248,.2)" />
      <rect x="196" y="138" width="114" height="5" rx="2.5" fill="rgba(240,244,248,.2)" />
      {/* tool palette — 64 værktøjer */}
      {CMS_TOOLS.map((t, i) => (
        <circle
          class={i % 5 === 0 ? "node" : undefined}
          key={i}
          cx={t.cx}
          cy={t.cy}
          r="3"
          fill={i === 3 ? "#F3522C" : i === 10 ? "#34d399" : "rgba(0,178,255,.55)"}
          style={i % 5 === 0 ? `animation-delay:${i * 0.3}s` : undefined}
        />
      ))}
    </g>
    {/* AI Lock shield badge (top-right corner) */}
    <g>
      <path d="M312 40 l18 6 v13 c0 12 -9 19 -18 22 c-9 -3 -18 -10 -18 -22 v-13 Z" fill="rgba(243,82,44,.16)" stroke="#F3522C" stroke-width="1.6" />
      <rect x="305" y="60" width="14" height="11" rx="2.5" fill="none" stroke="#F3522C" stroke-width="1.5" />
      <path d="M308 60 v-3 a4 4 0 0 1 8 0 v3" fill="none" stroke="#F3522C" stroke-width="1.5" />
    </g>
  </g>,
);

// One facade routing out to many providers: a central ai-sdk hub distributes to
// five provider satellites (Claude / GPT / Gemini / Mistral / BFL) over pulsing
// links; the EU route (Mistral) is the orange accent. Nails: change a level-word
// ("niveau"), not your code — and sensitive data stays in Europe.
const AISDK_NODES = [
  { cx: 180, cy: 48, label: "Claude", lx: 180, ly: 33, anchor: "middle" },
  { cx: 267, cy: 112, label: "GPT", lx: 281, ly: 116, anchor: "start" },
  { cx: 234, cy: 214, label: "Gemini", lx: 246, ly: 219, anchor: "start" },
  { cx: 126, cy: 214, label: "Mistral", lx: 114, ly: 219, anchor: "end", orange: true },
  { cx: 93, cy: 112, label: "BFL", lx: 79, ly: 116, anchor: "end" },
];
const aiSdk = wrap(
  <g font-family="'DM Sans',sans-serif" font-size="10.5">
    {/* hub → satellite links (dashed pulse) */}
    <g class="illu-flow" stroke-dasharray="4 7" stroke-width="1.6" fill="none">
      {AISDK_NODES.map((n, i) => (
        <line key={i} x1="180" y1="140" x2={n.cx} y2={n.cy} stroke={n.orange ? "rgba(243,82,44,.5)" : "rgba(0,178,255,.4)"} />
      ))}
    </g>
    {/* provider satellites + labels */}
    {AISDK_NODES.map((n, i) => (
      <g key={i}>
        <circle class="node" cx={n.cx} cy={n.cy} r="7" fill={n.orange ? "#F3522C" : "#00b2ff"} style={`animation-delay:${i * 0.5}s`} />
        <text x={n.lx} y={n.ly} text-anchor={n.anchor} fill={n.orange ? "#F3522C" : "rgba(240,244,248,.82)"} font-weight={n.orange ? "600" : "400"}>
          {n.label}
        </text>
      </g>
    ))}
    {/* central ai-sdk hub */}
    <circle class="pulse-core" cx="180" cy="140" r="24" fill="rgba(0,178,255,.12)" stroke="#00b2ff" stroke-width="1.6" />
    <text x="180" y="143.5" text-anchor="middle" font-size="9.5" fill="rgba(240,244,248,.92)" font-weight="600">ai-sdk</text>
  </g>,
);

// A living EKG/pulse line across the monitored fleet: a calm blue rhythm with one
// spike flaring ORANGE — a caught error — while a scan dot travels the whole trace.
// Nails: continuous monitoring; problems light up the instant they happen.
const UPM_EKG =
  "M14 140 H70 l7 -9 l7 18 l7 -11 H150 l12 -52 l14 100 l12 -48 H210 l7 -9 l7 16 l7 -10 H346";
const upmetrics = wrap(
  <g fill="none">
    {/* baseline */}
    <line x1="14" y1="140" x2="346" y2="140" stroke="rgba(0,178,255,.12)" stroke-width="1" stroke-dasharray="2 6" />
    {/* monitored nodes along the trace */}
    {[40, 96, 250, 306].map((x, i) => (
      <circle class="node" key={i} cx={x} cy="140" r="4.5" fill="#00b2ff" style={`animation-delay:${i * 0.6}s`} />
    ))}
    {/* calm blue rhythm (left + right of the spike) */}
    <path d="M14 140 H70 l7 -9 l7 18 l7 -11 H150" stroke="#00b2ff" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
    <path d="M210 140 l7 -9 l7 16 l7 -10 H346" stroke="#00b2ff" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
    {/* the caught error — one orange spike */}
    <path d="M150 140 l12 -52 l14 100 l12 -48 H210" stroke="#F3522C" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" />
    <circle class="node" cx="162" cy="88" r="5" fill="#F3522C" />
    {/* scan dot travelling the whole trace */}
    <circle r="3.6" fill="#40c8ff">
      {/* `path` is a valid <animateMotion> attribute Preact's SVG types omit. */}
      <animateMotion dur="4.5s" repeatCount="indefinite" {...({ path: UPM_EKG } as Record<string, string>)} />
    </circle>
  </g>,
);

// A contract moving through its lifecycle: a branded document with a signature
// squiggle and an orange signed-seal (✓), above a kladde → sendt → underskrevet
// status track where a pulse travels to the orange "signed" node. Nails: correct
// from start → e-signed in seconds, fully tracked.
const CON_STEPS = [
  { cx: 96, label: "Kladde" },
  { cx: 180, label: "Sendt" },
  { cx: 264, label: "Underskrevet", orange: true },
];
const contracts = wrap(
  <g font-family="'DM Sans',sans-serif" font-size="10.5">
    {/* document */}
    <rect x="120" y="40" width="120" height="150" rx="10" fill="rgba(0,178,255,.05)" stroke="#00b2ff" stroke-width="1.6" />
    <rect x="136" y="58" width="64" height="8" rx="4" fill="rgba(240,244,248,.5)" />
    <rect x="136" y="76" width="88" height="5" rx="2.5" fill="rgba(240,244,248,.2)" />
    <rect x="136" y="88" width="80" height="5" rx="2.5" fill="rgba(240,244,248,.2)" />
    <rect x="136" y="100" width="86" height="5" rx="2.5" fill="rgba(240,244,248,.2)" />
    <rect x="136" y="112" width="70" height="5" rx="2.5" fill="rgba(240,244,248,.2)" />
    {/* signature line + squiggle */}
    <line x1="136" y1="150" x2="196" y2="150" stroke="rgba(0,178,255,.4)" stroke-width="1" stroke-dasharray="3 3" />
    <path class="illu-flow" d="M138 150 q6 -12 12 0 t12 0 t12 -4" stroke="#F3522C" stroke-width="1.8" fill="none" stroke-linecap="round" />
    {/* signed seal stamp */}
    <circle class="pulse-core" cx="224" cy="166" r="18" fill="rgba(243,82,44,.14)" stroke="#F3522C" stroke-width="1.6" />
    <path d="M216 166 l5 6 l11 -13" stroke="#F3522C" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
    {/* status track: kladde → sendt → underskrevet */}
    <line x1="96" y1="228" x2="264" y2="228" stroke="rgba(0,178,255,.18)" stroke-width="1.4" />
    <line class="illu-flow" x1="96" y1="228" x2="264" y2="228" stroke="#00b2ff" stroke-width="1.6" stroke-dasharray="4 7" />
    {CON_STEPS.map((s, i) => (
      <g key={i}>
        <circle class="node" cx={s.cx} cy="228" r="6" fill={s.orange ? "#F3522C" : "#00b2ff"} style={`animation-delay:${i * 0.6}s`} />
        <text x={s.cx} y="248" text-anchor="middle" fill={s.orange ? "#F3522C" : "rgba(240,244,248,.82)"} font-weight={s.orange ? "600" : "400"}>
          {s.label}
        </text>
      </g>
    ))}
  </g>,
);

// A secure vault of pitch thumbnails: a stack of presentation cards inside the
// hvælv (with a lock dial), one card sliding out on an orange share-link, and a
// search glimmer sweeping the stack. Nails: protected + shared + searchable;
// every pitch feeds the next.
const pitchVault = wrap(
  <g>
    {/* vault body + lock dial */}
    <rect x="44" y="56" width="152" height="168" rx="16" fill="rgba(0,178,255,.05)" stroke="#00b2ff" stroke-width="1.6" />
    <circle cx="178" cy="140" r="9" fill="none" stroke="#00b2ff" stroke-width="1.4" />
    <path d="M178 140 V132 M178 140 L184 144" stroke="#00b2ff" stroke-width="1.4" stroke-linecap="round" />
    {/* stacked pitch thumbnails */}
    {[0, 1, 2].map((k) => {
      const x = 68 + k * 9;
      const y = 84 + k * 17;
      return (
        <g key={k}>
          <rect x={x} y={y} width="74" height="44" rx="6" fill="rgba(8,12,18,.92)" stroke="#2a3340" stroke-width="1.2" />
          <rect x={x + 8} y={y + 8} width="30" height="20" rx="3" fill="rgba(0,178,255,.18)" stroke="#00b2ff" stroke-width="1" />
          <rect x={x + 44} y={y + 9} width="22" height="4" rx="2" fill="rgba(240,244,248,.4)" />
          <rect x={x + 44} y={y + 18} width="16" height="4" rx="2" fill="rgba(240,244,248,.22)" />
        </g>
      );
    })}
    {/* search glimmer sweeping the stack */}
    <rect x="62" y="80" width="5" height="78" fill="rgba(64,200,255,.45)">
      <animateTransform attributeName="transform" type="translate" from="0 0" to="96 0" dur="3.4s" repeatCount="indefinite" />
    </rect>
    {/* one card slides out on a share-link */}
    <path class="illu-flow" d="M196 130 H250" stroke="#F3522C" stroke-width="1.6" stroke-dasharray="3 5" />
    <g>
      <rect x="250" y="106" width="74" height="46" rx="6" fill="rgba(8,12,18,.95)" stroke="#F3522C" stroke-width="1.4" />
      <rect x="258" y="114" width="30" height="22" rx="3" fill="rgba(243,82,44,.16)" stroke="#F3522C" stroke-width="1" />
      <rect x="294" y="116" width="22" height="4" rx="2" fill="rgba(240,244,248,.4)" />
      <rect x="294" y="126" width="16" height="4" rx="2" fill="rgba(240,244,248,.22)" />
    </g>
    <circle class="node" cx="287" cy="180" r="5" fill="#F3522C" />
    <path d="M287 152 V174" stroke="rgba(243,82,44,.5)" stroke-width="1.4" stroke-dasharray="3 4" />
  </g>,
);

// Managed drift: a server rack of stacked units with calmly pulsing status lights
// (alive + stable, never alarming), an orange data-flow feeding in, and an EU
// star-ring / Stockholm badge. Sky #38bdf8 + orange accent. Nails: we run it, in EU.
const hosting = wrap(
  <g>
    {/* orange data-flow into the rack */}
    <path class="illu-flow" d="M34 121 H92" stroke="#F3522C" stroke-width="1.6" stroke-dasharray="3 5" />
    {/* server rack — 4 stacked units */}
    {[0, 1, 2, 3].map((k) => {
      const y = 66 + k * 38;
      return (
        <g key={k}>
          <rect x="96" y={y} width="120" height="30" rx="6" fill="rgba(56,189,248,.06)" stroke="#38bdf8" stroke-width="1.5" />
          <circle class="node" cx="109" cy={y + 15} r="3.4" fill={k === 0 ? "#F3522C" : "#38bdf8"} style={`animation-delay:${k * 0.5}s`} />
          <line x1="122" y1={y + 11} x2="200" y2={y + 11} stroke="rgba(125,211,252,.35)" stroke-width="1.3" />
          <line x1="122" y1={y + 19} x2="180" y2={y + 19} stroke="rgba(125,211,252,.22)" stroke-width="1.3" />
        </g>
      );
    })}
    {/* EU star-ring + Stockholm badge */}
    <circle cx="282" cy="74" r="27" fill="rgba(56,189,248,.08)" stroke="#38bdf8" stroke-width="1.4" />
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      return <circle key={i} cx={282 + Math.cos(a) * 14} cy={74 + Math.sin(a) * 14} r="1.5" fill="#7dd3fc" />;
    })}
    <text x="282" y="118" text-anchor="middle" font-family="'DM Sans',sans-serif" font-size="10" fill="rgba(240,244,248,.8)">
      Stockholm
    </text>
  </g>,
);

// Choosing the RIGHT tool, not more AI: a toolbox of candidate tools (violet, one
// dimmed = the honest "no"), with the right one lifted out and highlighted orange
// (a check). Nails: 30 years + healthy skepticism — right tool, right place.
const consulting = wrap(
  <g>
    {/* the chosen tool — lifted out, orange, glowing, with a check */}
    <rect class="illu-glow" x="146" y="44" width="46" height="46" rx="11" fill="rgba(243,82,44,.16)" stroke="#F3522C" stroke-width="1.8" />
    <path d="M157 67 l6 7 l14 -17" stroke="#F3522C" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" />
    {/* pick-up flow */}
    <path class="illu-flow" d="M169 90 V126" stroke="#F3522C" stroke-width="1.6" stroke-dasharray="3 5" />
    {/* toolbox / tray */}
    <path d="M64 152 H274 V206 a10 10 0 0 1 -10 10 H74 a10 10 0 0 1 -10 -10 Z" fill="rgba(167,139,250,.05)" stroke="#a78bfa" stroke-width="1.6" />
    <path d="M64 152 L92 130 H246 L274 152" fill="none" stroke="#a78bfa" stroke-width="1.6" stroke-linejoin="round" />
    {/* candidate tools inside — index 2 dimmed = the "no" */}
    {[0, 1, 2, 3].map((k) => {
      const x = 92 + k * 40;
      return (
        <rect key={k} x={x} y="166" width="30" height="34" rx="7" fill="rgba(167,139,250,.10)" stroke="#a78bfa" stroke-width="1.4" opacity={k === 2 ? "0.3" : "0.85"} />
      );
    })}
    {/* gentle status dots on the kept tools */}
    {[0, 1, 3].map((k, i) => (
      <circle class="node" key={k} cx={107 + k * 40} cy="183" r="3" fill="#c4b5fd" style={`animation-delay:${i * 0.5}s`} />
    ))}
  </g>,
);

// AutoDoc: a document that writes + updates itself — content lines with one
// freshly auto-written line (orange pulse), an embedded screenshot that a scan
// sweep keeps regenerating, and a rotating refresh ("auto") arc = always in sync.
// Amber #fbbf24 + orange accent.
const docs = wrap(
  <g>
    {/* document with folded corner */}
    <path d="M58 50 H168 L194 76 V230 H58 Z" fill="rgba(251,191,36,.05)" stroke="#fbbf24" stroke-width="1.6" stroke-linejoin="round" />
    <path d="M168 50 V76 H194" fill="none" stroke="#fbbf24" stroke-width="1.6" stroke-linejoin="round" />
    {/* content lines */}
    <rect x="74" y="92" width="80" height="6" rx="3" fill="rgba(253,230,138,.55)" />
    <rect x="74" y="108" width="100" height="5" rx="2.5" fill="rgba(253,230,138,.26)" />
    <rect x="74" y="121" width="92" height="5" rx="2.5" fill="rgba(253,230,138,.26)" />
    {/* freshly auto-written line (orange, pulsing) */}
    <rect class="illu-glow" x="74" y="134" width="58" height="5" rx="2.5" fill="rgba(243,82,44,.5)" />
    {/* embedded auto-screenshot with a regenerating scan sweep */}
    <rect x="74" y="156" width="104" height="56" rx="6" fill="rgba(251,191,36,.06)" stroke="#fbbf24" stroke-width="1.2" />
    <circle cx="92" cy="178" r="6" fill="rgba(253,230,138,.4)" />
    <path d="M104 196 l12 -13 l9 9 l15 -17" stroke="rgba(253,230,138,.45)" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
    <rect x="74" y="156" width="5" height="56" fill="rgba(243,82,44,.5)">
      <animateTransform attributeName="transform" type="translate" from="0 0" to="99 0" dur="3.2s" repeatCount="indefinite" />
    </rect>
    {/* self-updating refresh — rotating arc with "auto" */}
    <g transform="translate(264 92)">
      <g>
        <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="4.5s" repeatCount="indefinite" />
        <path d="M22 0 A22 22 0 1 1 6 -21" fill="none" stroke="#fbbf24" stroke-width="2.4" stroke-linecap="round" />
        <path d="M6 -21 l9 1 m-9 -1 l1 9" fill="none" stroke="#fbbf24" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
      </g>
      <text x="0" y="3.5" text-anchor="middle" font-family="'DM Sans',sans-serif" font-size="9.5" fill="rgba(253,230,138,.85)">auto</text>
    </g>
  </g>,
);

const REGISTRY: Record<string, JSX.Element> = {
  components,
  cardmem,
  buddy,
  trail,
  cms,
  "ai-sdk": aiSdk,
  upmetrics,
  contracts,
  "pitch-vault": pitchVault,
  hosting,
  consulting,
  docs,
};

export function hasIllustration(k: string): boolean {
  return k.toLowerCase() in REGISTRY;
}

export function Illustration({ k }: { k: string }): JSX.Element | null {
  return REGISTRY[k.toLowerCase()] ?? null;
}
