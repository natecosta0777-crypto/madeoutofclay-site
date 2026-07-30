import fs from "node:fs";
import path from "node:path";

const repo = path.resolve(import.meta.dirname, "..");
const errors = [];
const warnings = [];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function decode(value) {
  return String(value)
    .replaceAll("&amp;", "&")
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;#39;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&mdash;", "—")
    .replaceAll("&ndash;", "–");
}

function countMatches(source, expression) {
  return [...source.matchAll(expression)].length;
}

function checkHtml(file, root, options = {}) {
  const source = fs.readFileSync(file, "utf8");
  const name = path.relative(root, file).replaceAll("\\", "/");
  const title = decode(source.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "");
  const description = decode(source.match(/<meta name="description" content="([^"]*)"/i)?.[1] || "");
  const canonicalCount = countMatches(source, /<link rel="canonical"/gi);
  const h1Count = countMatches(source, /<h1(?:\s|>)/gi);
  const ids = [...source.matchAll(/\sid="([^"]+)"/gi)].map((match) => match[1]);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];

  if (!title) errors.push(`${name}: missing title`);
  if (title.length > 60) errors.push(`${name}: title is ${title.length} characters`);
  if (!description && options.indexable) errors.push(`${name}: missing meta description`);
  if (description.length > 160) errors.push(`${name}: description is ${description.length} characters`);
  if (options.indexable && canonicalCount !== 1) errors.push(`${name}: expected one canonical, found ${canonicalCount}`);
  if (options.indexable && h1Count !== 1) errors.push(`${name}: expected one h1, found ${h1Count}`);
  if (duplicateIds.length) errors.push(`${name}: duplicate ids ${duplicateIds.join(", ")}`);

  for (const match of source.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(decode(match[1]).trim()); }
    catch (error) { errors.push(`${name}: invalid JSON-LD (${error.message})`); }
  }

  if (/googletagmanager\.com\/gtag\/js|tracker\.metricool\.com\/resources\/be\.js/.test(source) && options.noDirectAnalytics) {
    errors.push(`${name}: analytics source is present in initial HTML`);
  }

  for (const image of source.matchAll(/<img\b([^>]*)>/gi)) {
    if (!/\bwidth=/.test(image[1]) || !/\bheight=/.test(image[1])) {
      warnings.push(`${name}: image without explicit width and height`);
      break;
    }
  }
}

const mainRoot = path.join(repo, "_site");
for (const file of walk(mainRoot).filter((candidate) => candidate.endsWith(".html"))) {
  checkHtml(file, mainRoot, {
    indexable: !file.endsWith(`${path.sep}404.html`) && !file.endsWith("404.html"),
    noDirectAnalytics: true,
  });
}

const clubRoot = path.join(repo, "club");
const clubPublic = new Set([
  "index.html", "book-club.html", "schools.html", "characters.html", "printables.html",
  "privacy.html", "terms.html", "affiliate-disclosure.html", "how-we-make-money.html", "pricing.html",
]);
for (const file of walk(clubRoot).filter((candidate) => candidate.endsWith(".html"))) {
  checkHtml(file, clubRoot, {
    indexable: !path.relative(clubRoot, file).includes(path.sep) && clubPublic.has(path.basename(file)),
    noDirectAnalytics: true,
  });
}

const postOg = path.join(repo, "src", "assets", "og", "posts");
const postCount = walk(path.join(repo, "src", "blog", "posts")).filter((file) => file.endsWith(".md")).length;
const ogCount = walk(postOg).filter((file) => file.endsWith(".png")).length;
if (postCount !== ogCount) errors.push(`post OG count ${ogCount} does not match post count ${postCount}`);

console.log(`Local audit: ${errors.length} error(s), ${warnings.length} warning(s)`);
for (const error of errors) console.error(`ERROR ${error}`);
for (const warning of warnings) console.warn(`WARN  ${warning}`);
if (errors.length) process.exitCode = 1;
