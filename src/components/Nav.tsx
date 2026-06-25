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
              <a href="/#indsigter" data-scroll="indsigter" data-testid="dd-indsigter">
                <b>Indsigter</b>
                <span>Blog om AI-native byg</span>
              </a>
              <a href="/#om" data-scroll="om" data-testid="dd-om">
                <b>Om Christian</b>
                <span>30+ år som pioner</span>
              </a>
            </div>
          </div>
          <a class="navlink simple" href="/#om" data-scroll="om" data-testid="nav-om">
            Om
          </a>
          <a class="btn" href="/#kontakt" data-scroll="kontakt" data-testid="nav-cta-kontakt">
            Lad os bygge
          </a>
        </nav>
      </div>
    </header>
  );
}
