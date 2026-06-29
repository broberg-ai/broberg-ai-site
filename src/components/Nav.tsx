/* Top navigation. Dropdowns open on hover (CSS) on desktop and on click
   (enhance.ts toggles .open) on touch — the mobile fix flagged in the build
   brief. In-page links use data-scroll; enhance.ts smooth-scrolls them. */
export function Nav() {
  return (
    <header>
      <div class="wrap nav">
        <a class="logo" href="/" data-testid="nav-logo">
          broberg<span class="ai">.ai</span>
        </a>
        <button class="navlink mobile-only" data-testid="nav-mobile-toggle" aria-label="Menu" aria-expanded="false">
          ☰
        </button>
        <nav class="navlinks" data-testid="nav-links">
          <div class="navitem">
            <button class="navlink dropdown-toggle" data-testid="nav-univers" aria-haspopup="true" aria-expanded="false">
              Univers <span class="car">▾</span>
            </button>
            <div class="dd">
              <a href="/#universet" data-scroll="universet" data-testid="dd-universet">
                <b>Universet</b>
                <span>Sådan hænger det sammen</span>
              </a>
              <a href="/#platforme" data-scroll="platforme" data-testid="dd-platforme">
                <b>Flagskibe</b>
                <span>Platformene bag det hele</span>
              </a>
              <a href="/#metoden" data-scroll="metoden" data-testid="dd-metoden">
                <b>Metoden</b>
                <span>Derfor går det lynhurtigt</span>
              </a>
            </div>
          </div>
          <a class="navlink simple" href="/#cases" data-scroll="cases" data-testid="nav-cases">
            Cases
          </a>
          <div class="navitem">
            <button class="navlink dropdown-toggle" data-testid="nav-ressourcer" aria-haspopup="true" aria-expanded="false">
              Ressourcer <span class="car">▾</span>
            </button>
            <div class="dd">
              <a href="/indsigter" data-testid="dd-indsigter">
                <b>Indsigter</b>
                <span>Blog om AI-native byg</span>
              </a>
              <a href="/ai-metode" data-testid="dd-ai-metode">
                <b>AI &amp; Metode</b>
                <span>Håndværket bag — sådan bygger vi med AI</span>
              </a>
              <a href="/bag-om" data-testid="dd-bag-om">
                <b>Bag om</b>
                <span>Kig bag motoren i universet</span>
              </a>
              <a href="/cases" data-testid="dd-cases">
                <b>Cases</b>
                <span>Kundeløsninger i drift</span>
              </a>
            </div>
          </div>
          <a class="navlink simple" href="/#om" data-scroll="om" data-testid="nav-om">
            Om
          </a>
          <button class="navlink navsearch" data-testid="cmdk-trigger" aria-label="Søg (⌘K)" title="Søg ⌘K">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5" />
              <path d="M11 11l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            <span class="navsearch-kbd">⌘K</span>
          </button>
          <button class="navlink navtheme" data-testid="theme-toggle" aria-label="Skift mellem lyst og mørkt tema" title="Skift tema">
            <svg class="theme-icon theme-sun" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
            <svg class="theme-icon theme-moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          </button>
          <a class="btn" href="/#kontakt" data-scroll="kontakt" data-testid="nav-cta-kontakt">
            Lad os bygge
          </a>
        </nav>
      </div>
    </header>
  );
}
