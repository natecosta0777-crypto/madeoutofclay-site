/**
 * Generates placeholder cover SVGs + a default OG image so the site renders
 * before real artwork is dropped in. Run: `node tools/gen-placeholders.js`.
 * Replace files in src/assets/covers/ and src/assets/og/ with real art later.
 */
const fs = require("fs");
const path = require("path");

const books = require("../src/_data/books.json");
const series = require("../src/_data/series.json");
const seriesBySlug = Object.fromEntries(series.map((s) => [s.slug, s]));

const coversDir = path.join(__dirname, "..", "src", "assets", "covers");
const ogDir = path.join(__dirname, "..", "src", "assets", "og");
fs.mkdirSync(coversDir, { recursive: true });
fs.mkdirSync(ogDir, { recursive: true });

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function wrap(text, max) {
  const words = String(text).split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max) { lines.push(line.trim()); line = w; }
    else line += " " + w;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

let made = 0;
for (const b of books) {
  const outPath = path.join(coversDir, `${b.slug}.svg`);
  // Never overwrite art that already exists (placeholder or real).
  if (fs.existsSync(outPath)) continue;
  const s = seriesBySlug[b.series] || { accent: "#c2562e", accentSoft: "#f7e3d8", name: "" };
  const lines = wrap(b.title, 14);
  const startY = 300 - (lines.length - 1) * 26;
  const tspans = lines
    .map((ln, i) => `<tspan x="300" dy="${i === 0 ? 0 : 52}">${esc(ln)}</tspan>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-label="${esc(b.title)} placeholder cover">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${s.accentSoft}"/><stop offset="1" stop-color="${s.accent}"/>
  </linearGradient></defs>
  <rect width="600" height="600" fill="url(#g)"/>
  <rect x="28" y="28" width="544" height="544" rx="22" fill="none" stroke="#ffffff" stroke-opacity="0.55" stroke-width="3"/>
  <text x="300" y="92" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#ffffff" fill-opacity="0.9" letter-spacing="2">${esc((s.name || "").toUpperCase())}</text>
  <text x="300" y="${startY}" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="46" fill="#2c2420">${tspans}</text>
  <text x="300" y="540" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#2c2420" fill-opacity="0.75">Isaiah Hartwell</text>
</svg>`;
  fs.writeFileSync(outPath, svg);
  made++;
}

// Default OG card (1200x630)
if (!fs.existsSync(path.join(ogDir, "default.svg"))) {
const og = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" role="img" aria-label="Made Out of Clay Productions">
  <rect width="1200" height="630" fill="#fdf8f1"/>
  <rect width="1200" height="630" fill="none"/>
  <text x="600" y="250" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="74" fill="#2c2420">Made Out of Clay</text>
  <text x="600" y="330" text-anchor="middle" font-family="Georgia, serif" font-size="40" fill="#c2562e">Productions</text>
  <text x="600" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#5e544c">Premium full-color picture books by Isaiah Hartwell</text>
  <text x="600" y="490" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="#5e544c">9 books · 3 series · on Amazon</text>
</svg>`;
  fs.writeFileSync(path.join(ogDir, "default.svg"), og);
}

console.log(`Placeholder check done. Created ${made} new cover(s). Existing art left untouched.`);
