/* Progressive enhancement for the SSR'd page. Everything here is additive — the
   page is fully readable without it. Ported from mockup v6's inline script plus
   the mobile nav/dropdown toggles flagged in the build brief. */
import { mountCmdk } from "@/client/cmdk.tsx";
import { mountTurnstile } from "@/client/turnstile.tsx";

// F157.3 — TODO once @webhouse/cms-inline-edit is published to npm (blocked
// on a one-time npmjs.com trusted-publisher setup, see
// docs/features/F157-inline-editing.md): add the dependency, then
//   import { initInlineEdit } from "@webhouse/cms-inline-edit";
//   function inlineEdit() {
//     initInlineEdit({ cmsBaseUrl: "https://webhouse.app", siteId: "broberg-ai" });
//   }
//   safe(inlineEdit);
// The data-cms-collection/data-cms-slug/data-cms-field attributes are already
// live on Hero/About/Contact (inert until this activates).

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

// Hero slideshow: crossfades between the pre-rendered slide texts (real HTML
// already in the DOM — no client-side templating) on a timer, and via the dot
// nav. The visible slide + rotation order are decided server-side per request
// (compose.ts shuffles), so this only ever walks forward through what SSR sent.
const HERO_ROTATE_MS = 8000;
function heroSlides() {
  const root = document.querySelector<HTMLElement>('[data-testid="hero-slideshow"]');
  const slides = Array.from(root?.querySelectorAll<HTMLElement>(".hero-slide") ?? []);
  const dots = Array.from(document.querySelectorAll<HTMLButtonElement>(".hero-dot"));
  if (slides.length < 2) return;

  let current = 0;
  let timer: ReturnType<typeof setInterval> | null = null;

  const goTo = (i: number) => {
    slides[current]?.classList.remove("active");
    dots[current]?.classList.remove("active");
    dots[current]?.setAttribute("aria-selected", "false");
    current = i;
    slides[current]?.classList.add("active");
    dots[current]?.classList.add("active");
    dots[current]?.setAttribute("aria-selected", "true");
  };

  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const start = () => {
    if (reduced) return;
    timer = setInterval(() => goTo((current + 1) % slides.length), HERO_ROTATE_MS);
  };
  const restart = () => {
    if (timer) clearInterval(timer);
    start();
  };

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      if (i === current) return;
      goTo(i);
      restart();
    });
  });

  start();
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

  // Multi-select: each pill toggles independently (a customer may be
  // interested in more than one solution) — the hidden input collects every
  // selected pill's value as a comma-joined list.
  const pillrow = form.querySelector<HTMLElement>(".form-pillrow");
  const hidden = form.querySelector<HTMLInputElement>("#cf-solution-type");
  const syncHidden = () => {
    if (!hidden || !pillrow) return;
    const selected = Array.from(pillrow.querySelectorAll<HTMLElement>(".pill.sel")).map((p) => p.dataset.value ?? "");
    hidden.value = selected.join(",");
  };
  pillrow?.querySelectorAll<HTMLElement>(".pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      pill.classList.toggle("sel");
      syncHidden();
    });
  });

  const status = form.querySelector<HTMLElement>(".form-status");
  const submitBtn = form.querySelector<HTMLButtonElement>('[data-testid="contact-submit"]');

  const isEn = form.dataset.lang === "en";
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Required-field validation. The form carries novalidate — the browser's
  // own "Please fill in this field" bubble renders in the BROWSER's UI
  // language (not the page's), so on a Danish page an English OS/browser
  // shows English. Replaced with our own always-correctly-localized message
  // in the same .form-status the server-side errors already use.
  function firstInvalidField(): { el: HTMLElement; message: string } | null {
    if (!form) return null;
    const name = form.querySelector<HTMLInputElement>("#cf-name");
    const email = form.querySelector<HTMLInputElement>("#cf-email");
    const message = form.querySelector<HTMLTextAreaElement>("#cf-message");
    if (name && !name.value.trim()) {
      return { el: name, message: isEn ? "Please fill in your name." : "Udfyld venligst dit navn." };
    }
    if (email && !EMAIL_RE.test(email.value.trim())) {
      return { el: email, message: isEn ? "Please enter a valid email address." : "Udfyld venligst en gyldig emailadresse." };
    }
    if (message && !message.value.trim()) {
      return { el: message, message: isEn ? "Please write a message." : "Skriv venligst en besked." };
    }
    return null;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!status || !submitBtn) return;

    const invalid = firstInvalidField();
    if (invalid) {
      status.className = "form-status show err";
      status.textContent = invalid.message;
      invalid.el.focus();
      return;
    }

    const data = new FormData(form);
    // Honeypot must stay empty — a real visitor never fills it.
    if (String(data.get("_gotcha") ?? "").length > 0) return;

    // Turnstile: the widget island writes its solved token into this hidden
    // field, and stamps data-turnstile-active once a site key resolved. Only
    // block on the token when a widget is actually active — if Turnstile is
    // disabled server-side (no site key returned) we don't hold the form
    // hostage to a challenge nobody was ever shown.
    const captchaRoot = document.getElementById("contact-turnstile-root");
    if (captchaRoot?.dataset.turnstileActive === "true" && !String(data.get("turnstileToken") ?? "")) {
      status.className = "form-status show err";
      status.textContent = form.dataset.lang === "en" ? "Please complete the challenge above." : "Løs venligst udfordringen ovenfor.";
      return;
    }

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
        // Success navigates to the dedicated "Tak" page instead of showing an
        // inline message — that page has room for a proper thank-you + the
        // "did you see these news?" strip. No form.reset() needed; we're leaving.
        const redirect = form.dataset.successRedirect;
        if (redirect) {
          window.location.href = redirect;
          return;
        }
        status.className = "form-status show ok";
        status.textContent = json.message || (form.dataset.lang === "en" ? "Thank you!" : "Tak!");
        form.reset();
      } else {
        status.className = "form-status show err";
        status.textContent = json.error || (form.dataset.lang === "en" ? "Something went wrong — try again." : "Noget gik galt — prøv igen.");
        window.dispatchEvent(new CustomEvent("turnstile:reset"));
      }
    } catch {
      status.className = "form-status show err";
      status.textContent = form.dataset.lang === "en" ? "Could not reach the server — try again." : "Kunne ikke kontakte serveren — prøv igen.";
      window.dispatchEvent(new CustomEvent("turnstile:reset"));
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
safe(heroSlides);
safe(reducedMotion);
safe(themeToggle);
safe(mountCmdk);
safe(faqAccordion);
safe(mountTurnstile);
safe(contactForm);
