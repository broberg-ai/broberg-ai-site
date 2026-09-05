/* Progressive enhancement for the SSR'd page. Everything here is additive — the
   page is fully readable without it. Ported from mockup v6's inline script plus
   the mobile nav/dropdown toggles flagged in the build brief. */
import { mountCmdk } from "@/client/cmdk.tsx";
import { mountTurnstile } from "@/client/turnstile.tsx";
import { mountAdminChat } from "@/client/admin-chat.tsx";
import { aidanTilHtml } from "@/client/aidan-md.ts";
import { listSamtaler, hentSamtale, gemAktiv, sletSamtale, aktivId, saetAktiv, relativTid, erNaerBunden, type Tur } from "@/client/aidan-samtaler.ts";
import { initInlineEdit, getConnectedToken, buildConnectUrl, disconnect } from "@broberg/cms-inline-edit";

// F157 — cms-admin connection shared by inline-edit + the /admin panel.
const CMS = { cmsBaseUrl: "https://webhouse.app", siteId: "broberg-ai" };

// F157.3 — no-op unless the site's Site Settings toggle is on AND this
// browser is connected. See docs/features/F157-inline-editing.md.
function inlineEdit() {
  // Inline editing is for the PUBLIC site, not the admin tool pages (/admin,
  // /admin/chat). On the chat page its "Afslut redigering" pill overlapped the
  // input and a click reset the surface — so never mount it under /admin.
  if (location.pathname.startsWith("/admin")) return;
  // The package is customer-safe by default (connectPrompt: false): a logged-out
  // visitor sees NOTHING. A connected editor gets an idle "Rediger" pill → click
  // enters edit mode; "Afslut redigering" returns to idle and KEEPS the login
  // (so "Rediger" stays on every page for the token's life); only "Log ud" clears
  // it. First connect = the "Redigér live" button in webhouse.app CMS-admin.
  const isEn = document.documentElement.lang === "en";
  initInlineEdit({
    ...CMS,
    // No emoji anywhere on this site — the package prepends a square-pen icon.
    connectLabel: isEn ? "Edit" : "Rediger",
    // Editing badge: clicking it LEAVES edit mode but keeps the login (→ idle
    // "Rediger" pill), it is not a logout.
    disconnectLabel: isEn ? "Finish editing" : "Afslut redigering",
    logoutLabel: isEn ? "Log out" : "Log ud",
    // Toolbar + save-status text — the package defaults are Danish, so only the
    // English page overrides them (matches the /en page language).
    ...(isEn
      ? {
          labels: {
            bold: "Bold",
            italic: "Italic",
            underline: "Underline",
            color: "Colour",
            emoji: "Insert emoji",
            done: "Done",
            saving: "Saving…",
            saved: "Saved ✓",
            error: "Error — try again",
          },
        }
      : {}),
  });
}

// F157 — /admin: the same connected session inline-edit uses, but rendered
// as a real page instead of a floating badge. Not connected yet → bounce to
// cms-admin's connect flow (same "log ind via webhouse.app" flow every
// broberg.ai admin tool shares); connected → render the tool panel.
function adminPanel() {
  const root = document.getElementById("admin-root");
  if (!root) return;

  const token = getConnectedToken(CMS);
  if (!token) {
    window.location.href = buildConnectUrl(CMS, window.location.href);
    return;
  }

  const claims = decodeJwtPayload(token);
  const name = (claims?.name as string) || (claims?.email as string) || "ukendt";

  root.innerHTML = "";
  // padding-top clears the fixed 64px AdminNav header.
  root.style.cssText = "min-height:100vh;background:#0d0d0d;color:#f0f4f8;font-family:system-ui,-apple-system,sans-serif;padding:96px 24px 48px;";

  const wrap = document.createElement("div");
  wrap.style.cssText = "max-width:480px;margin:0 auto;";

  // Branding + Exit now live in the AdminNav header; the panel just shows who's
  // signed in (with a Log ud / disconnect affordance) and the tool cards.
  const who = document.createElement("div");
  who.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:16px;margin:0 0 24px;";
  const whoText = document.createElement("p");
  whoText.textContent = `Logget ind som ${name}`;
  whoText.style.cssText = "color:#8a8a8a;font-size:13px;margin:0;";
  who.appendChild(whoText);
  const logout = document.createElement("button");
  logout.type = "button";
  logout.textContent = "Log ud";
  logout.setAttribute("data-testid", "admin-logout");
  logout.style.cssText = "flex-shrink:0;background:none;border:1px solid #2a2a2a;color:#8a8a8a;font-size:12px;padding:6px 12px;border-radius:6px;cursor:pointer;";
  logout.addEventListener("click", () => {
    // Clearing the local token is NOT a logout on its own: the next /admin
    // bounce hits the connect flow, the still-valid webhouse.app session
    // silently re-mints a token, and you're logged in again. End the
    // webhouse.app session too, then land back on the public site — truly
    // logged out (no local token, no session → /admin shows the login window).
    disconnect(CMS);
    window.location.href =
      `${CMS.cmsBaseUrl}/admin/inline-edit/logout` +
      `?site=${encodeURIComponent(CMS.siteId)}&return=${encodeURIComponent(location.origin)}`;
  });
  who.appendChild(logout);
  wrap.appendChild(who);

  const card = document.createElement("div");
  card.id = "tool-inline-edit";
  card.style.cssText = "background:#161616;border:1px solid #2a2a2a;border-radius:10px;padding:20px;scroll-margin-top:80px;";

  const row = document.createElement("div");
  row.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:16px;";
  const label = document.createElement("div");
  label.innerHTML = `<p style="font-size:14px;font-weight:500;margin:0;">Inline editing</p><p style="font-size:12px;color:#8a8a8a;margin:4px 0 0;">Klik-til-redigér direkte på sitet.</p>`;
  row.appendChild(label);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.setAttribute("data-testid", "admin-inline-edit-toggle");
  // Dead until the server has said what the setting currently IS. Clickable
  // beforehand, the first click sends the opposite of a value nobody has read
  // yet — measured in a browser: a click ~20ms after load asked to turn ON
  // something that was already on.
  toggle.disabled = true;
  toggle.style.cssText = "flex-shrink:0;width:40px;height:22px;border-radius:11px;border:none;position:relative;cursor:pointer;transition:background 150ms;";
  const knob = document.createElement("div");
  knob.style.cssText = "position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left 150ms;box-shadow:0 1px 3px rgba(0,0,0,.3);";
  toggle.appendChild(knob);
  row.appendChild(toggle);
  card.appendChild(row);
  // A rejected save used to leave the switch exactly where it was, silently —
  // which reads as "I must have missed the button". Every click has to answer.
  const err = document.createElement("p");
  err.setAttribute("data-testid", "admin-inline-edit-error");
  err.style.cssText = "font-size:12px;color:#ff6b6b;margin:12px 0 0;display:none;";
  err.textContent = "Kunne ikke ændre indstillingen — prøv igen";
  card.appendChild(err);
  wrap.appendChild(card);
  root.appendChild(wrap);

  function paintToggle(enabled: boolean) {
    toggle.style.background = enabled ? "#00b2ff" : "#2a2a2a";
    knob.style.left = enabled ? "21px" : "3px";
    toggle.disabled = false;
  }

  fetch(`${CMS.cmsBaseUrl}/api/inline-edit/status?site=${CMS.siteId}`)
    .then((r) => r.json())
    .then((body: { enabled?: boolean }) => paintToggle(body.enabled === true))
    .catch(() => paintToggle(false));

  toggle.addEventListener("click", async () => {
    const next = knob.style.left !== "21px";
    toggle.disabled = true;
    try {
      // ?site= is REQUIRED: an edit-session token is scoped to one site, and
      // the server refuses a write that does not say which one it means. It was
      // missing here (the status call above always had it), so this switch had
      // never once changed anything — measured against production, 403 without
      // it and 200 with it. The id comes from the CMS constant, not a second
      // copy of the string.
      const res = await fetch(`${CMS.cmsBaseUrl}/api/inline-edit/toggle?site=${CMS.siteId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (res.ok) {
        err.style.display = "none";
        // The endpoint returns the value it actually stored, re-read from disk.
        // Paint THAT, never the value we asked for.
        const body = (await res.json()) as { enabled: boolean };
        paintToggle(body.enabled);
      } else {
        err.style.display = "block";
      }
    } catch {
      err.style.display = "block";
    } finally {
      toggle.disabled = false;
    }
  });
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

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
  let paused = false;
  const start = () => {
    if (reduced || paused) return;
    timer = setInterval(() => goTo((current + 1) % slides.length), HERO_ROTATE_MS);
  };
  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };
  const restart = () => {
    stop();
    start();
  };

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      if (i === current) return;
      goTo(i);
      restart();
    });
  });

  // F157 — freeze the carousel while a hero slide is being inline-edited, so
  // the slide can't rotate away mid-edit; resume when the edit ends. The
  // package emits these on any inline-edit region, so only pause when the
  // edited element is actually inside this hero.
  document.addEventListener("cms-inline-edit:activate", (e) => {
    const el = (e as CustomEvent).detail?.el as HTMLElement | undefined;
    if (el && root?.contains(el)) {
      paused = true;
      stop();
    }
  });
  document.addEventListener("cms-inline-edit:deactivate", () => {
    if (paused) {
      paused = false;
      restart();
    }
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
/**
 * Figur-klippene: stillbillede indtil man klikker, så to gennemløb, så tilbage.
 *
 * Christian, 4/9: «start med still billederne og klikker man på dem så kører
 * videoen 2 gang og så tilbage til still».
 *
 * DET LØSER OGSÅ ET PROBLEM VI HAVDE. Før kørte klippene af sig selv i løkke,
 * og så måtte vi bytte dem ud med et stillbillede for læsere der har bedt om
 * mindre bevægelse. Nu bevæger intet sig før nogen SELV beder om det — så
 * reduced-motion-reglen er opfyldt af designet frem for af en undtagelse.
 *
 * `poster` ER stillbilledet, og det er videoens EGET første billede frem for
 * mærkets SVG: klikker man, må udseendet ikke hoppe. load() bringer posteren
 * tilbage bagefter; pause() alene ville efterlade det SIDSTE billede stående.
 */
function figurKlip() {
  document.querySelectorAll<HTMLElement>("[data-fig-play]").forEach((knap) => {
    // Begge temaers klip ligger i DOM'en; kun det ene er synligt.
    const synlig = () =>
      Array.from(knap.querySelectorAll<HTMLVideoElement>("video")).find(
        (v) => v.offsetParent !== null,
      ) ?? null;

    let koerer = false;

    const spil = () => {
      const v = synlig();
      if (!v || koerer) return;
      koerer = true;
      knap.dataset.figPlaying = "1";
      let gennemloeb = 0;

      const slut = () => {
        gennemloeb += 1;
        if (gennemloeb < 2) {
          v.currentTime = 0;
          void v.play();
          return;
        }
        v.removeEventListener("ended", slut);
        koerer = false;
        delete knap.dataset.figPlaying;
        // load() frem for pause(): det er dét der sætter posteren tilbage.
        v.currentTime = 0;
        v.load();
      };

      v.addEventListener("ended", slut);
      v.currentTime = 0;
      void v.play().catch(() => {
        // Afviser browseren afspilningen, må knappen ikke stå og se travl ud.
        v.removeEventListener("ended", slut);
        koerer = false;
        delete knap.dataset.figPlaying;
      });
    };

    knap.addEventListener("click", spil);
    knap.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        spil();
      }
    });
  });
}

/* Aidan — besøgs-AI (F-kort i cardmem, mockup 01a06cbf godkendt 4/9).
   Markup'en er SSR'et af page() (kun når chatten er konfigureret); alt liv bor
   her: reveal ved første scroll, ét vink, klik åbner panelet, SSE-chat mod
   /api/aidan/chat. Historikken bor i sessionStorage så en sidenavigation ikke
   nulstiller samtalen. */
function aidan() {
  const rod = document.querySelector<HTMLElement>("[data-aidan]");
  if (!rod) return;
  const fab = rod.querySelector<HTMLButtonElement>(".aidan-fab")!;
  const boble = rod.querySelector<HTMLElement>(".aidan-boble")!;
  const panel = rod.querySelector<HTMLElement>(".aidan-panel")!;
  const msgs = rod.querySelector<HTMLElement>(".aidan-msgs")!;
  const form = rod.querySelector<HTMLFormElement>(".aidan-input")!;
  const felt = form.querySelector<HTMLInputElement>("input")!;
  const send = form.querySelector<HTMLButtonElement>(".aidan-send")!;
  const luk = rod.querySelector<HTMLButtonElement>(".aidan-luk, [data-testid='aidan-luk']")!;
  const locale = rod.dataset.locale === "en" ? "en" : "da";
  const roligt = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Sikker rendering bor i aidan-md.ts (Christian 4/9, screenshot: rå **fed**
  // og lister i panelet) — testbar for sig, escaper alt, lukket formliste.
  const tilHtml = aidanTilHtml;

  // ── Reveal ved første scroll — og ét vink. Vinket er det tema-bagte klip;
  // med reduceret bevægelse står SVG-posteren stille, som designet foreskriver.
  let vist = false;
  const visFab = () => {
    if (vist) return;
    vist = true;
    fab.classList.add("vis");
    boble.classList.add("vis");
    setTimeout(() => boble.classList.remove("vis"), 6000);
    if (!roligt) {
      const v = Array.from(fab.querySelectorAll<HTMLVideoElement>("video")).find(
        (x) => x.offsetParent !== null,
      );
      if (v) {
        const faerdig = () => {
          v.removeEventListener("ended", faerdig);
          v.currentTime = 0;
          v.load(); // load() sætter posteren tilbage; pause() ville efterlade sidste billede.
          fab.classList.remove("spiller"); // det diskrete nik genoptages på stillbilledet
        };
        v.addEventListener("ended", faerdig);
        setTimeout(() => {
          fab.classList.add("spiller");
          void v.play().catch(() => faerdig());
        }, 450);
      }
    }
  };
  addEventListener("scroll", () => scrollY > 120 && visFab(), { passive: true });
  if (scrollY > 120) visFab(); // landet midt på siden (anker/back-nav)

  // ── Åbn/luk
  const mobil = () => matchMedia("(max-width: 560px)").matches;
  const aabn = () => {
    panel.hidden = false;
    fab.classList.add("aaben");
    boble.classList.remove("vis");
    // preventScroll: uden den scroller browseren SIDEN bagved for at «vise»
    // feltet ved åbning (Christians «scrolle kører omme bagved»-rapport 5/9).
    // På mobil fokuseres SLET ikke: autofokus åbnede tastaturet oven i en
    // chat man endnu ikke har set, og skjulte skrivefeltet (IMG_9595, 5/9).
    if (!mobil()) felt.focus({ preventScroll: true });
    udvidHilsen();
    // Mobil: panelet er fuldskærm, så siden bagved låses (scroll-kæden stoppes
    // i CSS via denne klasse — kun under 560px, desktop-siden skal kunne rulle).
    document.documentElement.classList.add("aidan-aaben");
    tilpasViewport();
  };
  const lukPanel = () => {
    panel.hidden = true;
    fab.classList.remove("aaben");
    document.documentElement.classList.remove("aidan-aaben");
    panel.style.height = "";
    panel.style.transform = "";
  };
  // Tastaturet krymper KUN den synlige viewport, aldrig layout-viewporten som
  // det fixed panel hænger på — så uden dette lå felt+send BAG tasterne
  // (IMG_9595). Panelet får den højde der faktisk er synlig, og forskydes med
  // offsetTop, så skrivefeltet sidder lige over tastaturet som i enhver anden
  // chat-app. Kun mobil; desktop-panelet er lavere end skærmen pr. design.
  const vv = window.visualViewport;
  const tilpasViewport = () => {
    if (panel.hidden || !mobil() || !vv) return;
    panel.style.height = `${vv.height}px`;
    panel.style.transform = `translateY(${vv.offsetTop}px)`;
    rulNed();
  };
  vv?.addEventListener("resize", tilpasViewport);
  vv?.addEventListener("scroll", tilpasViewport);
  fab.addEventListener("click", aabn);
  luk.addEventListener("click", lukPanel);
  // En handlings-knap i et svar ([knap:]-CTA'en) navigerer — så dialogen skal
  // af vejen med det samme, ellers dækker fuldskærms-chatten den side man
  // lige har bedt om (Christian 5/9: «når der klikkes på en knap så luk»).
  msgs.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("a.aidan-cta")) lukPanel();
  });
  // ESC lukker Aidan (Christian 4/9). I fuldskærm tager første ESC kun
  // fuldskærmen af — standard lag-adfærd — og andet ESC lukker panelet.
  addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key !== "Escape" || panel.hidden) return;
    const pop = rod.querySelector<HTMLElement>("[data-testid='aidan-info-popover']");
    if (pop && !pop.hidden) pop.hidden = true;
    else if (panel.classList.contains("fuld")) panel.classList.remove("fuld");
    else lukPanel();
  });

  // ── Samtalen (F007.4): rigtigt lager med historik + Ny samtale — Eir-
  // pariteten. Ren logik bor i aidan-samtaler.ts; her er kun DOM-limen.
  const banner = rod.querySelector<HTMLElement>("[data-testid='aidan-banner']")!;
  const bannerTitel = banner.querySelector<HTMLElement>(".aidan-banner-titel")!;
  const histVisning = rod.querySelector<HTMLElement>("[data-testid='aidan-historik-visning']")!;
  const histListe = rod.querySelector<HTMLElement>("[data-testid='aidan-hist-liste']")!;
  const chipsEl = rod.querySelector<HTMLElement>(".aidan-chips")!;
  const hilsenHtml = msgs.innerHTML; // SSR-hilsnen — genbruges ved Ny samtale

  // ── F007.5: chatten følger kun med når brugeren står i bunden. Scroller man
  // op mens Aidan skriver, kæmpede hver SSE-bid før mod brugerens scroll
  // (Christians «blinker»-rapport) — nu lades man i fred, og en «↓ Nyt svar»-
  // pill hopper ned på klik. Egen besked/genindlæsning tvinger altid ned.
  const nytSvar = rod.querySelector<HTMLButtonElement>("[data-testid='aidan-nyt-svar']")!;
  let foelger = true;
  const rulNed = (tving = false) => {
    if (tving) {
      foelger = true;
      nytSvar.hidden = true;
    }
    if (foelger) msgs.scrollTop = msgs.scrollHeight;
    else nytSvar.hidden = false;
  };
  msgs.addEventListener(
    "scroll",
    () => {
      foelger = erNaerBunden(msgs.scrollTop, msgs.clientHeight, msgs.scrollHeight);
      if (foelger) nytSvar.hidden = true;
    },
    { passive: true },
  );
  nytSvar.addEventListener("click", () => rulNed(true));

  // ── F007.6: forslags-chippene fylder — de foldes ned når man vælger ét (eller
  // skriver selv), og en lille «Forslag»-pill folder dem ud igen.
  const foldPill = rod.querySelector<HTMLButtonElement>("[data-testid='aidan-chips-fold']")!;
  let pillAktiv = false;
  const foldChips = (ned: boolean, aktiv = true) => {
    pillAktiv = aktiv;
    chipsEl.classList.toggle("foldet", ned);
    foldPill.classList.toggle("aaben", !ned);
    foldPill.hidden = !aktiv;
  };
  foldPill.addEventListener("click", () => foldChips(!chipsEl.classList.contains("foldet")));
  // F007.14: forslagene starter FOLDET — også på en helt frisk første åbning
  // (visSamtale-stien rammes kun ved genindlæsning, målt i Lens-run 073bf595).
  foldChips(true);

  // ── F007.7/F007.8: oplæsning af indsigter + persona-valg. Tilbuddet vises
  // KUN når svaret linker til en news post — facitlisten kommer fra serveren,
  // og serveren afviser alt andet uanset hvad klienten sender.
  const infoKnap = rod.querySelector<HTMLButtonElement>("[data-testid='aidan-info-knap']")!;
  const infoPop = rod.querySelector<HTMLElement>("[data-testid='aidan-info-popover']")!;
  const persona = (): "aidan" | "airina" =>
    document.cookie.includes("aidan_persona=airina") ? "airina" : "aidan";
  const markerPersona = () => {
    infoPop.querySelectorAll<HTMLButtonElement>(".aidan-persona").forEach((k) =>
      k.classList.toggle("valgt", k.dataset.persona === persona()),
    );
  };
  // F007.8.2 (Christian: «Det er også meningen at du skifter til Airina som
  // figur») — hele fladen følger valget: figur, navn, boble, hilsen, disclaimer.
  const hilsenEl = () => msgs.querySelector<HTMLElement>(".aidan-msg.fra-aidan");
  const anvendPersona = () => {
    const p = persona();
    const d = rod.dataset;
    rod.classList.toggle("persona-airina", p === "airina");
    const navnEl = rod.querySelector<HTMLElement>(".aidan-navn-tekst");
    if (navnEl) navnEl.textContent = (p === "airina" ? d.navnAirina : d.navnAidan) ?? "";
    boble.textContent = (p === "airina" ? d.bobleAirina : d.bobleAidan) ?? "";
    const fod = rod.querySelector<HTMLElement>(".aidan-fod");
    if (fod) fod.textContent = (p === "airina" ? d.disclaimerAirina : d.disclaimerAidan) ?? "";
    // Hilsnen skiftes kun mens den stadig ER hilsnen (før første svar).
    const h = hilsenEl();
    if (h && historik.length === 0) h.textContent = (p === "airina" ? d.hilsenAirina : d.hilsenAidan) ?? "";
    felt.placeholder = (p === "airina" ? d.placeholderAirina : d.placeholderAidan) ?? felt.placeholder;
  };
  infoKnap.addEventListener("click", () => {
    infoPop.hidden = !infoPop.hidden;
    if (!infoPop.hidden) markerPersona();
  });
  rod.querySelector<HTMLButtonElement>("[data-testid='aidan-om-luk']")?.addEventListener("click", () => {
    infoPop.hidden = true;
  });
  infoPop.querySelectorAll<HTMLButtonElement>(".aidan-persona").forEach((k) =>
    k.addEventListener("click", () => {
      // Christians eksplicitte valg: cookie (ikke localStorage) — 1 år.
      document.cookie = `aidan_persona=${k.dataset.persona ?? "aidan"}; max-age=31536000; path=/; samesite=lax`;
      markerPersona();
      // Et valg ER en afslutning (Christian 4/9: «Den skal lukke når jeg
      // vælger Airina») — kort pause så man når at SE markeringen flytte sig.
      anvendPersona();
      // F007.13 (13): håndover som SCENE — figurerne krydsfader.
      rod.classList.add("haandover");
      setTimeout(() => rod.classList.remove("haandover"), 900);
      setTimeout(() => {
        infoPop.hidden = true;
      }, 350);
    }),
  );
  // Klik hvor som helst udenfor lukker også — den lille ⓘ og ESC var de
  // eneste veje ud, og det læses som «kan ikke lukke» (Christian 4/9).
  document.addEventListener("click", (e) => {
    if (infoPop.hidden) return;
    const t = e.target as Node;
    if (!infoPop.contains(t) && !infoKnap.contains(t)) infoPop.hidden = true;
  });

  let indsigter: Set<string> | null = null;
  const hentIndsigter = async (): Promise<Set<string>> => {
    if (indsigter) return indsigter;
    try {
      const r = await fetch("/api/aidan/indsigter");
      indsigter = new Set<string>(((await r.json()) as { stier?: string[] }).stier ?? []);
    } catch {
      indsigter = new Set();
    }
    return indsigter;
  };
  let lyd: HTMLAudioElement | null = null;
  // F007.9: når afspilningen er i gang, tilbydes «få den tilsendt på mail».
  // Samtykket håndhæves på serveren — fluebenet her er kun UI.
  const visMailTilbud = (efter: HTMLElement, last: { sti?: string; tekst?: string }, overskrift?: string) => {
    if (rod.querySelector("[data-testid='aidan-mail-form']")) return;
    const d = rod.dataset;
    const form = document.createElement("form");
    form.className = "aidan-mail";
    form.dataset.testid = "aidan-mail-form";
    const hoved = document.createElement("b");
    hoved.textContent = overskrift ?? d.mailTilbud ?? "";
    const felt = document.createElement("input");
    felt.type = "email";
    felt.required = true;
    felt.placeholder = d.mailFelt ?? "";
    felt.dataset.testid = "aidan-mail-felt";
    const samtykke = document.createElement("label");
    samtykke.className = "aidan-samtykke";
    const boks = document.createElement("input");
    boks.type = "checkbox";
    boks.required = true;
    boks.className = "aidan-skjult-felt";
    boks.dataset.testid = "aidan-mail-samtykke";
    const tegnet = document.createElement("span");
    tegnet.className = "aidan-boks";
    samtykke.append(boks, tegnet, document.createTextNode(d.mailSamtykke ?? ""));
    const send = document.createElement("button");
    send.type = "submit";
    send.className = "aidan-banner-primaer";
    send.dataset.testid = "aidan-mail-send";
    send.textContent = d.mailSend ?? "";
    const status = document.createElement("small");
    status.className = "aidan-mail-status";
    status.dataset.testid = "aidan-mail-status";
    form.append(hoved, felt, samtykke, send, status);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      send.disabled = true;
      status.textContent = "…";
      status.classList.remove("fejl");
      try {
        const res = await fetch(last.tekst ? "/api/aidan/send-svar" : "/api/aidan/send-lyd", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...last, locale: samtaleSprog, persona: persona(), email: felt.value.trim(), samtykke: boks.checked }),
        });
        if (!res.ok) throw new Error(String(res.status));
        form.replaceChildren(Object.assign(document.createElement("b"), { textContent: d.mailSendt ?? "" }));
      } catch {
        status.textContent = d.mailFejl ?? "";
        status.classList.add("fejl");
        send.disabled = false;
      }
    });
    efter.insertAdjacentElement("afterend", form);
    rulNed();
  };
  const tilbydOplaesning = async (svarBoble: HTMLElement): Promise<void> => {
    try {
      const stier = await hentIndsigter();
      if (!stier.size) return;
      const sti = Array.from(svarBoble.querySelectorAll<HTMLAnchorElement>("a"))
        .map((a) => new URL(a.getAttribute("href") ?? "", location.origin).pathname)
        .find((p) => stier.has(p));
      if (!sti) return;
      const d = rod.dataset;
      const knap = document.createElement("button");
      knap.type = "button";
      knap.className = "aidan-laes";
      knap.dataset.testid = "aidan-laes-tilbud";
      knap.textContent = `\u{1F50A} ${d.laesTilbud ?? ""}`;
      let tilstand: "klar" | "henter" | "spiller" | "pause" = "klar";
      knap.addEventListener("click", async () => {
        if (tilstand === "henter") return;
        if (tilstand === "spiller") {
          lyd?.pause();
          tilstand = "pause";
          knap.textContent = `\u25B6 ${d.laesVidere ?? ""}`;
          return;
        }
        if (tilstand === "pause") {
          void lyd?.play();
          tilstand = "spiller";
          knap.textContent = `\u23F8 ${d.laesPause ?? ""}`;
          return;
        }
        tilstand = "henter";
        knap.textContent = d.laesHenter ?? "";
        try {
          const res = await fetch("/api/aidan/laes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sti, persona: persona() }),
          });
          if (!res.ok) throw new Error(String(res.status));
          lyd?.pause();
          lyd = new Audio(URL.createObjectURL(await res.blob()));
          lyd.addEventListener("ended", () => {
            tilstand = "klar";
            knap.textContent = `\u{1F50A} ${d.laesTilbud ?? ""}`;
          });
          await lyd.play();
          tilstand = "spiller";
          knap.textContent = `\u23F8 ${d.laesPause ?? ""}`;
          visMailTilbud(knap, { sti });
        } catch {
          tilstand = "klar";
          knap.textContent = d.laesFejl ?? "";
          setTimeout(() => {
            if (tilstand === "klar") knap.textContent = `\u{1F50A} ${d.laesTilbud ?? ""}`;
          }, 4000);
        }
      });
      svarBoble.insertAdjacentElement("afterend", knap);
      rulNed();
    } catch {
      /* tilbuddet må aldrig vælte chatten */
    }
  };

  let historik: Tur[] = [];
  const gem = () => void gemAktiv(historik);

  const boblEl = (cls: string) => {
    const d = document.createElement("div");
    d.className = `aidan-msg ${cls}`;
    msgs.appendChild(d);
    rulNed();
    return d;
  };
  const visSamtale = (beskeder: Tur[]) => {
    msgs.innerHTML = hilsenHtml;
    historik = [...beskeder];
    for (const t of historik) {
      const d = boblEl(t.role === "user" ? "fra-mig" : "fra-aidan");
      if (t.role === "user") d.textContent = t.content;
      else {
        d.innerHTML = tilHtml(t.content);
        handlingsRaekke(d, t.content, t.t);
      }
    }
    // F007.14: forslagene er FOLDET som default — brugeren folder selv ud.
    foldChips(true);
    rulNed(true);
  };
  const nySamtale = () => {
    saetAktiv(null);
    visSamtale([]);
    banner.hidden = true;
    lukHistorik();
    anvendPersona(); // hilsnen kom fra SSR-html'en (Aidans) — mal personaens
  };

  // Velkommen tilbage: kun når der FINDES en tidligere samtale med indhold.
  const seneste = aktivId() ? hentSamtale(aktivId()!) : listSamtaler()[0] ?? null;
  if (seneste && seneste.beskeder.length) {
    bannerTitel.textContent = seneste.titel;
    banner.hidden = false;
  }
  banner.querySelector("[data-testid='aidan-banner-fortsaet']")!.addEventListener("click", () => {
    saetAktiv(seneste!.id);
    visSamtale(seneste!.beskeder);
    banner.hidden = true;
  });
  banner.querySelector("[data-testid='aidan-banner-startny']")!.addEventListener("click", nySamtale);

  // ── Historik-visningen
  const en = locale === "en";
  const lukHistorik = () => {
    histVisning.hidden = true;
    msgs.hidden = false;
    chipsEl.hidden = false;
    foldPill.hidden = !pillAktiv;
  };
  const tegnHistorik = () => {
    histListe.innerHTML = "";
    const alle = listSamtaler();
    if (!alle.length) {
      const tom = document.createElement("div");
      tom.className = "aidan-hist-tom";
      tom.textContent = histListe.dataset.tomTekst ?? "";
      histListe.appendChild(tom);
      return;
    }
    for (const sam of alle) {
      const rk = document.createElement("div");
      rk.className = "aidan-hist-raekke";
      rk.dataset.testid = "aidan-hist-raekke";
      const tekst = document.createElement("div");
      tekst.className = "aidan-hist-tekst";
      const ti = document.createElement("div");
      ti.className = "aidan-hist-titel";
      ti.textContent = sam.titel;
      const meta = document.createElement("div");
      meta.className = "aidan-hist-meta";
      const ture = sam.beskeder.filter((b) => b.role === "user").length;
      meta.textContent = `${relativTid(sam.opdateret, en)} · ${ture} tur${ture === 1 ? "" : "e"}`;
      tekst.append(ti, meta);
      rk.appendChild(tekst);

      // Slet — husets inline-bekræftelse, aldrig en native dialog.
      const slet = document.createElement("button");
      slet.type = "button";
      slet.className = "aidan-hist-slet";
      slet.dataset.testid = "aidan-hist-slet";
      slet.textContent = "✕";
      slet.setAttribute("aria-label", en ? "Delete" : "Slet");
      slet.addEventListener("click", (e) => {
        e.stopPropagation();
        const spoerg = document.createElement("span");
        spoerg.className = "aidan-hist-spoerg";
        spoerg.textContent = en ? "Delete?" : "Slet?";
        const ja = document.createElement("button");
        ja.type = "button";
        ja.className = "aidan-hist-ja";
        ja.dataset.testid = "aidan-hist-ja";
        ja.textContent = en ? "Yes" : "Ja";
        const nej = document.createElement("button");
        nej.type = "button";
        nej.className = "aidan-hist-nej";
        nej.dataset.testid = "aidan-hist-nej";
        nej.textContent = en ? "No" : "Nej";
        ja.addEventListener("click", (ev) => {
          ev.stopPropagation();
          sletSamtale(sam.id);
          tegnHistorik();
        });
        nej.addEventListener("click", (ev) => {
          ev.stopPropagation();
          spoerg.remove(); ja.remove(); nej.remove();
          slet.hidden = false;
        });
        slet.hidden = true;
        rk.append(spoerg, ja, nej);
      });
      rk.appendChild(slet);
      rk.addEventListener("click", () => {
        saetAktiv(sam.id);
        visSamtale(sam.beskeder);
        banner.hidden = true;
        lukHistorik();
      });
      histListe.appendChild(rk);
    }
  };
  rod.querySelector("[data-testid='aidan-historik-knap']")!.addEventListener("click", () => {
    if (histVisning.hidden) {
      tegnHistorik();
      histVisning.hidden = false;
      msgs.hidden = true;
      chipsEl.hidden = true;
      foldPill.hidden = true;
    } else {
      lukHistorik();
    }
  });
  rod.querySelector("[data-testid='aidan-ny']")!.addEventListener("click", nySamtale);
  anvendPersona(); // F007.8.2: cookie-valget gælder fra første maling

  // ── Fuldskærm (Eir-stil overlay)
  rod.querySelector("[data-testid='aidan-fuld']")!.addEventListener("click", () => {
    panel.classList.toggle("fuld");
  });

  // ── F007.13: dynamiske blokke + tilbud efter hvert svar ──────────────────
  const fyldTider = (host: HTMLElement) => {
    const en = samtaleSprog === "en";
    const dage = en ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] : ["søn", "man", "tir", "ons", "tor", "fre", "lør"];
    const tider: string[] = [];
    const d0 = new Date();
    for (let i = 1; tider.length < 3 && i < 10; i++) {
      const d = new Date(d0.getTime() + i * 86400000);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      tider.push(`${dage[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1} kl. ${tider.length === 1 ? "14:00" : "10:00"}`);
    }
    host.replaceChildren(...tider.map((t) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "aidan-tid-chip";
      b.dataset.testid = "aidan-tid-chip";
      b.textContent = t;
      return b;
    }));
  };
  const fyldStatus = async (host: HTMLElement) => {
    const ds = rod.dataset;
    try {
      const t0 = performance.now();
      const res = await fetch("/api/aidan/status");
      const ms = Math.round(performance.now() - t0);
      if (!res.ok) throw new Error();
      host.textContent = "🟢 " + (ds.statusOk ?? "").replace("{ms}", String(ms));
    } catch {
      host.textContent = ds.statusFejl ?? "";
    }
  };
  const konfetti = (host: HTMLElement) => {
    for (let i = 0; i < 14; i++) {
      const bit = document.createElement("i");
      bit.style.left = `${Math.random() * 100}%`;
      bit.style.animationDelay = `${Math.random() * 0.4}s`;
      bit.style.background = ["var(--blue)", "var(--blue-light)", "var(--orange)", "#f7bb2e"][i % 4];
      host.appendChild(bit);
    }
    setTimeout(() => host.replaceChildren(), 2200);
  };
  const visPaaSiden = (anker: string) => {
    const noeg = anker.trim().toLowerCase();
    const kandidat = Array.from(document.querySelectorAll<HTMLElement>("main h1, main h2, main h3, main h4, main p, main li"))
      .find((el) => (el.textContent ?? "").toLowerCase().includes(noeg));
    if (!kandidat) return;
    if (matchMedia("(max-width: 560px)").matches) lukPanel();
    kandidat.scrollIntoView({ behavior: "smooth", block: "center" });
    kandidat.classList.add("aidan-fremhaev");
    setTimeout(() => kandidat.classList.remove("aidan-fremhaev"), 2600);
  };
  const efterSvar = (svarBoble: HTMLElement, tekst: string) => {
    const ds = rod.dataset;
    // Dynamiske værts-elementer markøren efterlod:
    svarBoble.querySelectorAll<HTMLElement>(".aidan-tider").forEach(fyldTider);
    svarBoble.querySelectorAll<HTMLElement>(".aidan-status").forEach((h) => void fyldStatus(h));
    svarBoble.querySelectorAll<HTMLElement>(".aidan-fejr").forEach(konfetti);
    const sprog = svarBoble.querySelector<HTMLElement>(".aidan-sprogskifte");
    if (sprog?.dataset.sprog === "en" || sprog?.dataset.sprog === "da") samtaleSprog = sprog.dataset.sprog;
    // (14) «Send dette svar til mig» — diskret linje under svaret.
    const mailKnap = document.createElement("button");
    mailKnap.type = "button";
    mailKnap.className = "aidan-svar-mail";
    mailKnap.dataset.testid = "aidan-svar-mail";
    mailKnap.textContent = "✉ " + (ds.svarMail ?? "");
    mailKnap.addEventListener("click", () => {
      mailKnap.remove();
      visMailTilbud(svarBoble, { tekst }, ds.svarMail);
    });
    svarBoble.insertAdjacentElement("afterend", mailKnap);
    // (17) opsummerings-chip efter 3+ brugerture — én gang pr. samtale.
    if (!opsummerVist && historik.filter((t) => t.role === "user").length >= 3) {
      opsummerVist = true;
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "aidan-chip";
      chip.dataset.testid = "aidan-opsummer";
      chip.textContent = ds.opsummer ?? "";
      chip.addEventListener("click", () => {
        chip.remove();
        void spoerg(samtaleSprog === "en" ? "Summarise our conversation in 3 short bullets" : "Opsummér vores samtale i 3 korte punkter");
      });
      mailKnap.insertAdjacentElement("afterend", chip);
    }
    rulNed();
  };
  // Delegation: valg-chips, tid-chips og vis-knapper inde i svarene.
  msgs.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    const valg = t.closest<HTMLElement>(".aidan-valg-chip");
    if (valg) return void spoerg(valg.textContent?.trim() ?? "");
    const tid = t.closest<HTMLElement>(".aidan-tid-chip");
    if (tid) return void spoerg((rod.dataset.tidBesked ?? "{tid}").replace("{tid}", tid.textContent?.trim() ?? ""));
    const vis = t.closest<HTMLElement>(".aidan-vis");
    if (vis) visPaaSiden(vis.dataset.anker ?? "");
  });

  // ── F007.14: handlingsrække under hvert Aidan-svar (ejerens screenshot:
  // kopiér · 👍/👎 · tidsstempel — INGEN retry). Tidsstemplet renderes i
  // beskuerens egen zone (browser-side toLocaleTimeString er korrekt her).
  const KOPI_SVG = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  const TOMMEL_SVG = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>';
  const handlingsRaekke = (boble: HTMLElement, tekst: string, tid?: number) => {
    if (boble.nextElementSibling?.classList.contains("aidan-handlinger")) return;
    const ds = rod.dataset;
    const rk = document.createElement("div");
    rk.className = "aidan-handlinger";
    const kop = document.createElement("button");
    kop.type = "button";
    kop.className = "aidan-handling";
    kop.dataset.testid = "aidan-kopier";
    kop.title = ds.kopier ?? "";
    kop.setAttribute("aria-label", ds.kopier ?? "");
    kop.innerHTML = KOPI_SVG;
    kop.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(tekst);
        kop.innerHTML = "";
        kop.append(Object.assign(document.createElement("span"), { textContent: ds.kopieret ?? "" }));
        setTimeout(() => (kop.innerHTML = KOPI_SVG), 1400);
      } catch {
        kop.classList.add("fejl");
      }
    });
    rk.appendChild(kop);
    for (const retning of ["op", "ned"] as const) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `aidan-handling${retning === "ned" ? " vend" : ""}`;
      b.dataset.testid = `aidan-tommel-${retning}`;
      b.setAttribute("aria-label", retning === "op" ? "👍" : "👎");
      b.innerHTML = TOMMEL_SVG;
      b.addEventListener("click", async () => {
        rk.querySelectorAll(".aidan-handling.tommel-valgt").forEach((x) => x.classList.remove("tommel-valgt"));
        b.classList.add("tommel-valgt");
        try {
          await fetch("/api/aidan/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ retning, uddrag: tekst.slice(0, 160), locale: samtaleSprog }),
          });
        } catch {}
      });
      rk.appendChild(b);
    }
    if (tid) {
      const ts = document.createElement("span");
      ts.className = "aidan-tid";
      ts.textContent = new Date(tid).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
      rk.appendChild(ts);
    }
    boble.insertAdjacentElement("afterend", rk);
  };
  // (transskript-tilbuddet efter ≥4 brugerture — én gang pr. samtale)
  let transTilbudt = false;
  const transskript = () =>
    historik.map((t) => `${t.role === "user" ? "Du" : "Aidan"}: ${t.content}`).join("\n\n").slice(0, 8000);
  // Kontekst-hilsen (F007.14): første åbning UDEN samtale → hilsnen udvides
  // med et par venlige linjer om den side der lige er læst. Bygget med
  // textContent — sidens titel må aldrig blive til HTML.
  let hilsenUdvidet = false;
  const udvidHilsen = () => {
    if (hilsenUdvidet || historik.length) return;
    const ds = rod.dataset;
    const titel = (ds.sideTitel ?? "").trim();
    const skabelon = ds.hilsenSide ?? "";
    if (!titel || !skabelon) return;
    const h = hilsenEl();
    if (!h) return;
    hilsenUdvidet = true;
    const linje = document.createElement("span");
    linje.className = "aidan-hilsen-side";
    linje.textContent = skabelon.replace("{titel}", titel);
    h.append(document.createElement("br"), linje);
  };

  let travl = false;
  // F007.13 (19): [sprog:]-markøren skifter samtalens sprog for de FØLGENDE
  // kald — sidens chrome beholder sidens locale (ærlig grænse; fuld
  // flade-skifte er en sidenavigation til /en).
  let samtaleSprog = locale;
  let opsummerVist = false;
  async function spoerg(tekst: string, gentag = false) {
    if (travl || !tekst.trim()) return;
    travl = true;
    send.disabled = true;
    foldChips(true);
    rulNed(true);
    if (!gentag) {
      boblEl("fra-mig").textContent = tekst;
      historik.push({ role: "user", content: tekst, t: Date.now() });
      gem();
    }

    const taenker = document.createElement("div");
    taenker.className = "aidan-taenker";
    taenker.innerHTML = "<i></i><i></i><i></i>";
    msgs.appendChild(taenker);
    rulNed();

    let svar = "";
    let svarEl: HTMLElement | null = null;
    // F007.13 (18): venlig fejl-tilstand med Prøv igen — aldrig en død chat.
    const fejl = (status?: number) => {
      taenker.remove();
      const ds = rod!.dataset;
      const d = boblEl("fra-aidan");
      d.textContent =
        status === 429
          ? (ds.travlt ?? "")
          : locale === "en"
            ? "Something went wrong on my end — try again in a moment."
            : "Noget gik galt i min ende — prøv igen om lidt.";
      const igen = document.createElement("button");
      igen.type = "button";
      igen.className = "aidan-cta";
      igen.dataset.testid = "aidan-fejl-retry";
      igen.textContent = ds.fejlRetry ?? "";
      igen.addEventListener("click", () => {
        d.remove();
        void spoerg(tekst, true);
      });
      d.append(document.createElement("br"), igen);
    };
    try {
      const res = await fetch("/api/aidan/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historik.slice(-20), locale: samtaleSprog, persona: persona() }),
      });
      if (!res.ok || !res.body) return fejl(res.status);
      const laeser = res.body.getReader();
      const dek = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await laeser.read();
        if (done) break;
        buffer += dek.decode(value, { stream: true });
        // SSE-rammer: "event: x\ndata: {...}\n\n"
        let i: number;
        while ((i = buffer.indexOf("\n\n")) >= 0) {
          const ramme = buffer.slice(0, i);
          buffer = buffer.slice(i + 2);
          const ev = /^event: (\w+)$/m.exec(ramme)?.[1];
          const data = /^data: (.*)$/m.exec(ramme)?.[1];
          if (ev === "text" && data) {
            taenker.remove();
            svar += String(JSON.parse(data).delta ?? "");
            if (!svarEl) svarEl = boblEl("fra-aidan");
            svarEl.innerHTML = tilHtml(svar);
            rulNed();
          } else if (ev === "status" && data) {
            // F007.13 (11): navngivne tænke-skridt i stedet for anonyme prikker.
            const trin = String(JSON.parse(data).trin ?? "");
            taenker.replaceChildren(Object.assign(document.createElement("span"), { className: "aidan-trin", textContent: trin }));
            for (let k = 0; k < 3; k++) taenker.appendChild(document.createElement("i"));
          } else if (ev === "error") {
            if (!svar) fejl();
          }
        }
      }
      if (svar) {
        historik.push({ role: "assistant", content: svar, t: Date.now() });
        gem();
        if (svarEl) {
          void tilbydOplaesning(svarEl);
          efterSvar(svarEl, svar);
          handlingsRaekke(svarEl, svar, Date.now());
          if (!transTilbudt && historik.filter((t) => t.role === "user").length >= 4) {
            transTilbudt = true;
            const tb = document.createElement("button");
            tb.type = "button";
            tb.className = "aidan-svar-mail";
            tb.dataset.testid = "aidan-trans-tilbud";
            tb.textContent = "✉ " + (rod!.dataset.transTilbud ?? "");
            tb.addEventListener("click", () => {
              tb.remove();
              visMailTilbud(svarEl!, { tekst: transskript() }, rod!.dataset.transTilbud);
            });
            svarEl.parentElement?.appendChild(tb);
            rulNed();
          }
        }
      } else if (!svarEl) {
        fejl();
      }
    } catch {
      if (!svar) fejl();
    } finally {
      taenker.remove();
      travl = false;
      send.disabled = false;
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const t = felt.value.trim();
    felt.value = "";
    void spoerg(t);
  });
  rod.querySelectorAll<HTMLButtonElement>(".aidan-chip").forEach((chip) =>
    chip.addEventListener("click", () => void spoerg(chip.textContent?.trim() ?? "")),
  );
}


// F008.2 — featured-båndet roterer roligt mellem alle featured (ejer-note B).
function featuredBaand() {
  const baand = document.querySelector<HTMLElement>("[data-testid='featured-baand']");
  if (!baand) return;
  const punkter = Array.from(baand.querySelectorAll<HTMLAnchorElement>(".f-baand-punkt"));
  const prikker = Array.from(baand.querySelectorAll<HTMLElement>(".f-prikker i"));
  const laes = baand.querySelector<HTMLAnchorElement>("[data-testid='featured-baand-laes']");
  if (punkter.length < 2) return;
  let akt = 0;
  setInterval(() => {
    akt = (akt + 1) % punkter.length;
    punkter.forEach((p, i) => p.classList.toggle("akt", i === akt));
    prikker.forEach((p, i) => p.classList.toggle("akt", i === akt));
    if (laes) laes.href = punkter[akt].href;
  }, 6000);
}

function safe(fn: () => void) {
  try {
    fn();
  } catch (e) {
    console.error("[enhance]", e);
  }
}
safe(mobileNav);
  safe(featuredBaand);
safe(smoothScroll);
safe(countUps);
safe(heroSlides);
safe(reducedMotion);
safe(themeToggle);
safe(figurKlip);
safe(mountCmdk);
safe(faqAccordion);
safe(mountTurnstile);
safe(contactForm);
safe(inlineEdit);
safe(adminPanel);
safe(mountAdminChat);
safe(aidan);
