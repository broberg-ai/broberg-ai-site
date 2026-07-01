/* Contact-form Turnstile island (F156.6). The form itself is SSR'd + wired
   via vanilla DOM in enhance.ts (contactForm()) — this is the one bit that
   needs a live Preact tree (the widget script calls back into component
   state). The bridge back to the vanilla submit handler is a hidden input:
   this island writes the solved token into #cf-turnstile-token, and listens
   for a "turnstile:reset" window event so enhance.ts can ask it to reset
   the widget after a failed submit. */
import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { useTurnstile } from "@broberg/forms-turnstile/preact";

const SCHEMA_URL = "https://webhouse.app/api/forms/contact/schema?site=broberg-ai";

// Fetch-once module cache — a remount (rare, but cheap to guard) reuses the
// same in-flight/settled promise instead of re-fetching the public schema.
let siteKeyPromise: Promise<string | null> | null = null;
function fetchSiteKey(): Promise<string | null> {
  if (!siteKeyPromise) {
    siteKeyPromise = fetch(SCHEMA_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (d && typeof d.turnstileSiteKey === "string" ? d.turnstileSiteKey : null))
      .catch(() => null);
  }
  return siteKeyPromise;
}

function TurnstileWidget() {
  const [siteKey, setSiteKey] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchSiteKey().then((k) => {
      if (!cancelled) setSiteKey(k);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Tell the vanilla submit handler (enhance.ts contactForm()) whether a
  // widget is actually active, once we know — it can't infer this from DOM
  // shape alone (the wrapper div this component renders always exists).
  useEffect(() => {
    const root = document.getElementById("contact-turnstile-root");
    if (root && siteKey) root.dataset.turnstileActive = "true";
  }, [siteKey]);

  const { widgetRef, token, reset } = useTurnstile(siteKey);

  useEffect(() => {
    const input = document.getElementById("cf-turnstile-token") as HTMLInputElement | null;
    if (input) input.value = token;
  }, [token]);

  useEffect(() => {
    const onReset = () => reset();
    window.addEventListener("turnstile:reset", onReset);
    return () => window.removeEventListener("turnstile:reset", onReset);
  }, [reset]);

  return <div ref={widgetRef} data-testid="contact-form-captcha" />;
}

export function mountTurnstile() {
  const root = document.getElementById("contact-turnstile-root");
  if (!root) return;
  render(<TurnstileWidget />, root);
}
