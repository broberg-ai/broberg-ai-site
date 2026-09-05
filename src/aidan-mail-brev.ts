/* Oplæsnings-mailens brev (F007.9.1) — bygget med husets mail-skal.
 *
 * Christian 5/9: «Mail skal desuden anvende den broberg.ai mail skabelon du
 * indsendte til cardmem, den eksterne» — dvs. enduser-skabelonen fra CMS'ets
 * mail/render.ts, som står i cardmems skabelon-register. Den er bygget på
 * @broberg/mail-core (renderShell + delene), så vi bruger SAMME skal direkte
 * frem for at håndkopiere en <table> — kopi nummer fire var præcis den fejl
 * vn-leker fandt hos sig selv.
 *
 * Ren funktion uden I/O, så brevet kan rendres i en test og ses i en browser.
 */
import { renderShell, eyebrow, heading, paragraph, cta, signOff, escapeHtml } from "@broberg/mail-core";

/** broberg.ai's mail-brand — sitets egen blå og skrifterne fra brand.css. */
const BRAND = {
  accentColor: "#00b2ff",
  fontSans: "'DM Sans',Arial,Helvetica,sans-serif",
} as const;

export function renderOplaesningsMail(input: {
  titel: string;
  url: string;
  persona: "aidan" | "airina";
  en: boolean;
}): { subject: string; html: string; text: string } {
  const { titel, url, en } = input;
  const navn = input.persona === "airina" ? "Airina" : "Aidan";
  const subject = en ? `Your reading: ${titel}` : `Din oplæsning: ${titel}`;
  const body =
    eyebrow(en ? "YOUR READING" : "DIN OPLÆSNING", { accentColor: BRAND.accentColor }) +
    heading(titel, { accentColor: BRAND.accentColor }) +
    paragraph(
      en
        ? `Hi! Here is the reading you asked for on broberg.ai — the audio file is attached, ready whenever you are.`
        : `Hej! Her er oplæsningen du bad om på broberg.ai — lydfilen er vedhæftet, klar når du er.`,
    ) +
    cta(url, en ? "Read the article" : "Læs artiklen", { accentColor: BRAND.accentColor }) +
    signOff(`— ${navn}`, en ? "AI guide at broberg.ai" : "AI-guide på broberg.ai", "");
  return {
    subject,
    html: renderShell({
      subject,
      preheader: en ? `The audio version of "${titel}" is attached` : `Lydudgaven af «${titel}» er vedhæftet`,
      lang: en ? "en" : "da",
      bodyHtml: body,
      accentColor: BRAND.accentColor,
      fontSans: BRAND.fontSans,
      footerLines: [en ? "Sent by broberg.ai's AI guide at your request" : "Sendt af broberg.ai's AI-guide på din anmodning"],
      footerHref: "https://broberg.ai",
      footerLabel: "broberg.ai",
    }),
    text: en
      ? `Hi!\n\nHere is the reading you asked for on broberg.ai: "${titel}".\nThe audio file is attached — the article itself lives at ${url}\n\n— ${navn}, AI guide at broberg.ai`
      : `Hej!\n\nHer er oplæsningen du bad om på broberg.ai: «${titel}».\nLydfilen er vedhæftet — selve artiklen bor på ${url}\n\n— ${navn}, AI-guide på broberg.ai`,
  };
}

export const _escapeHtml = escapeHtml;

/** F007.13 (14): «Send dette svar til mig» — chattens svar som pæn mail.
 *  svarHtml SKAL komme fra aidanTilHtml (escape-først), aldrig rå modeltekst. */
export function renderSvarMail(input: {
  svarHtml: string;
  persona: "aidan" | "airina";
  en: boolean;
}): { subject: string; html: string; text: string } {
  const { svarHtml, en } = input;
  const navn = input.persona === "airina" ? "Airina" : "Aidan";
  const subject = en ? `Your answer from ${navn} at broberg.ai` : `Dit svar fra ${navn} på broberg.ai`;
  const body =
    eyebrow(en ? "YOUR ANSWER" : "DIT SVAR", { accentColor: BRAND.accentColor }) +
    heading(en ? "From our chat" : "Fra vores samtale", { accentColor: BRAND.accentColor }) +
    `<div style="font-size:14px;line-height:1.65">${svarHtml}</div>` +
    cta("https://broberg.ai", en ? "Continue the conversation" : "Fortsæt samtalen", { accentColor: BRAND.accentColor }) +
    signOff(`— ${navn}`, en ? "AI guide at broberg.ai" : "AI-guide på broberg.ai", "");
  return {
    subject,
    html: renderShell({
      subject,
      preheader: en ? "The answer you asked to have sent" : "Svaret du bad om at få tilsendt",
      lang: en ? "en" : "da",
      bodyHtml: body,
      accentColor: BRAND.accentColor,
      fontSans: BRAND.fontSans,
      footerLines: [en ? "Sent by broberg.ai's AI guide at your request" : "Sendt af broberg.ai's AI-guide på din anmodning"],
      footerHref: "https://broberg.ai",
      footerLabel: "broberg.ai",
    }),
    text: en
      ? `Hi!\n\nHere is the chat answer you asked to have sent. Read it in your mail client — and continue at https://broberg.ai\n\n— ${navn}, AI guide at broberg.ai`
      : `Hej!\n\nHer er chat-svaret du bad om at få tilsendt. Læs det i din mailklient — og fortsæt på https://broberg.ai\n\n— ${navn}, AI-guide på broberg.ai`,
  };
}

