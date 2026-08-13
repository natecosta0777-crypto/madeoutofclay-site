# Measurement plan

Google Analytics is the single consent-gated client-side analytics system. Cloudflare may also provide first-party delivery and performance measurements at the edge. The child experience (`/clubhouse`, `/app`, `/reader`, `/characters`, and `/letters`) does not load Google Analytics.

## Primary outcomes

| Outcome | Event | Notes |
| --- | --- | --- |
| Homepage or catalog to product detail | `book_detail_view` | Count unique product-detail visits by title and series. |
| Product detail to Amazon | `buy_on_amazon_click` | Includes title, ASIN, series, and source page. |
| Main site to Book Club | `book_club_click` | Tracks the adult-facing handoff before leaving the main site. |
| Main site to school inquiry | `school_interest_click` | Tracks interest before the club-subdomain handoff. |
| Free preview intent | `preview_start` | Recorded on the adult-facing main site before the Reader opens. |
| Parent-note signup | `parent_note_signup` | Adult-facing Book Club landing page only. |
| School inquiry | `school_inquiry_submit` | Adult-facing schools page only. |
| Newsletter signup | `newsletter_signup` | Includes the page location. |

## Reporting

Review monthly:

1. Homepage-to-product-detail rate.
2. Product-detail-to-Amazon rate.
3. Main-site-to-Book-Club rate and parent-note signup rate.
4. Preview-start rate, using main-site intent rather than child Reader behavior.
5. School-interest-to-inquiry rate.

Do not add behavioral analytics to child-experience routes merely to improve funnel completeness.
