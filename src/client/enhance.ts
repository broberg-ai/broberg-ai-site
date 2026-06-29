/* Progressive enhancement for the SSR'd page. Everything here is additive — the
   page is fully readable without it. Ported from mockup v6's inline script plus
   the mobile nav/dropdown toggles flagged in the build brief. */
import { mountCmdk } from "@/client/cmdk.tsx";

function smoothScroll() {
  document.querySelectorAll<HTMLElement>("[data-scroll]").forEach((el) => {
    el.addEventListener("click", (e) => {
      const id = el.getAttribute("data-scroll");
      const target = id === "top" ? document.body : id ? document.getElementById(id) : null;
      // Target not on this page → let the element's href navigate (cross-page,
      // e.g. a nav link on /flagskibe/* going back to /#section).
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      document.querySelector(".navlinks")?.classList.remove("mobile-open");
    });
  });
}

function countUps() {
  const fmt = (n: number) => n.toLocaleString("da-DK");
  const run = (el: HTMLElement) => {
    const tgt = Number(el.dataset.target || "0");
    const pre = el.dataset.pre || "";
    const suf = el.dataset.suf || "";
    const dur = 1500;
    let t0: number | null = null;
    const step = (ts: number) => {
      if (t0 === null) t0 = ts;
      const p = Math.min((ts - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + fmt(Math.floor(tgt * e)) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target as HTMLElement;
        if (el.dataset && el.dataset.target) {
          run(el);
          io.unobserve(el);
        } else {
          el.classList.add("in");
        }
      });
    },
    { threshold: 0.16 },
  );
  document.querySelectorAll<HTMLElement>(".stat .n").forEach((n) => io.observe(n));
  document.querySelectorAll<HTMLElement>(".reveal").forEach((r) => io.observe(r));
}

function liveFeed() {
  const el = document.querySelector<HTMLElement>(".feed .txt");
  if (!el) return;
  let lines: string[] = [];
  try {
    lines = JSON.parse(el.dataset.feed || "[]");
  } catch {
    return;
  }
  if (lines.length < 2) return;
  let i = 0;
  setInterval(() => {
    i = (i + 1) % lines.length;
    el.style.opacity = "0";
    setTimeout(() => {
      el.innerHTML = lines[i];
      el.style.opacity = "1";
    }, 250);
  }, 2600);
}

function mobileNav() {
  const toggle = document.querySelector<HTMLElement>('[data-testid="nav-mobile-toggle"]');
  const links = document.querySelector<HTMLElement>(".navlinks");
  toggle?.addEventListener("click", () => {
    const open = links?.classList.toggle("mobile-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  // Dropdowns: hover handles desktop; on touch/click toggle .open.
  document.querySelectorAll<HTMLElement>(".navitem .dropdown-toggle").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const item = btn.closest(".navitem");
      const open = item?.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
  document.addEventListener("click", () => {
    document.querySelectorAll(".navitem.open").forEach((i) => i.classList.remove("open"));
  });
}

// Respect prefers-reduced-motion: pause the SVG SMIL orbit animations.
function reducedMotion() {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll("svg").forEach((s) => {
      const svg = s as unknown as SVGSVGElement;
      if (typeof svg.pauseAnimations === "function") svg.pauseAnimations();
    });
  }
}

// Theme toggle: flips [data-theme] on <html>, persists to localStorage (the
// no-FOUC <head> script reads it on next load), and updates the theme-color meta.
function themeToggle() {
  const btn = document.querySelector('[data-testid="theme-toggle"]');
  if (!btn) return;
  const meta = document.querySelector('meta[name="theme-color"]');
  btn.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* ignore */
    }
    meta?.setAttribute("content", next === "light" ? "#ffffff" : "#1c2027");
  });
}

// Run each feature independently so a page-specific element missing on a subpage
// can never abort the shared nav/dropdown wiring (cms #116). Nav goes first.
function safe(fn: () => void) {
  try {
    fn();
  } catch (e) {
    console.error("[enhance]", e);
  }
}
safe(mobileNav);
safe(smoothScroll);
safe(countUps);
safe(liveFeed);
safe(reducedMotion);
safe(themeToggle);
safe(mountCmdk);
