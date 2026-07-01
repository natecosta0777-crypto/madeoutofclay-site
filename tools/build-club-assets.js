/**
 * build-club-assets.js — one-time/occasional ingestion of Digital Book Club art.
 *
 * Reads the canonical episode art from the Digital Book Club working tree,
 * compresses each cover/spread to web-sized WebP under src/assets/club/,
 * and writes the runtime manifest src/assets/club/books.json that /app and
 * /reader fetch in the browser.
 *
 * Run:  node tools/build-club-assets.js
 * Safe to re-run: skips files whose output already exists and is newer.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// Canonical source tree (Nate's machine). Update if the club folder moves.
const SOURCE =
  "C:\\Users\\samps\\OneDrive\\Desktop\\Ai-Businesses\\Made out of Clay\\Digital Book Club\\brave-like-me";

const OUT = path.join(__dirname, "..", "src", "assets", "club", "brave-like-me");
const MANIFEST = path.join(__dirname, "..", "src", "assets", "club", "books.json");

const MAX_DIM = 1600; // longest side, px
const QUALITY = 80; // webp quality

// Episode list: folder -> slug/title. Titles match the shipped PDFs
// (see _ops/BOOK-READINESS.md). Episode 10 has no rendered art yet;
// the script marks any episode without a cover as "coming-soon".
const EPISODES = [
  { dir: "01-maya-goes-first", slug: "maya-goes-first", title: "Maya Goes First" },
  { dir: "02-maya-and-the-lights-out-night", slug: "maya-and-the-lights-out-night", title: "Maya and the Lights-Out Night" },
  { dir: "03-the-new-school-butterflies", slug: "the-new-school-butterflies", title: "The New-School Butterflies" },
  { dir: "04-maya-tries-out-for-the-team", slug: "maya-tries-out-for-the-team", title: "Maya Tries Out for the Team" },
  { dir: "05-the-day-nia-spoke-up", slug: "the-day-nia-spoke-up", title: "The Day Nia Spoke Up" },
  { dir: "06-brave-like-me-at-the-big-pool", slug: "brave-like-me-at-the-big-pool", title: "Brave Like Me at the Big Pool" },
  { dir: "07-lenas-first-sleepover", slug: "lenas-first-sleepover", title: "Lena's First Sleepover" },
  { dir: "08-maya-and-the-two-wheel-bike", slug: "maya-and-the-two-wheel-bike", title: "Maya and the Two-Wheel Bike" },
  { dir: "09-zoe-and-the-too-tall-slide", slug: "zoe-and-the-too-tall-slide", title: "Zoe and the Too-Tall Slide" },
  { dir: "10-when-my-voice-got-stuck", slug: "when-my-voice-got-stuck", title: "When My Voice Got Stuck" },
];

async function convert(src, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).mtimeMs >= fs.statSync(src).mtimeMs) {
    return "skip";
  }
  await sharp(src)
    .resize(MAX_DIM, MAX_DIM, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(dest);
  return "ok";
}

(async () => {
  const manifest = {
    generated: new Date().toISOString().slice(0, 10),
    series: [
      {
        id: "brave-like-me",
        name: "Brave Like Me",
        season: 1,
        episodes: [],
      },
    ],
  };
  const eps = manifest.series[0].episodes;
  let converted = 0,
    skipped = 0;

  for (const ep of EPISODES) {
    const artDir = path.join(SOURCE, ep.dir, "art");
    const cover = path.join(artDir, "cover.png");
    const hasCover = fs.existsSync(cover);
    const spreadFiles = fs.existsSync(artDir)
      ? fs
          .readdirSync(artDir)
          .filter((f) => /^spread-\d{2}\.png$/.test(f)) // excludes -alt and backmatter files
          .sort()
      : [];

    if (!hasCover || spreadFiles.length === 0) {
      eps.push({
        num: EPISODES.indexOf(ep) + 1,
        slug: ep.slug,
        title: ep.title,
        status: "coming-soon",
      });
      console.log(`[coming-soon] ${ep.title} (no rendered art found)`);
      continue;
    }

    const outDir = path.join(OUT, ep.slug);
    fs.mkdirSync(outDir, { recursive: true });

    const r1 = await convert(cover, path.join(outDir, "cover.webp"));
    r1 === "ok" ? converted++ : skipped++;

    const spreads = [];
    for (const f of spreadFiles) {
      const outName = f.replace(/\.png$/, ".webp");
      const r = await convert(path.join(artDir, f), path.join(outDir, outName));
      r === "ok" ? converted++ : skipped++;
      spreads.push(`/assets/club/brave-like-me/${ep.slug}/${outName}`);
    }

    eps.push({
      num: EPISODES.indexOf(ep) + 1,
      slug: ep.slug,
      title: ep.title,
      status: "ready",
      cover: `/assets/club/brave-like-me/${ep.slug}/cover.webp`,
      pages: spreads.length,
      spreads,
    });
    console.log(`[ok] ${ep.title}: ${spreads.length} spreads`);
  }

  fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest: ${MANIFEST}`);
  console.log(`Converted ${converted}, skipped ${skipped} (already up to date).`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
