/* F025 — reservetekst for privatlivspolitikken.
 *
 * NØDBREMSE, IKKE HJEM. Teksten bor i CMS på globals-feltet `privacyHtml`;
 * det her er kun det der renderes hvis feltet slettes, så en juridisk side
 * aldrig bliver til en tom skærm. Se husets regel: tekst hører i CMS'et.
 *
 * HVERT FAKTUM HERUNDER ER MÅLT 18/9 2026, ikke skrevet efter skabelon:
 *   ingen Set-Cookie fra broberg.ai · ingen eksterne domæner i forsidens HTML
 *   databehandlere læst ud af koden · CVR slået op i det offentlige register
 * En politik der påstår mere end sitet gør, er værre end ingen politik. */

const OPDATERET_DA = "18. september 2026";
const OPDATERET_EN = "18 September 2026";

export const PRIVACY_DA = `
<p><em>Sidst opdateret ${OPDATERET_DA}.</em></p>

<p>broberg.ai er et <strong>åbent websted</strong>: du kan læse alt uden at
logge ind, vi viser ingen annoncer, og vi sporer dig ikke. Der er derfor kun få
steder, vi overhovedet behandler personoplysninger om dig. Denne side forklarer
hvilke, hvorfor, og hvordan du kommer af med dem igen.</p>
<p>Har du en konto i vores <strong>kundeportal</strong>, gælder afsnittet om
portalen herunder <em>oveni</em> resten.</p>

<h2>Dataansvarlig</h2>
<p>WEB HOUSE ApS<br>
Riberhusvej 9<br>
9492 Blokhus<br>
CVR: 21221198<br>
Kontakt: <a href="mailto:cb@broberg.ai">cb@broberg.ai</a></p>

<h2>Hvilke oplysninger vi behandler</h2>
<ul>
  <li><strong>Henvendelser til support.</strong> Skriver du til os — via
      formularen eller via Aidan-chatten — behandler vi det navn og den
      e-mailadresse eller det telefonnummer, du selv oplyser, sammen med
      teksten i din henvendelse. Navn og mindst én kontaktmåde er
      <em>påkrævet</em>: uden dem kan vi ikke svare dig.</li>
  <li><strong>Samtaler med Aidan.</strong> Det du skriver til vores
      AI-assistent sendes til en sprogmodel for at kunne besvares. Vi bruger
      ikke samtalerne til at træne modeller.</li>
  <li><strong>Tekniske data.</strong> Almindelige server-logs (IP-adresse,
      tidspunkt, hvilken side der blev hentet) af hensyn til drift og
      sikkerhed.</li>
</ul>
<p>Vi opretter ikke profiler, og vi sporer dig ikke på tværs af websteder.</p>

<h2>Hvorfor vi behandler dem</h2>
<ul>
  <li><strong>Legitim interesse (GDPR art. 6.1.f)</strong> — at kunne besvare
      en henvendelse du selv har sendt, og at holde sitet sikkert mod misbrug.</li>
  <li><strong>Opfyldelse af aftale (art. 6.1.b)</strong> — hvis din henvendelse
      fører til et samarbejde.</li>
  <li><strong>Retlig forpligtelse (art. 6.1.c)</strong> — bogføring efter
      bogføringsloven, hvis der bliver tale om en faktura.</li>
</ul>

<h2>Hvor længe vi gemmer dem</h2>
<ul>
  <li><strong>Supportsager:</strong> så længe sagen er åben, og derefter så
      længe det er nødvendigt for at kunne forstå en tidligere henvendelse.</li>
  <li><strong>Bogføringspligtige oplysninger:</strong> 5 år, som loven kræver.</li>
  <li><strong>Server-logs:</strong> kortvarigt, alene til drift og sikkerhed.</li>
</ul>

<h2>Hvem vi deler data med</h2>
<p>Vi sælger aldrig data. Vi anvender disse databehandlere:</p>
<ul>
  <li><strong>broberg.ai HelpDesk</strong> — vores eget supportsystem, hvor din
      henvendelse bliver til en sag.</li>
  <li><strong>Mistral AI (Frankrig, EU)</strong> — sprogmodellen bag Aidan.
      Valgt netop fordi den kører i EU.</li>
  <li><strong>Resend (USA, EU-godkendt)</strong> — udsendelse af e-mail, fx en
      kvittering på din henvendelse.</li>
  <li><strong>Cloudflare (USA, EU-godkendt)</strong> — Turnstile, den kontrol
      der holder robotter væk fra kontaktformularen.</li>
  <li><strong>Fly.io (Stockholm, EU)</strong> — hosting af selve sitet.</li>
</ul>

<h2>Kundeportalen</h2>
<p>Er du kunde, kan du få en konto i vores kundeportal, hvor du kan følge dine
egne sager, aftaler og løsninger ét sted. En konto oprettes kun efter aftale —
man kan ikke oprette sig selv.</p>
<ul>
  <li><strong>Hvad vi gemmer:</strong> dit navn, din e-mailadresse, din rolle hos
      kunden, og det indhold der hører til jeres eget samarbejde med os.</li>
  <li><strong>Hvad du ser:</strong> kun din egen virksomheds oplysninger. En
      konto giver aldrig indblik i andre kunders data.</li>
  <li><strong>Hvor længe:</strong> så længe samarbejdet består. Ophører det,
      lukkes kontoen, og oplysningerne slettes bortset fra det bogføringsloven
      kræver vi gemmer.</li>
  <li><strong>Retsgrundlag:</strong> opfyldelse af aftale (GDPR art. 6.1.b).</li>
</ul>
<p>Portalen er under opbygning. Udvides den med funktioner der behandler flere
oplysninger end ovenstående, opdateres dette afsnit, før funktionen åbner.</p>

<h2>Når vi behandler data for vores kunder</h2>
<p>Bygger og driver vi et website, en webshop eller en platform for dig, er du
<strong>dataansvarlig</strong> for dine egne brugeres oplysninger, og vi er
<strong>databehandler</strong>. Det forhold sættes på skrift i en
databehandleraftale, før vi rører data — den beskriver hvad vi må, hvilke
underdatabehandlere der er i spil, og hvad der sker, når samarbejdet ophører.</p>
<p>Denne privatlivspolitik dækker <em>broberg.ai som virksomhed</em>. Den dækker
ikke de sites vi driver for andre; dér gælder kundens egen politik.</p>

<h2>Jobansøgninger</h2>
<p>Sender du en ansøgning — opfordret eller uopfordret — behandler vi det du selv
skriver, alene med henblik på at vurdere den. Vi sletter materialet senest seks
måneder efter afslutningen, medmindre du har sagt ja til at vi gemmer det længere.</p>

<h2>Når du forbinder en konto fra en anden platform</h2>
<p>Nogle af vores løsninger kan — kun når du selv beder om det — forbindes med
en konto hos en tredjepart, fx LinkedIn, så indhold kan udgives på dine vegne.</p>
<ul>
  <li>Vi anmoder kun om de <strong>rettigheder der er nødvendige</strong> for den
      funktion du har valgt, og vi beder aldrig om adgang til dine beskeder eller
      dit netværks personoplysninger.</li>
  <li>Vi gemmer det <strong>adgangstoken</strong> forbindelsen kræver, og den
      profil-identifikator der skal til for at vide hvis konto der er tale om.
      Tokenet opbevares krypteret.</li>
  <li>Vi <strong>videresælger ikke</strong> platformsdata, bruger dem ikke til
      annoncering og bruger dem ikke til at træne AI-modeller.</li>
  <li>Du kan <strong>afbryde forbindelsen når som helst</strong> — i den
      pågældende løsning eller i platformens egne indstillinger. Vi sletter
      tokenet og de tilhørende oplysninger, når forbindelsen afbrydes.</li>
</ul>
<p>Brug af LinkedIns API sker i overensstemmelse med LinkedIns
API Terms of Use og Platform Guidelines.</p>

<h2>Overførsel uden for EU/EØS</h2>
<p>Aidan og hostingen bliver inden for EU. To af vores leverandører — Resend og
Cloudflare — er amerikanske. Overførslen sker på grundlag af
EU-Kommissionens standardkontraktbestemmelser og leverandørernes certificering
under EU-US Data Privacy Framework.</p>

<h2>Sikkerhed</h2>
<p>Al trafik til og fra broberg.ai er krypteret (HTTPS). Adgang til
supportsystemet kræver godkendelse, og adgangsnøgler opbevares krypteret og
adskilt fra koden. Vi indsamler ikke oplysninger vi ikke har brug for — det er
den billigste sikkerhed der findes.</p>

<h2>Dine rettigheder</h2>
<p>Du har ret til indsigt, berigtigelse, sletning, begrænsning, indsigelse og
dataportabilitet. Skriv til
<a href="mailto:cb@broberg.ai">cb@broberg.ai</a>, så hjælper vi
dig — også hvis du blot vil have slettet en henvendelse igen.</p>
<p>Er du uenig i måden vi behandler dine oplysninger på, kan du klage til
<a href="https://www.datatilsynet.dk" target="_blank" rel="noopener">Datatilsynet</a>.</p>

<h2>Cookies</h2>
<p>broberg.ai sætter <strong>ingen cookies til sporing, statistik eller
annoncering</strong> — hverken vores egne eller tredjeparters. Der er derfor
ingen cookie-boks at klikke væk, og der er ingen samtykke at give eller trække
tilbage.</p>
<p>Logger du ind i kundeportalen, sættes én <strong>teknisk cookie</strong>, der
alene holder dig logget ind. Den er nødvendig for at portalen kan fungere, den
bruges ikke til andet, og den forsvinder når du logger ud.</p>

<h2>Ændringer</h2>
<p>Ændres denne politik, opdateres datoen øverst.</p>
`.trim();

export const PRIVACY_EN = `
<p><em>Last updated ${OPDATERET_EN}.</em></p>

<p>broberg.ai is an <strong>open website</strong>: you can read everything
without logging in, we show no advertising, and we do not track you. There are
therefore only a few places where we process personal data about you at all.
This page explains which, why, and how to have them removed again.</p>
<p>If you hold an account in our <strong>customer portal</strong>, the section on
the portal below applies <em>in addition</em> to the rest.</p>

<h2>Data controller</h2>
<p>WEB HOUSE ApS<br>
Riberhusvej 9<br>
9492 Blokhus, Denmark<br>
Company reg. (CVR): 21221198<br>
Contact: <a href="mailto:cb@broberg.ai">cb@broberg.ai</a></p>

<h2>What we process</h2>
<ul>
  <li><strong>Support enquiries.</strong> When you write to us — through the
      form or through the Aidan chat — we process the name and the email
      address or phone number you provide, together with the text of your
      message. A name and at least one way to reach you are
      <em>required</em>: without them we cannot answer you.</li>
  <li><strong>Conversations with Aidan.</strong> What you write to our AI
      assistant is sent to a language model so it can be answered. We do not
      use these conversations to train models.</li>
  <li><strong>Technical data.</strong> Ordinary server logs (IP address, time,
      which page was requested) for operations and security.</li>
</ul>
<p>We do not build profiles, and we do not track you across websites.</p>

<h2>Why we process them</h2>
<ul>
  <li><strong>Legitimate interest (GDPR art. 6.1.f)</strong> — answering an
      enquiry you sent us, and keeping the site safe from abuse.</li>
  <li><strong>Performance of a contract (art. 6.1.b)</strong> — if your enquiry
      leads to us working together.</li>
  <li><strong>Legal obligation (art. 6.1.c)</strong> — bookkeeping under Danish
      law, should an invoice be involved.</li>
</ul>

<h2>How long we keep them</h2>
<ul>
  <li><strong>Support cases:</strong> while the case is open, and afterwards
      for as long as it is needed to make sense of an earlier enquiry.</li>
  <li><strong>Bookkeeping records:</strong> 5 years, as Danish law requires.</li>
  <li><strong>Server logs:</strong> briefly, for operations and security only.</li>
</ul>

<h2>Who we share data with</h2>
<p>We never sell data. We use these processors:</p>
<ul>
  <li><strong>broberg.ai HelpDesk</strong> — our own support system, where your
      enquiry becomes a case.</li>
  <li><strong>Mistral AI (France, EU)</strong> — the language model behind
      Aidan, chosen precisely because it runs inside the EU.</li>
  <li><strong>Resend (USA, EU-approved)</strong> — sending email, such as a
      receipt for your enquiry.</li>
  <li><strong>Cloudflare (USA, EU-approved)</strong> — Turnstile, the check that
      keeps bots away from the contact form.</li>
  <li><strong>Fly.io (Stockholm, EU)</strong> — hosting of the site itself.</li>
</ul>

<h2>The customer portal</h2>
<p>If you are a client, you can be given an account in our customer portal, where
you can follow your own cases, agreements and solutions in one place. Accounts
are created by arrangement only — you cannot sign yourself up.</p>
<ul>
  <li><strong>What we store:</strong> your name, your email address, your role at
      the client, and the content belonging to your own engagement with us.</li>
  <li><strong>What you see:</strong> only your own company's data. An account
      never gives sight of another client's data.</li>
  <li><strong>For how long:</strong> for as long as the engagement lasts. When it
      ends the account is closed and the data deleted, except what Danish
      bookkeeping law requires us to keep.</li>
  <li><strong>Legal basis:</strong> performance of a contract (GDPR art. 6.1.b).</li>
</ul>
<p>The portal is being built. If it gains features that process more data than
the above, this section is updated before that feature opens.</p>

<h2>When we process data on behalf of our clients</h2>
<p>When we build and operate a website, a webshop or a platform for you, you are
the <strong>data controller</strong> for your own users' data and we are the
<strong>data processor</strong>. That relationship is put in writing in a data
processing agreement before we touch any data — it sets out what we may do,
which sub-processors are involved, and what happens when the engagement ends.</p>
<p>This privacy policy covers <em>broberg.ai as a company</em>. It does not cover
the sites we operate for others; there, the client's own policy applies.</p>

<h2>Job applications</h2>
<p>If you send us an application — solicited or not — we process what you write,
solely in order to assess it. We delete the material no later than six months
after the process ends, unless you have agreed that we may keep it longer.</p>

<h2>When you connect an account from another platform</h2>
<p>Some of our solutions can — only when you ask them to — be connected to a
third-party account, for example LinkedIn, so that content can be published on
your behalf.</p>
<ul>
  <li>We request only the <strong>permissions required</strong> for the feature
      you chose, and we never ask for access to your messages or to your
      network's personal data.</li>
  <li>We store the <strong>access token</strong> the connection requires, and the
      profile identifier needed to know whose account it is. The token is stored
      encrypted.</li>
  <li>We do <strong>not resell</strong> platform data, do not use it for
      advertising, and do not use it to train AI models.</li>
  <li>You can <strong>disconnect at any time</strong> — in the solution itself or
      in the platform's own settings. We delete the token and the associated
      data when the connection is revoked.</li>
</ul>
<p>Our use of the LinkedIn API complies with the LinkedIn API Terms of Use and
Platform Guidelines.</p>

<h2>Transfers outside the EU/EEA</h2>
<p>Aidan and the hosting stay inside the EU. Two of our providers — Resend and
Cloudflare — are US-based. Those transfers rely on the European Commission's
Standard Contractual Clauses and the providers' certification under the EU-US
Data Privacy Framework.</p>

<h2>Security</h2>
<p>All traffic to and from broberg.ai is encrypted (HTTPS). Access to the support
system requires authentication, and access keys are stored encrypted and
separately from the code. We do not collect data we do not need — the cheapest
security there is.</p>

<h2>Your rights</h2>
<p>You have the right of access, rectification, erasure, restriction, objection
and data portability. Write to
<a href="mailto:cb@broberg.ai">cb@broberg.ai</a> and we will help
you — including if you simply want an enquiry deleted again.</p>
<p>If you disagree with how we handle your data, you may complain to the Danish
Data Protection Agency
(<a href="https://www.datatilsynet.dk/english" target="_blank" rel="noopener">Datatilsynet</a>).</p>

<h2>Cookies</h2>
<p>broberg.ai sets <strong>no cookies for tracking, analytics or
advertising</strong> — neither our own nor any third party's. There is therefore
no cookie banner to dismiss, and no consent to give or withdraw.</p>
<p>If you log in to the customer portal, one <strong>technical cookie</strong> is
set, solely to keep you signed in. It is required for the portal to work, it is
used for nothing else, and it disappears when you log out.</p>

<h2>Changes</h2>
<p>If this policy changes, the date at the top is updated.</p>
`.trim();
