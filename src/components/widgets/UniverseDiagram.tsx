/* The universe diagram: a pulsing cardmem core with infra engines (blue) and
   customer solutions (orange) orbiting it. The two rings orbit at different
   speeds (infra slow, customers a bit faster); the signal spokes ride along and
   the dashed rings pulse. Every node is a clickable link, and each label is
   FIXED-MOUNTED to its planet — it travels with the dot and stays upright,
   because it counter-rotates about THE DOT (not about itself).

   This uses SVG SMIL <animateTransform> with explicit rotation centres: the
   orbit group rotates about the diagram centre (220,220); each label group is
   translated onto its dot and rotates the opposite way about (0,0) = the dot,
   at the SAME duration, so the tag stays welded + upright. Geometry + motion
   are code; all TEXT (core / infra[] / customers[]) comes from cms.
   (enhance.ts pauses these animations under prefers-reduced-motion.) */
import type { JSX } from "preact";
import type { DiagramNode } from "@/content/types.ts";

const CENTER = 220;
const INFRA_DUR = "104s";
const CUST_DUR = "64s";

// broberg.ai brand mark — the "b." sits in the core. Real DM Sans (weight 600)
// glyph outlines so it renders identically everywhere and is font-independent;
// the lockup is geometrically centred on its ink bounding box (no optical drift).
const B_PATH =
  "M355.104736328125 -12Q315.00146484375 -12 283.1912841796875 -1.1552734375Q251.381103515625 9.689453125 227.4501953125 27.9996337890625Q203.519287109375 46.309814453125 186.519287109375 70.58544921875L174.553466796875 0H67.51708984375V720H187.519287109375V430.10400390625Q211.519287109375 466.62109375 252.5880126953125 491.310546875Q293.65673828125 516 354.277099609375 516Q424.794189453125 516 479.5872802734375 481.5Q534.38037109375 447 565.7080078125 387.5Q597.03564453125 328 597.03564453125 252Q597.03564453125 176.413818359375 565.9149169921875 116.2069091796875Q534.794189453125 56 480.2080078125 22.0Q425.621826171875 -12 355.104736328125 -12ZM329.79345703125 92.4501953125Q371.758544921875 92.4501953125 404.37890625 112.725830078125Q436.999267578125 133.00146484375 455.6025390625 168.466552734375Q474.205810546875 203.931640625 474.205810546875 251.586181640625Q474.205810546875 298.654541015625 455.6025390625 334.61962890625Q436.999267578125 370.584716796875 404.37890625 391.0672607421875Q371.758544921875 411.5498046875 329.79345703125 411.5498046875Q286.828369140625 411.5498046875 254.2080078125 391.0672607421875Q221.587646484375 370.584716796875 203.484375 334.8265380859375Q185.381103515625 299.068359375 185.381103515625 252Q185.381103515625 204.345458984375 203.484375 168.6734619140625Q221.587646484375 133.00146484375 254.2080078125 112.725830078125Q286.828369140625 92.4501953125 329.79345703125 92.4501953125Z";
const DOT_PATH =
  "M119.03564453125 -5Q85.345458984375 -5 64.0865478515625 15.8450927734375Q42.82763671875 36.690185546875 42.82763671875 66.483642578125Q42.82763671875 97.104736328125 64.0865478515625 117.9498291015625Q85.345458984375 138.794921875 119.03564453125 138.794921875Q152.31201171875 138.794921875 173.27783203125 117.9498291015625Q194.24365234375 97.104736328125 194.24365234375 66.483642578125Q194.24365234375 36.690185546875 173.27783203125 15.8450927734375Q152.31201171875 -5 119.03564453125 -5Z";

// Motorernes ring. Var en fast liste på SYV mens der lå 13 platforme i CMS'et,
// så seks af dem blev aldrig tegnet — samme tavse fejl som kunderingen havde.
// Pladserne regnes nu ud af antallet, så en ny platform dukker op af sig selv.
export const INFRA_R = 132;
// Ved 13 noder er der 2*132*sin(180/13) = 63 px mellem naboer, og det længste
// navn ("components") fylder ~55 px. Det er grænsen for hvad der kan læses.
export const INFRA_MAX = 13;

export function ringPladser(antal: number, r: number, startGrader: number) {
  return Array.from({ length: antal }, (_, i) => {
    const rad = ((startGrader + (360 / antal) * i) * Math.PI) / 180;
    const cx = Math.round(CENTER + r * Math.sin(rad));
    const cy = Math.round(CENTER - r * Math.cos(rad));
    return { cx, cy, tx: cx, ty: cy + (cy < CENTER ? -17 : 18) };
  });
}

/** Egerne skal pege på de noder der FAKTISK er der. De var syv hardkodede
 *  linjer, så de passede kun så længe der var præcis syv motorer. */
export function egeLinjer(antal: number, startGrader: number) {
  return Array.from({ length: antal }, (_, i) => {
    const rad = ((startGrader + (360 / antal) * i) * Math.PI) / 180;
    const [sx, sy] = [Math.sin(rad), Math.cos(rad)];
    return {
      x1: +(CENTER + 40 * sx).toFixed(1), y1: +(CENTER - 40 * sy).toFixed(1),
      x2: +(CENTER + (INFRA_R - 8) * sx).toFixed(1),
      y2: +(CENTER - (INFRA_R - 8) * sy).toFixed(1),
    };
  });
}
// Kundepladserne var før en fast liste på FIRE, og en femte kunde forsvandt
// tavst — `CUSTOMER_SLOTS.map` render kun de noder der havde en plads. Nu
// regnes pladserne ud fra hvor mange kunder der er, jævnt fordelt på deres egen
// ring (r=195, den orange stiplede), så der aldrig kan mangle plads til én mere.
const CUST_R = 195;
// Over dette bliver etiketterne for tætte til at læse: 2*195*sin(180/8) = 149 px
// mellem naboer, og det længste kundenavn fylder ~85 px. Ejeren 6/9: er der
// flere, «randomiserer vi bare kunderne» — se vaelgKunder().
export const CUST_MAX = 8;

export function kundePladser(antal: number) {
  return Array.from({ length: antal }, (_, i) => {
    // 36° som start giver et asymmetrisk mönster og holder den første væk fra
    // toppen, hvor infra-ringen allerede har en node.
    const rad = ((36 + (360 / antal) * i) * Math.PI) / 180;
    const cx = Math.round(CENTER + CUST_R * Math.sin(rad));
    const cy = Math.round(CENTER - CUST_R * Math.cos(rad));
    return { cx, cy, tx: cx, ty: cy + (cy < CENTER ? -17 : 18) };
  });
}

/** Er der flere noder end der er plads til, vises et TILFÆLDIGT udsnit — så
 *  ingen er permanent usynlig, og udsnittet skifter ved hver sidevisning.
 *  Ejerens valg 6/9. Under grænsen røres rækkefølgen ikke. */
export function vaelgNoder(alle: DiagramNode[], maks: number): DiagramNode[] {
  if (alle.length <= maks) return alle;
  const kopi = [...alle];
  for (let i = kopi.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopi[i], kopi[j]] = [kopi[j]!, kopi[i]!];
  }
  return kopi.slice(0, maks);
}

export const vaelgKunder = (alle: DiagramNode[]) => vaelgNoder(alle, CUST_MAX);

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function linkAttrs(node: DiagramNode, testid: string, blaa: boolean): Record<string, string> {
  // Farven bæres som `color` på selve linket, så glow og skyggen under hover kan
  // sige currentColor — én kilde til nodens farve, blå for motor, orange for kunde.
  const attrs: Record<string, string> = {
    class: "unode",
    style: `color:${blaa ? "var(--blue)" : "#F3522C"}`,
    "data-testid": testid,
  };
  if (node.scroll) attrs["data-scroll"] = node.scroll;
  else if (node.href) {
    attrs.href = node.href;
    if (/^https?:/.test(node.href)) {
      attrs.target = "_blank";
      attrs.rel = "noopener";
    }
  }
  return attrs;
}

function Node({
  node,
  slot,
  dur,
  r,
  hit,
}: {
  node: DiagramNode;
  slot: { cx: number; cy: number; tx: number; ty: number };
  dur: string;
  r: number;
  hit: number;
}) {
  const fill = r >= 5 ? "var(--blue)" : "#F3522C";
  return (
    <a {...linkAttrs(node, `universe-node-${slugify(node.label)}`, r >= 5)}>
      <g transform={`translate(${slot.cx} ${slot.cy})`}>
        <circle r={hit} fill="transparent" pointer-events="all" />
        {/* Ringen der puster ud ved hover. Den ligger FØR traefferfeltet i
            tegneorden, så den aldrig dækker planeten den kommer fra. */}
        <circle class="glow" r={r} />
        <circle class="planet" r={r} fill={fill} />
        {/* Label welded to this dot: counter-rotate about (0,0) = the dot. */}
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 0 0"
            to="-360 0 0"
            dur={dur}
            repeatCount="indefinite"
          />
          <text class="lbl" x={slot.tx - slot.cx} y={slot.ty - slot.cy}>
            {node.label}
          </text>
        </g>
      </g>
    </a>
  );
}

export function UniverseDiagram({
  infra,
  customers,
}: {
  infra: DiagramNode[];
  customers: DiagramNode[];
}) {
  // Ét udtræk, brugt af BÅDE egerne og noderne — regnes de hver for sig, kan et
  // tilfældigt udsnit give eger der peger på en node der ikke blev tegnet.
  const visInfra = vaelgNoder(infra, INFRA_MAX);
  return (
    <svg
      class="svg-wrap"
      viewBox="0 0 440 440"
      overflow="visible"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="broberg.ai-universet"
    >
      <defs>
        <radialGradient id="ug" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="var(--blue)" stop-opacity=".22" />
          <stop offset="70%" stop-color="var(--blue)" stop-opacity="0" />
        </radialGradient>
      </defs>
      {/* Shift content 20px right so left-side labels have room to breathe. */}
      <g transform="translate(20 0)">
      <circle cx="220" cy="220" r="210" fill="url(#ug)" />

      {/* Static orbit guides — the dashed ones pulse. */}
      <circle class="ring" cx="220" cy="220" r="80" stroke="color-mix(in srgb,var(--blue) 25%,transparent)" stroke-width="1" fill="none" />
      <circle
        class="ring"
        style="animation-delay:.6s"
        cx="220"
        cy="220"
        r="135"
        stroke="color-mix(in srgb,var(--blue) 16%,transparent)"
        stroke-width="1"
        fill="none"
        stroke-dasharray="3 5"
      />
      <circle class="ring" cx="220" cy="220" r="195" stroke="rgba(243,82,44,.18)" stroke-width="1" fill="none" stroke-dasharray="2 7" />

      {/* Infra engines — slow orbit; spokes ride along + keep their dash pulse. */}
      <g font-family="'DM Sans',sans-serif" font-size="9.5" fill="var(--muted)" text-anchor="middle">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from={`0 ${CENTER} ${CENTER}`}
          to={`360 ${CENTER} ${CENTER}`}
          dur={INFRA_DUR}
          repeatCount="indefinite"
        />
        <g class="signal" stroke="color-mix(in srgb,var(--blue) 30%,transparent)" stroke-width="1.2">
          {egeLinjer(visInfra.length, 0).map((l, i) => (
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
          ))}
        </g>
        {ringPladser(visInfra.length, INFRA_R, 0).map((s, i) => (
          <Node key={i} node={visInfra[i]!} slot={s} dur={INFRA_DUR} r={5} hit={16} />
        ))}
      </g>

      {/* Customer solutions — a bit faster orbit. */}
      <g font-family="'DM Sans',sans-serif" font-size="8.5" fill="var(--muted)" text-anchor="middle">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from={`0 ${CENTER} ${CENTER}`}
          to={`360 ${CENTER} ${CENTER}`}
          dur={CUST_DUR}
          repeatCount="indefinite"
        />
        {(() => {
          const vist = vaelgKunder(customers);
          const pladser = kundePladser(vist.length);
          return vist.map((c, i) => (
            <Node key={i} node={c} slot={pladser[i]!} dur={CUST_DUR} r={4} hit={14} />
          ));
        })()}
      </g>

      {/* Core — the broberg.ai brand mark ("b."), on top, does not orbit; the
          centre of the universe is the brand itself. Clickable to the home page.
          (cardmem orbits as one of the blue building blocks like every platform.) */}
      <a class="unode" href="/" data-testid="universe-core-brand" aria-label="broberg.ai">
        <circle cx="220" cy="220" r="44" fill="transparent" pointer-events="all" />
        <circle class="pulse-core" cx="220" cy="220" r="40" fill="color-mix(in srgb,var(--blue) 12%,transparent)" stroke="var(--blue)" stroke-width="1.5" />
        <g transform="translate(220 220) scale(0.04645 -0.04645) translate(-428.880 -354.000)">
          <path d={B_PATH} fill="var(--light)" />
          <g transform="translate(596 0)">
            <path d={DOT_PATH} fill="#F3522C" />
          </g>
        </g>
      </a>
      </g>
    </svg>
  );
}
