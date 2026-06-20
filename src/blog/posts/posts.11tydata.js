/**
 * Directory data for blog posts.
 * Drafts (draft: true) are fully excluded: no output file, not in any
 * collection, not in the sitemap. Flip draft to false (or remove it) to publish.
 */
module.exports = {
  layout: "layouts/post.njk",
  tags: ["posts"],
  eleventyComputed: {
    permalink: (data) =>
      data.draft ? false : `/blog/${data.page.fileSlug}/`,
    eleventyExcludeFromCollections: (data) =>
      data.draft ? true : (data.eleventyExcludeFromCollections || false),
  },
};
