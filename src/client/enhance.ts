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
  document.querySelectorAll<HTMLElement>(".reveal").forEach((r) => {
    // A .reveal taller than the viewport can never reach the 0.16 threshold, so
    // the observer would never fire and it'd stay at `transform: translateY()`
    // forever — which traps vertical scrolling on iOS Safari/WebKit (the whole
    // blog page becomes un-scrollable). Reveal those immediately; observe the rest.
    if (r.getBoundingClientRect().height > window.innerHeight) r.classList.add("in");
    else io.observe(r);
  });
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

// FAQ accordion (F156.3) — click a question, toggle its .open state.
function faqAccordion() {
  document.querySelectorAll<HTMLElement>(".faq-q").forEach((q) => {
    q.addEventListener("click", () => {
      q.closest(".faq-item")?.classList.toggle("open");
    });
  });
}

// Contact form (F156.3/F156.6) — custom pill selector synced to a hidden
// input (never a native <select>), submitted via fetch to the F30 Form
// Engine's public endpoint. No page reload; inline success/error status.
function contactForm() {
  const form = document.querySelector<HTMLFormElement>("#contact-form");
  if (!form) return;

  const pillrow = form.querySelector<HTMLElement>(".form-pillrow");
  const hidden = form.querySelector<HTMLInputElement>("#cf-solution-type");
  pillrow?.querySelectorAll<HTMLElement>(".pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      pillrow.querySelectorAll(".pill").forEach((p) => p.classList.remove("sel"));
      pill.classList.add("sel");
      if (hidden) hidden.value = pill.dataset.value ?? "";
    });
  });

  const status = form.querySelector<HTMLElement>(".form-status");
  const submitBtn = form.querySelector<HTMLButtonElement>('[data-testid="contact-submit"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!status || !submitBtn) return;
    const data = new FormData(form);
    // Honeypot must stay empty — a real visitor never fills it.
    if (String(data.get("_gotcha") ?? "").length > 0) return;

    submitBtn.disabled = true;
    status.className = "form-status show";
    status.textContent = form.dataset.lang === "en" ? "Sending…" : "Sender…";

    try {
      const payload: Record<string, string> = {};
      data.forEach((v, k) => {
        if (k !== "_gotcha") payload[k] = String(v);
      });
      const res = await fetch("https://webhouse.app/api/forms/contact?site=broberg-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string; error?: string };
      if (res.ok && json.ok) {
        status.className = "form-status show ok";
        status.textContent = json.message || (form.dataset.lang === "en" ? "Thank you!" : "Tak!");
        form.reset();
      } else {
        status.className = "form-status show err";
        status.textContent = json.error || (form.dataset.lang === "en" ? "Something went wrong — try again." : "Noget gik galt — prøv igen.");
      }
    } catch {
      status.className = "form-status show err";
      status.textContent = form.dataset.lang === "en" ? "Could not reach the server — try again." : "Kunne ikke kontakte serveren — prøv igen.";
    } finally {
      submitBtn.disabled = false;
    }
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
safe(faqAccordion);
safe(contactForm);
