/**
 * Eleventy config — Made Out of Clay Productions
 * Static output, no client-side framework. Every page renders from src/_data.
 */
module.exports = function (eleventyConfig) {
  // Copy static assets straight through to the build output.
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/favicon.svg": "favicon.svg" });

  // --- Amazon link helper -------------------------------------------------
  // Single source of truth for buy-link shape. Appends the Associate tag
  // ONLY when one is configured (src/_data/site.js -> associateTag), so links
  // render clean with no dangling "?tag=" when the tag is empty. (Spec §1.2/§1.3)
  eleventyConfig.addFilter("amazonUrl", function (asin, associateTag) {
    if (!asin) return "";
    const base = "https://www.amazon.com/dp/" + asin;
    return associateTag ? base + "?tag=" + associateTag : base;
  });

  // Absolute URL for canonical / OG / sitemap. (Spec §4.1/§4.3)
  eleventyConfig.addFilter("absoluteUrl", function (path, base) {
    const b = (base || "").replace(/\/$/, "");
    const p = path && path.startsWith("/") ? path : "/" + (path || "");
    return b + p;
  });

  // ISO date for sitemap <lastmod>.
  eleventyConfig.addFilter("isoDate", function (date) {
    return new Date(date).toISOString().slice(0, 10);
  });

  // Strip HTML tags (for JSON-LD text fields that come from rich copy).
  eleventyConfig.addFilter("striptags", function (str) {
    return String(str || "").replace(/<[^>]*>/g, "");
  });

  // Human date for blog posts.
  eleventyConfig.addFilter("readableDate", function (date) {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  });

  // Collections
  eleventyConfig.addCollection("posts", function (api) {
    return api
      .getFilteredByGlob("src/blog/posts/*.md")
      .filter((p) => !p.data.draft)
      .sort((a, b) => b.date - a.date);
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"],
  };
};
