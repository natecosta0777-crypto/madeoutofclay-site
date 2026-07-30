import fs from "node:fs";
import path from "node:path";

const repo = path.resolve(import.meta.dirname, "..");
const failures = [];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function references(source) {
  const values = [];
  for (const match of source.matchAll(/\b(?:href|src|poster)="([^"]+)"/gi)) values.push(match[1]);
  for (const match of source.matchAll(/\bsrcset="([^"]+)"/gi)) {
    values.push(...match[1].split(",").map((item) => item.trim().split(/\s+/)[0]));
  }
  return values;
}

function isSkippable(value) {
  return !value || value.startsWith("#") || value.includes("+") || value.includes("${") ||
    /^(?:https?:|mailto:|tel:|data:|blob:|javascript:)/i.test(value);
}

function mainRouteToFile(root, pathname) {
  if (pathname === "/") return path.join(root, "index.html");
  const target = path.join(root, pathname.replace(/^\//, ""));
  if (path.extname(pathname)) return target;
  return path.join(target, "index.html");
}

function clubRouteToFile(root, pathname) {
  if (pathname === "/") return path.join(root, "index.html");
  const relative = pathname.replace(/^\//, "");
  if (path.extname(pathname)) return path.join(root, relative);
  return path.join(root, `${relative}.html`);
}

function checkSite(root, kind) {
  for (const file of walk(root).filter((candidate) => candidate.endsWith(".html"))) {
    const relative = path.relative(root, file).replaceAll("\\", "/");
    let webPath;
    if (kind === "main") {
      webPath = relative === "index.html" ? "/" : `/${relative.replace(/index\.html$/, "")}`;
    } else if (!relative.includes("/") && relative === "index.html") {
      webPath = "/";
    } else if (!relative.includes("/") && !["app.html", "reader.html", "clubhouse.html", "letters.html"].includes(relative)) {
      webPath = `/${relative.replace(/\.html$/, "")}`;
    } else {
      webPath = `/${relative}`;
    }

    const source = fs.readFileSync(file, "utf8");
    for (const value of references(source)) {
      if (isSkippable(value)) continue;
      const url = new URL(value, `https://local.test${webPath}`);
      const target = kind === "main"
        ? mainRouteToFile(root, decodeURIComponent(url.pathname))
        : clubRouteToFile(root, decodeURIComponent(url.pathname));
      if (!fs.existsSync(target)) failures.push(`${kind}:${relative} -> ${value}`);
    }
  }
}

checkSite(path.join(repo, "_site"), "main");
checkSite(path.join(repo, "club"), "club");

console.log(`Link check: ${failures.length} broken local reference(s)`);
for (const failure of failures) console.error(`ERROR ${failure}`);
if (failures.length) process.exitCode = 1;
