/**
 * SITE CONFIG — single source of truth for IDs, endpoints, and brand facts.
 *
 * Everything Nate needs to flip to "live" lives here. Change a value in this
 * one file and it propagates to every page. Items left blank degrade safely
 * (e.g. empty associateTag => clean Amazon links; empty ga4Id => no analytics
 * tag emitted). See the OPEN DECISIONS block in the spec sheet.
 */
module.exports = {
  name: "Made Out of Clay Productions",
  shortName: "Made Out of Clay",
  url: "https://madeoutofclayprod.com", // no trailing slash
  email: "clay@madeoutofclayprod.com",
  authorPenName: "Isaiah Hartwell",
  tagline: "Premium full-color picture books for the kids who feel things deeply.",
  description:
    "An independent children's picture-book imprint. Nine premium full-color picture books across three series, by Isaiah Hartwell.",

  // --- OPEN DECISION #1: Amazon Associates ---------------------------------
  // Provide your store ID (e.g. "madeoutofcl-20") to tag every buy link.
  // Leave "" to ship clean, untagged links (KDP royalty only).
  associateTag: "madeoutofclay-20", // same store ID the-review-group.com uses live

  // --- OPEN DECISION #5: Analytics -----------------------------------------
  ga4Id: "G-B4ZQX8FJ8J", // GA4 "Made Out of Clay Productions" — set 2026-07-07
  metaPixelId: "1719897139144003", // Meta Pixel "Made Out of Clay" — consent-gated
  metricoolHash: "9a57567d14513fb7d65dbe5bdc6e9372", // Metricool web tracker (Made Out of Clay brand) — consent-gated; first hash was another brand's, corrected 2026-07-08

  // --- OPEN DECISION #2: Email provider (ESP) ------------------------------
  // Paste the form ACTION url from your ESP's embedded form (Mailchimp/Kit/etc).
  // Leave "" and the newsletter forms render in a disabled "coming soon" state.
  // Beehiiv hosted subscribe endpoint (pub: madeoutofclay.beehiiv.com).
  // NOTE (2026-07-08): Beehiiv deprecated the direct POST-to-/subscribe method —
  // it now returns 405, so the old form silently failed. Use the EMBED iframe below instead.
  newsletterAction: "/api/subscribe/",

  // Newsletter now posts to our OWN serverless endpoint (api/subscribe.js), which talks to
  // the Beehiiv API server-side. Signup stays 100% on our branded site — no Beehiiv page,
  // no un-styleable green embed. Set BEEHIIV_API_KEY + BEEHIIV_PUB_ID in Vercel env.
  newsletterEmbed: "",

  // --- OPEN DECISION #3: Contact form backend ------------------------------
  // Formspree/Basin/Web3Forms endpoint. Leave "" to disable submit.
  contactAction: "https://api.web3forms.com/submit",

  // Social / ecosystem (OPEN DECISION #5.3)
  amazonAuthorUrl: "", // Amazon Author Central profile, if available

  // Brand facts used across schema + copy
  bookPrice: "13.99",
  currency: "USD",
  format: "Hardcover", // 8.5x8.5 premium full color
  language: "en",

  // Build stamp surfaced in footer / sitemap
  buildYear: new Date().getFullYear(),
};
