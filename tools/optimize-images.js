const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..", "src", "assets");
const readerDir = path.join(root, "read", "titus-and-the-lions");
const clubAssets = path.join(__dirname, "..", "club", "assets");
const coversDir = path.join(root, "covers");

async function main() {
  await sharp(path.join(root, "logo.png"))
    .resize(160, 100, { fit: "contain" })
    .webp({ quality: 82, effort: 6 })
    .toFile(path.join(root, "logo-header.webp"));

  if (fs.existsSync(path.join(clubAssets, "logo.png"))) {
    await sharp(path.join(clubAssets, "logo.png"))
      .resize(160, 100, { fit: "contain" })
      .webp({ quality: 82, effort: 6 })
      .toFile(path.join(clubAssets, "logo-header.webp"));

    const clubOg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <rect width="1200" height="630" fill="#fbf6ec"/>
      <rect x="0" width="18" height="630" fill="#84391e"/>
      <circle cx="1055" cy="115" r="205" fill="#e9f0e6"/>
      <circle cx="1110" cy="590" r="250" fill="#fdeccf"/>
      <text x="75" y="170" font-family="Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="3" fill="#713018">MADE OUT OF CLAY</text>
      <text x="75" y="290" font-family="Georgia, serif" font-size="76" font-weight="700" fill="#2f2a24">Digital Book Club</text>
      <text x="75" y="365" font-family="Arial, sans-serif" font-size="32" fill="#554c3f">Affirming stories and printable activities</text>
      <text x="75" y="415" font-family="Arial, sans-serif" font-size="32" fill="#554c3f">Free membership · no card required</text>
      <text x="75" y="525" font-family="Arial, sans-serif" font-size="27" font-weight="700" fill="#713018">club.madeoutofclayprod.com</text>
    </svg>`;
    await sharp(Buffer.from(clubOg)).png({ compressionLevel: 9 }).toFile(path.join(clubAssets, "og-card.png"));
  }

  const coverImages = fs.readdirSync(coversDir).filter((file) =>
    /\.jpe?g$/i.test(file) || file === "just-like-my-brother.webp"
  );
  for (const file of coverImages) {
    const input = path.join(coversDir, file);
    const stem = path.basename(file, path.extname(file));
    const webpPath = path.join(coversDir, `${stem}.webp`);
    await sharp(input).avif({ quality: 54, effort: 6 }).toFile(path.join(coversDir, `${stem}.avif`));
    if (path.resolve(input) !== path.resolve(webpPath)) {
      await sharp(input).webp({ quality: 78, effort: 6 }).toFile(webpPath);
    }
  }

  const sourceImages = fs.readdirSync(readerDir).filter((file) => file.endsWith(".jpg"));
  for (const file of sourceImages) {
    const input = path.join(readerDir, file);
    const stem = path.basename(file, ".jpg");
    await Promise.all([
      sharp(input).resize({ width: 960, withoutEnlargement: true }).avif({ quality: 48, effort: 6 }).toFile(path.join(readerDir, `${stem}.avif`)),
      sharp(input).resize({ width: 960, withoutEnlargement: true }).webp({ quality: 72, effort: 6 }).toFile(path.join(readerDir, `${stem}.webp`)),
    ]);
  }
  console.log(`Optimized site logos, ${coverImages.length} covers, club OG card, and ${sourceImages.length} reader images`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
