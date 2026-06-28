/* Hero "amplifier — frequency" motif. Pure SVG + CSS animation (no JS): a red
   input wave enters a blue amplifier and exits as larger blue output waves.
   Animation lives in brand.css (.sphere/.wIn/.wOut); this is static markup. */
export function HeroFrequency() {
  return (
    <svg
      class="svg-wrap"
      viewBox="0 0 400 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Forstærker — frekvens"
    >
      <defs>
        <radialGradient id="hg" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stop-color="#00b2ff" stop-opacity=".22" />
          <stop offset="100%" stop-color="#00b2ff" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="hl" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#00b2ff" />
          <stop offset="100%" stop-color="#40c8ff" />
        </linearGradient>
        <clipPath id="cin">
          <rect x="8" y="120" width="96" height="100" />
        </clipPath>
      </defs>
      <circle class="sphere" cx="200" cy="170" r="150" fill="url(#hg)" />
      <g clip-path="url(#cin)">
        <path
          class="wIn"
          d="M-32 170 q10 -9 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0"
          stroke="#F3522C"
          stroke-width="2.5"
          fill="none"
        />
      </g>
      <path d="M110 110 L110 230 L240 170 Z" fill="none" stroke="url(#hl)" stroke-width="2" />
      <circle cx="158" cy="170" r="4" fill="#00b2ff" />
      <g>
        <path
          class="wOut"
          d="M236 170 q10 -42 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0"
          stroke="url(#hl)"
          stroke-width="3"
          fill="none"
        />
        <path
          class="wOut o2"
          d="M236 170 q10 -26 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0"
          stroke="#00b2ff"
          stroke-width="2"
          fill="none"
          opacity=".5"
        />
        <path
          class="wOut o3"
          d="M236 170 q10 -58 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0"
          stroke="#00b2ff"
          stroke-width="1.4"
          fill="none"
          opacity=".25"
        />
      </g>
    </svg>
  );
}
