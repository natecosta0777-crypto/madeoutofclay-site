import fs from "node:fs/promises";
import path from "node:path";

const ORIGIN = "https://club.madeoutofclayprod.com";
const OUT_DIR = path.resolve("club");
const MAX_FILES = 750;

const seedPaths = [
  "/",
  "/index.html",
  "/book-club.html",
  "/schools.html",
  "/clubhouse.html",
  "/characters.html",
  "/printables.html",
  "/privacy.html",
  "/terms.html",
  "/affiliate-disclosure.html",
  "/how-we-make-money.html",
  "/app.html",
  "/reader.html",
  "/letters.html",
  "/pricing.html",
  "/printables/coloring.html",
  "/printables/trackers.html",
  "/printables/feelings.html",
  "/printables/activities.html",
  "/printables/bookmarks.html",
  "/printables/decor.html",
  "/robots.txt",
];

const queue = seedPaths.map((pathname) => new URL(pathname, ORIGIN));
const queued = new Set(queue.map((url) => url.href));
const fetched = new Set();
const manifest = [];

function localPathFor(url, contentType) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith("/")) pathname += "index.html";
  if (contentType.includes("text/html") && !path.extname(pathname)) {
    pathname += ".html";
  }
  const relative = pathname.replace(/^\/+/, "") || "index.html";
  const resolved = path.resolve(OUT_DIR, relative);
  if (!resolved.startsWith(`${OUT_DIR}${path.sep}`) && resolved !== OUT_DIR) {
    throw new Error(`Unsafe output path: ${relative}`);
  }
  return resolved;
}

function shouldQueue(url) {
  if (url.origin !== ORIGIN) return false;
  if (url.pathname.startsWith("/cdn-cgi/")) return false;
  if (/^(mailto|tel|javascript|data):/i.test(url.href)) return false;
  if (/[{}<>]|['"]|\+L\./.test(url.pathname)) return false;
  return true;
}

function enqueue(raw, baseUrl) {
  if (!raw || raw.startsWith("#")) return;
  let cleaned = raw
    .replaceAll("&amp;", "&")
    .replace(/^url\((.*)\)$/i, "$1")
    .replace(/^['"]|['"]$/g, "");
  // Dynamic DOM code resolves these project-root asset paths against the page,
  // not against the JavaScript file that contains the string.
  if (/^(?:assets|images|img|audio|media|books|printables)\//i.test(cleaned)) {
    cleaned = `/${cleaned}`;
  }
  let url;
  try {
    url = new URL(cleaned, baseUrl);
  } catch {
    return;
  }
  url.hash = "";
  if (!shouldQueue(url)) return;
  url.search = "";
  if (queued.has(url.href)) return;
  queued.add(url.href);
  queue.push(url);
}

function discover(text, baseUrl, contentType) {
  const patterns = [
    /\b(?:src|href|poster|data-src|data-href)\s*=\s*["']([^"'#]+)["']/gi,
    /\b(?:srcset)\s*=\s*["']([^"']+)["']/gi,
    /url\(\s*(['"]?)([^)'"]+)\1\s*\)/gi,
    /@import\s+(?:url\()?["']([^"']+)["']/gi,
    /["'](\/(?:assets|images|img|audio|media|books|printables)\/[^"'?#]+)["']/gi,
    /["']((?:assets|images|img|audio|media|books|printables)\/[^"'?#]+)["']/gi,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const value = match[2] || match[1];
      if (!value) continue;
      if (pattern.source.includes("srcset")) {
        for (const candidate of value.split(",")) {
          enqueue(candidate.trim().split(/\s+/)[0], baseUrl);
        }
      } else {
        enqueue(value, baseUrl);
      }
    }
  }

  if (contentType.includes("application/json")) {
    try {
      const walk = (value) => {
        if (typeof value === "string") enqueue(value, baseUrl);
        else if (Array.isArray(value)) value.forEach(walk);
        else if (value && typeof value === "object") Object.values(value).forEach(walk);
      };
      walk(JSON.parse(text));
    } catch {
      // The generic string patterns above still cover malformed JSON-like data.
    }
  }

  if (baseUrl.pathname.endsWith("/assets/js/club-books.js")) {
    const match = text.match(/window\.CLUB_BOOKS\s*=\s*(\[[\s\S]*\])\s*;?\s*$/);
    if (match) {
      try {
        const books = JSON.parse(match[1]);
        for (const book of books) {
          enqueue(book.cover, new URL("/", ORIGIN));
          enqueue(book.pdf, new URL("/", ORIGIN));
          for (const page of book.pages || []) {
            enqueue(`${book.base || ""}${page.img || ""}`, new URL("/", ORIGIN));
            enqueue(page.audio, new URL("/", ORIGIN));
          }
        }
      } catch {
        // The generic string extraction remains the safe fallback.
      }
    }
  }
}

await fs.mkdir(OUT_DIR, { recursive: true });

while (queue.length) {
  if (fetched.size >= MAX_FILES) {
    throw new Error(`Stopped at safety limit of ${MAX_FILES} files`);
  }

  const url = queue.shift();
  if (fetched.has(url.href)) continue;
  fetched.add(url.href);

  const response = await fetch(url, {
    redirect: "follow",
    headers: { "user-agent": "MadeOutOfClaySourceRecovery/1.0" },
  });
  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  if (!response.ok) {
    manifest.push({ url: url.href, status: response.status, skipped: true });
    continue;
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  const filePath = localPathFor(url, contentType);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, bytes);
  manifest.push({
    url: url.href,
    finalUrl: response.url,
    status: response.status,
    contentType,
    bytes: bytes.length,
    file: path.relative(OUT_DIR, filePath).replaceAll("\\", "/"),
  });

  if (
    contentType.includes("text/") ||
    contentType.includes("javascript") ||
    contentType.includes("json") ||
    /\.(?:html?|css|js|json|webmanifest|svg)$/i.test(url.pathname)
  ) {
    discover(bytes.toString("utf8"), new URL(response.url), contentType);
  }
}

await fs.writeFile(
  path.join(OUT_DIR, "source-recovery-manifest.json"),
  `${JSON.stringify({ recoveredAt: new Date().toISOString(), origin: ORIGIN, files: manifest }, null, 2)}\n`,
);

console.log(
  JSON.stringify(
    {
      output: OUT_DIR,
      fetched: fetched.size,
      written: manifest.filter((item) => !item.skipped).length,
      skipped: manifest.filter((item) => item.skipped).length,
    },
    null,
    2,
  ),
);
