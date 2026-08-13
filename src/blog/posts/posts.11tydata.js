const fs = require("fs");
const path = require("path");

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
      if (title.length <= 60) return title;
      const naturalShort = title.split(/\s+[—|:]\s+/)[0];
      if (naturalShort.length >= 28 && naturalShort.length <= 60) return naturalShort;
      return title.slice(0, 60).replace(/\s+\S*$/, "");
    },
    metaDescription: (data) => {
      const description = String(data.description || "");
      if (description.length <= 155) return description;
      return `${description.slice(0, 152).replace(/\s+\S*$/, "")}…`;
    },
    ogImage: (data) => {
      const filename = `${data.page.fileSlug}.png`;
      const localPath = path.join(__dirname, "..", "..", "assets", "og", "posts", filename);
      return fs.existsSync(localPath) ? `/assets/og/posts/${filename}` : "/assets/og/default.png";
    },
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
