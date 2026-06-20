/**
 * Pre-built lookup maps so templates don't depend on Nunjucks `selectattr`
 * (which is a Jinja2 filter, not reliable in Eleventy's Nunjucks).
 *   lookups.seriesBySlug[slug]  -> series object
 *   lookups.booksBySeries[slug] -> array of books in that series (ordered)
 */
const series = require("./series.json");
const books = require("./books.json");

const seriesBySlug = Object.fromEntries(series.map((s) => [s.slug, s]));

const booksBySeries = {};
for (const s of series) booksBySeries[s.slug] = [];
for (const b of books) {
  if (!booksBySeries[b.series]) booksBySeries[b.series] = [];
  booksBySeries[b.series].push(b);
}
for (const slug of Object.keys(booksBySeries)) {
  booksBySeries[slug].sort((a, b) => (a.order || 0) - (b.order || 0));
}

module.exports = { seriesBySlug, booksBySeries };
