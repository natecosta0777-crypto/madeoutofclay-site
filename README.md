# Made Out of Clay Productions — website

Static marketing/catalog site for the children's picture-book imprint
**Made Out of Clay Productions** (pen name *Isaiah Hartwell*). Built with
[Eleventy](https://www.11ty.dev/) — pure static HTML/CSS output, no client-side
framework, fast by default. Every page renders from one central data source.

Live target domain: **https://madeoutofclayprod.com**

---

## Quick start

```bash
npm install
npm run dev      # local dev server with live reload → http://localhost:8080
npm run build    # production build → _site/
```

First clone also needs placeholder art (committed already, but to regenerate
any missing covers): `node tools/gen-placeholders.js`.

---

## The one file you'll edit most: `src/_data/site.js`

This is the single source of truth for every ID, endpoint, and brand fact.
Change a value here and it propagates everywhere. Each is safe to leave blank —
the site degrades gracefully (no broken markup, no dangling params).

| Setting | What it does | Spec / Open Decision |
|---|---|---|
| `associateTag` | Amazon Associates store ID. Appended as `?tag=` to **every** buy link. Blank = clean untagged links. | #1 |
| `ga4Id` | GA4 Measurement ID (`G-XXXX`). Blank = no analytics emitted. | #5 |
| `metaPixelId` | Meta Pixel ID. Blank = no pixel. | #5 |
| `newsletterAction` | ESP form POST URL (Mailchimp/Kit/etc). Blank = newsletter shows "coming soon". | #2 |
| `contactAction` | Contact form endpoint (Formspree/Basin/Web3Forms). Blank = contact page shows a mailto fallback. | #3 |
| `amazonAuthorUrl` | Amazon Author Central profile. Adds "Follow on Amazon" + schema `sameAs`. | #5.3 |

> **Nothing here is hard-coded anywhere else.** Setting `associateTag` once tags
> all 8 live buy links. Setting `ga4Id` once turns on consent-gated analytics
> site-wide.

### Recommended resolutions for the spec's OPEN DECISIONS
1. **Associates** — apply for Amazon Associates, then set `associateTag`. Until then links earn KDP royalty only (still fully functional). One-line change later.
2. **ESP** — Mailchimp or Kit (ConvertKit). Paste the embedded-form *action* URL into `newsletterAction`; confirm the email field is named `email` (adjust `src/_includes/partials/newsletter.njk` if your ESP uses a different field name).
3. **Contact backend** — Formspree is the fastest path for a static site. Create a form, paste its endpoint into `contactAction`.
4. **Lead magnet** — not yet built. Recommended: a printable coloring pack PDF from *Just the Way You Are*. Drop the PDF at `src/assets/printables/` and add a `/free` opt-in page (scaffold on request).
5. **GA4 + Pixel** — create GA4 first; set `ga4Id`. Add `metaPixelId` only when running Meta ads.
6. **Reviews** — only real reviews. Add objects to `src/_data/reviews.json` as `{ "rating": 5, "quote": "…", "source": "Verified Amazon Review" }`. Empty = the block hides itself.
7. **Direct sales** — Amazon-only for now (no change needed).
8. **Hosting** — see Deploy below.

---

## Editing content

- **Books** — `src/_data/books.json` (title, slug, ASIN, series, status, blurb, themes, cover, alt). This drives the homepage grid, `/books`, series pages, sitemap, and Book schema.
- **Series** — `src/_data/series.json` (names, taglines, blurbs, SEO titles/descriptions, accent colors).
- **FAQs** — `src/_data/faqs.json` (drives the FAQ block **and** FAQPage schema).
- **Author / Press bios** — `src/author.njk`, `src/press.njk` *(contain placeholder bio copy — replace before launch).*
- **Blog** — `src/blog/posts/*.md`. Two posts are live; six are drafts (`draft: true`) with briefs/outlines ready to finish. Drafts produce no output file and stay out of the sitemap until you flip `draft: false`.

> Book blurbs and author bio are **draft placeholder copy** (marked in the data).
> Review and replace before promoting.

### Real cover art
Placeholder SVG covers live in `src/assets/covers/`. To use real art, drop the
files in and update each book's `cover` path in `books.json`. Real OG share image:
replace `src/assets/og/default.svg` with a 1200×630 PNG and point `ogImage` at it
(per-page `ogImage` front matter also supported).

---

## What's implemented from the spec sheet

- ✅ Central book data; zero hard-coded Amazon URLs outside `books.json` (§1.1–1.2)
- ✅ Direct, tagged Amazon buy links everywhere; `rel="sponsored noopener"`, new tab; "Coming Soon" disabled state (§1.1–1.3)
- ✅ Newsletter (hero + footer) and contact forms with honeypot, inline status, analytics events — wired to config endpoints (§1.4, §1.6)
- ✅ Per-book anchor targets on `/books` (§1.7)
- ✅ Social-proof + trust components, empty-state safe (§2)
- ✅ Consent-gated GA4 + Meta Pixel; `track()` wrapper; the 6 custom events; `sendBeacon` on outbound Amazon clicks (§3)
- ✅ Full head metadata per route: unique title, description, canonical, OG, Twitter (§4.1)
- ✅ One `<h1>` per page; logical headings (§4.2)
- ✅ `robots.txt` + `sitemap.xml` (§4.3)
- ✅ JSON-LD: Organization + WebSite, Book ×9, BreadcrumbList, FAQPage, Article (validated, 22 blocks parse clean) (§4.4)
- ✅ Image `width`/`height` + `loading="lazy"` + alt (§4.5)
- ✅ FAQ block + schema (§4.6)
- ✅ System-font stack, no render-blocking third-party scripts → CWV-friendly (§4.7)
- ✅ `/about` link fixed → points to `/author` (§4.8)
- ✅ Blog infra + content calendar (§5)

**Needs Nate's real values to go fully live:** `associateTag`, `ga4Id`,
`metaPixelId`, `newsletterAction`, `contactAction` (all in `site.js`); real cover
art + 1200×630 OG PNG; final book blurbs + author bio; real reviews.

---

## UTM convention (§3.4)

Tag campaign links so GA4 attributes them correctly:

```
https://madeoutofclayprod.com/?utm_source=<platform>&utm_medium=<type>&utm_campaign=<name>
```

- `utm_source` — `meta`, `google`, `pinterest`, `newsletter`, …
- `utm_medium` — `paid_social`, `cpc`, `email`, `organic_social`
- `utm_campaign` — short slug, e.g. `launch-jtwya`, `q3-bts`

UTMs flow into GA4 automatically once `ga4Id` is set.

---

## Deploy

The repo includes configs for all common hosts — pick one:

- **GitHub Pages** — `.github/workflows/deploy.yml` builds and deploys on every push to `main`. Enable: repo **Settings → Pages → Source: GitHub Actions**.
- **Netlify** — `netlify.toml` is preconfigured (`npm run build` → `_site`). Connect the repo and go.
- **Vercel** — `vercel.json` is preconfigured.
- **Cloudflare Pages** — build command `npm run build`, output dir `_site`.

After first deploy: submit `sitemap.xml` in **Google Search Console** (§4.3) and
run the homepage + a book page through the **Rich Results Test** (§4.4).

---

## Project structure

```
src/
  _data/        site.js (config), books.json, series.json, faqs.json,
                reviews.json, lookups.js (slug→object maps)
  _includes/    layouts/ (base, post) + partials/ (header, footer, nav,
                newsletter, consent, book-card, series-page, faq, reviews, trust)
  assets/       css/styles.css, js/main.js, covers/, og/
  series/       three series pages
  blog/         index + posts/
  *.njk         index, books, author, press, contact, 404, robots, sitemap
tools/          gen-placeholders.js, check-jsonld.js
```
