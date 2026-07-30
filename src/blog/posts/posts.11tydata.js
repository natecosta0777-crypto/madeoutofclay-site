/**
 * Directory data for blog posts.
 * Drafts (draft: true) are fully excluded: no output file, not in any
 * collection, not in the sitemap. Flip draft to false (or remove it) to publish.
 */
module.exports = {
  layout: "layouts/post.njk",
  tags: ["posts"],
  eleventyComputed: {
    metaTitle: (data) => {
      const title = String(data.title || "");
      if (title.length <= 58) return title;
      const short = title.split(/\s+[—|:]\s+/)[0];
      if (short.length >= 30 && short.length <= 58) return short;
      return `${title.slice(0, 55).replace(/\s+\S*$/, "")}…`;
    },
    metaDescription: (data) => {
      const description = String(data.description || "");
      if (description.length <= 155) return description;
      return `${description.slice(0, 152).replace(/\s+\S*$/, "")}…`;
    },
    ogImage: (data) => `/assets/og/posts/${data.page.fileSlug}.png`,
    breadcrumbs: (data) => [
      { name: "Home", url: "/" },
      { name: "Blog", url: "/blog/" },
      { name: data.title, url: `/blog/${data.page.fileSlug}/` },
    ],
    permalink: (data) =>
      data.draft ? false : `/blog/${data.page.fileSlug}/`,
    eleventyExcludeFromCollections: (data) =>
      data.draft ? true : (data.eleventyExcludeFromCollections || false),
  },
};
