import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clubRoot = path.join(repo, "club");
const failures = [];

function walk(directory, predicate) {
  const results = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...walk(file, predicate));
    else if (!predicate || predicate(file)) results.push(file);
  }
  return results;
}

function displayPath(file) {
  return path.relative(clubRoot, file).replaceAll("\\", "/");
}

const htmlFiles = walk(clubRoot, (file) => file.endsWith(".html"));

for (const file of htmlFiles) {
  const relative = displayPath(file);
  const html = fs.readFileSync(file, "utf8");
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]);
  const h1Count = (html.match(/<h1\b/gi) || []).length;

  if (h1Count !== 1) failures.push(`${relative}: expected one H1, found ${h1Count}`);
  if (!/<title>[^<]+<\/title>/i.test(html)) failures.push(`${relative}: missing title`);
  if (!/<meta\s+name=["']description["'][^>]+content=["'][^"']+/i.test(html)) {
    failures.push(`${relative}: missing meta description`);
  }
  if (!/<link\s+rel=["']canonical["'][^>]+href=["']https:\/\/club\.madeoutofclayprod\.com/i.test(html)) {
    failures.push(`${relative}: missing canonical URL`);
  }

  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicateIds.length) failures.push(`${relative}: duplicate IDs ${duplicateIds.join(", ")}`);

  for (const match of html.matchAll(/\bhref=["']#([^"']+)["']/gi)) {
    if (!ids.includes(match[1])) failures.push(`${relative}: missing anchor target #${match[1]}`);
  }

  if (relative !== "reader.html" && /\bhref=["']#["']/i.test(html)) {
    failures.push(`${relative}: dead href=\"#\"`);
  }

  for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    let url = match[1].trim();
    if (!url || /^(?:https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i.test(url)) continue;
    url = url.split(/[?#]/)[0];
    if (!url) continue;

    const target = url.startsWith("/")
      ? path.join(clubRoot, url.slice(1))
      : path.resolve(path.dirname(file), url);
    const candidates = url.endsWith("/")
      ? [path.join(target, "index.html")]
      : [
          target,
          ...(!path.extname(target) ? [`${target}.html`, path.join(target, "index.html")] : []),
        ];

    if (!candidates.some((candidate) => fs.existsSync(candidate))) {
      failures.push(`${relative}: missing local reference ${match[1]}`);
    }
  }

  for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=|application\/ld\+json/i.test(match[1])) continue;
    try {
      new vm.Script(match[2], { filename: relative });
    } catch (error) {
      failures.push(`${relative}: inline script syntax — ${error.message}`);
    }
  }
}

for (const relative of ["app.html", "reader.html", "clubhouse.html", "characters.html", "letters.html"]) {
  const html = fs.readFileSync(path.join(clubRoot, relative), "utf8");
  if (!/<meta\s+name=["']robots["'][^>]*noindex/i.test(html)) {
    failures.push(`${relative}: child utility route must be noindex`);
  }
}

const books = JSON.parse(fs.readFileSync(path.join(repo, "src", "_data", "books.json"), "utf8"));
for (const book of books) {
  for (const extension of ["avif", "webp"]) {
    const variant = book.cover.replace(/^\//, "").replace(/\.[^.]+$/, `.${extension}`);
    if (!fs.existsSync(path.join(repo, "src", variant))) {
      failures.push(`${book.slug}: missing ${extension} cover`);
    }
  }

  if (book.previewUrl) {
    for (const number of [1, 2, 3]) {
      const spread = path.join(clubRoot, "assets", "club", book.slug, `spread-0${number}.webp`);
      if (!fs.existsSync(spread)) failures.push(`${book.slug}: missing preview spread ${number}`);
    }
  }
}

const socialCards = walk(path.join(repo, "src", "assets", "og"), (file) => file.endsWith(".png"));
for (const file of socialCards) {
  const metadata = await sharp(file).metadata();
  if (metadata.width !== 1200 || metadata.height !== 630) {
    failures.push(`${path.relative(repo, file)}: expected 1200x630, found ${metadata.width}x${metadata.height}`);
  }
}

console.log(`Club HTML: ${htmlFiles.length} | Books: ${books.length} | Social cards: ${socialCards.length}`);
if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}
console.log("Club and asset audit: 0 errors");
