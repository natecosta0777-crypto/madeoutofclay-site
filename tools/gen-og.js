/**
 * Generates the 1200x630 Open Graph share image from real cover art.
 * One-time/asset tool — run locally and commit the generated PNG files.
 *   node tools/gen-og.js
 * Not run in CI (sharp is a devDependency used only here).
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const coversDir = path.join(__dirname, "..", "src", "assets", "covers");
const ogPath = path.join(__dirname, "..", "src", "assets", "og", "default.png");
const postsDir = path.join(__dirname, "..", "src", "blog", "posts");
const postsOgDir = path.join(__dirname, "..", "src", "assets", "og", "posts");

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
  <text x="72" y="500" font-family="Arial, sans-serif" font-weight="700" font-size="24" fill="#9e421f">10 books · 4 series · 9 available now</text>
</svg>`;

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function titleLines(title, max = 30) {
  const words = title.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (`${line} ${word}`.trim().length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = `${line} ${word}`.trim();
    }
  }
  if (line) lines.push(line);
  if (lines.length > 3) {
    lines[2] = `${lines.slice(2).join(" ").slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
    return lines.slice(0, 3);
  }
  return lines;
}

async function main() {
  fs.mkdirSync(postsOgDir, { recursive: true });
  const info = await sharp(Buffer.from(svg)).png().toFile(ogPath);
  console.log(`Wrote default OG image ${info.width}x${info.height}`);

  const posts = fs.readdirSync(postsDir).filter((file) => file.endsWith(".md"));
  for (const file of posts) {
    const source = fs.readFileSync(path.join(postsDir, file), "utf8");
    const title = source.match(/^title:\s*["'](.+)["']\s*$/m)?.[1];
    if (!title) continue;
    const slug = path.basename(file, ".md");
    const lines = titleLines(title).map((line, index) =>
      `<text x="72" y="${235 + index * 70}" font-family="Georgia, serif" font-weight="700" font-size="54" fill="#2c2420">${escapeXml(line)}</text>`
    ).join("\n");
    const postSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <rect width="1200" height="630" fill="#fdf8f1"/>
      <rect x="0" width="18" height="630" fill="#c2562e"/>
      <circle cx="1070" cy="115" r="180" fill="#f7e3d8"/>
      <circle cx="1115" cy="570" r="230" fill="#e6eefc"/>
      <text x="72" y="105" font-family="Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="3" fill="#9e421f">THE CLAY JOURNAL</text>
      ${lines}
      <text x="72" y="545" font-family="Arial, sans-serif" font-size="27" fill="#5e544c">Made Out of Clay Productions · Isaiah Hartwell</text>
    </svg>`;
    await sharp(Buffer.from(postSvg)).png({ compressionLevel: 9 }).toFile(path.join(postsOgDir, `${slug}.png`));
  }
  console.log(`Wrote ${posts.length} unique post OG images`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
