/**
 * Generates the 1200x630 Open Graph share image from real cover art.
 * One-time/asset tool — run locally and commit src/assets/og/default.png.
 *   node tools/gen-og.js
 * Not run in CI (sharp is a devDependency used only here).
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const coversDir = path.join(__dirname, "..", "src", "assets", "covers");
const ogPath = path.join(__dirname, "..", "src", "assets", "og", "default.png");

function dataUri(file) {
  const buf = fs.readFileSync(path.join(coversDir, file));
  return "data:image/jpeg;base64," + buf.toString("base64");
}

const covers = [
  "scooter-cant-wait-for-spring.jpg",
  "clay-has-amazing-powers.jpg",
  "calebs-homeland.jpg",
].map(dataUri);

// Three covers fanned on the right, brand text on the left.
const positions = [
  { x: 690, y: 150, r: -6 },
  { x: 855, y: 120, r: 3 },
  { x: 1020, y: 150, r: 8 },
];
const size = 250;

const images = positions
  .map(
    (p, i) =>
      `<g transform="rotate(${p.r} ${p.x + size / 2} ${p.y + size / 2})">
         <rect x="${p.x - 8}" y="${p.y - 8}" width="${size + 16}" height="${size + 16}" rx="14" fill="#ffffff" opacity="0.95"/>
         <image href="${covers[i]}" x="${p.x}" y="${p.y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice"/>
       </g>`
  )
  .join("\n");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#fdf8f1"/>
  <rect x="0" y="0" width="16" height="630" fill="#c2562e"/>
  ${images}
  <text x="70" y="250" font-family="Georgia, serif" font-weight="700" font-size="68" fill="#2c2420">Made Out of Clay</text>
  <text x="72" y="312" font-family="Georgia, serif" font-size="40" fill="#c2562e">Productions</text>
  <text x="72" y="392" font-family="Arial, sans-serif" font-size="27" fill="#5e544c">Premium full-color picture books</text>
  <text x="72" y="430" font-family="Arial, sans-serif" font-size="27" fill="#5e544c">by Isaiah Hartwell</text>
  <text x="72" y="500" font-family="Arial, sans-serif" font-weight="700" font-size="24" fill="#9e421f">9 books · 3 series · on Amazon</text>
</svg>`;

sharp(Buffer.from(svg))
  .png()
  .toFile(ogPath)
  .then((info) => console.log(`Wrote OG image ${info.width}x${info.height} -> ${ogPath}`))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
