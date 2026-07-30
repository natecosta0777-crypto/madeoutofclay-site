import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..", "club");
const publicPages = new Map([
  ["index.html", "/"],
  ["book-club.html", "/book-club"],
  ["schools.html", "/schools"],
  ["characters.html", "/characters"],
  ["printables.html", "/printables"],
  ["privacy.html", "/privacy"],
  ["terms.html", "/terms"],
  ["affiliate-disclosure.html", "/affiliate-disclosure"],
  ["how-we-make-money.html", "/how-we-make-money"],
  ["pricing.html", "/pricing"],
]);
const privateTopPages = new Set(["app.html", "reader.html", "clubhouse.html", "letters.html"]);

function filesBelow(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(full) : [full];
  });
}

function replaceInternalLinks(html) {
  const replacements = [
    ["index.html", "/"],
    ["book-club.html", "/book-club"],
    ["schools.html", "/schools"],
    ["characters.html", "/characters"],
    ["printables.html", "/printables"],
    ["privacy.html", "/privacy"],
    ["terms.html", "/terms"],
    ["affiliate-disclosure.html", "/affiliate-disclosure"],
    ["how-we-make-money.html", "/how-we-make-money"],
    ["pricing.html", "/pricing"],
  ];
  for (const [from, to] of replacements) {
    html = html.replaceAll(`href="${from}`, `href="${to}`);
    html = html.replaceAll(`href="./${from}`, `href="${to}`);
  }
  return html;
}

for (const file of filesBelow(root).filter((candidate) => candidate.endsWith(".html"))) {
  const relative = path.relative(root, file).replaceAll("\\", "/");
  const base = path.basename(file);
  let html = fs.readFileSync(file, "utf8");

  html = html
    .replaceAll("https://madeoutofclay.com", "https://club.madeoutofclayprod.com")
    .replaceAll("https://madeoutofclayprod.com/library", "https://club.madeoutofclayprod.com")
    .replace(/<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=[^"]*"><\/script>/g, "")
    .replace(/<script>window\.dataLayer=window\.dataLayer\|\|\[\];function gtag\(\)\{dataLayer\.push\(arguments\);\}gtag\('js',new Date\(\)\);gtag\('config','G-B4ZQX8FJ8J',\{[^}]+\}\);<\/script>/g, "")
    .replace(/<script>\(function\(\)\{var s=document\.createElement\("script"\);s\.async=true;s\.src="https:\/\/tracker\.metricool\.com\/resources\/be\.js";[\s\S]*?\}\)\(\);<\/script>/g, "")
    .replace(/<!-- Google tag \(gtag\.js\) -->[\s\S]*?gtag\('config', '', \{ anonymize_ip: true \}\);\s*<\/script>/g, "")
    .replace(/<!-- Meta Pixel -->[\s\S]*?<\/noscript> -->/g, "")
    .replace(/<!-- Consent banner \(minimal\) -->[\s\S]*?<div id="consent-banner"[\s\S]*?<\/div>\s*<\/div>/g, "")
    .replace(/<script data-cfasync="false" src="\/cdn-cgi\/scripts\/[^"]+"><\/script>/g, "")
    .replace(/<script>\(function\(\)\{var r=window\.matchMedia[\s\S]*?video\[data-logo\][\s\S]*?\}\)\(\);<\/script>/g, "")
    .replace(/<script>\(function\(\)\{function c\(\)\{var b=a\.contentDocument[\s\S]*?\}\)\(\);<\/script>/g, "")
    .replace(/<a\b[^>]*href="\/cdn-cgi\/l\/email-protection#[^"]*"[^>]*>[\s\S]*?<\/a>/g, '<a href="mailto:clay@madeoutofclayprod.com">clay@madeoutofclayprod.com</a>')
    .replace(/<video\b[^>]*data-logo[^>]*>[\s\S]*?<\/video>/g, '<img class="club-static-logo" src="/assets/logo-header.webp" alt="" width="70" height="44">')
    .replace(/<video\b[^>]*>[\s\S]*?logo-anim\.mp4[\s\S]*?<\/video>/g, '<img class="club-static-logo" src="/assets/logo-header.webp" alt="" width="120" height="76">')
    .replace(/<script>\s*\(function\(\)\{\s*var reduce[\s\S]*?\.brandline video[\s\S]*?\}\)\(\);\s*<\/script>/g, "")
    .replace(/<link rel="canonical"[^>]*>\s*/g, "")
    .replace(/<meta name="robots"[^>]*>\s*/g, "")
    .replace(/<link rel="icon"[^>]*>\s*/g, "")
    .replace(/<link rel="stylesheet" href="\/assets\/club-fixes\.css">\s*/g, "")
    .replace(/<script src="\/assets\/consent\.js" defer><\/script>\s*/g, "");

  html = replaceInternalLinks(html);

  const publicPath = relative.includes("/") ? null : publicPages.get(base);
  const robots = publicPath ? "index,follow" : "noindex,follow";
  const canonical = publicPath
    ? `<link rel="canonical" href="https://club.madeoutofclayprod.com${publicPath}">\n`
    : "";
  const headAdditions =
    `<link rel="icon" type="image/png" href="/assets/favicon.png">\n` +
    canonical +
    `<meta name="robots" content="${robots}">\n` +
    `<link rel="stylesheet" href="/assets/club-fixes.css">\n` +
    `<script src="/assets/consent.js" defer></script>\n`;
  html = html.replace(/<head>\s*/i, `<head>\n${headAdditions}`);

  if (publicPath) {
    const absolute = `https://club.madeoutofclayprod.com${publicPath}`;
    if (/<meta property="og:url"/i.test(html)) {
      html = html.replace(/<meta property="og:url" content="[^"]*">/i, `<meta property="og:url" content="${absolute}">`);
    }
    html = html.replace(/<meta property="og:image" content="[^"]*">/gi, '<meta property="og:image" content="https://club.madeoutofclayprod.com/assets/og-card.png">');
    html = html.replace(/<meta name="twitter:image" content="[^"]*">/gi, '<meta name="twitter:image" content="https://club.madeoutofclayprod.com/assets/og-card.png">');
  }

  if (!/<main(?:\s|>)/i.test(html)) {
    html = html.replace(/<\/header>/i, '</header>\n<main id="main-content">');
    html = html.replace(/<footer/i, '</main>\n<footer');
  } else {
    html = html.replace(/<main(?![^>]*\bid=)([^>]*)>/i, '<main id="main-content"$1>');
  }
  html = html.replace(/<a class="skip-link" href="#main-content">Skip to content<\/a>\s*/g, "");
  html = html.replace(/<body([^>]*)>/i, '<body$1>\n<a class="skip-link" href="#main-content">Skip to content</a>');

  fs.writeFileSync(file, html.replace(/\n{3,}/g, "\n\n"));
}

console.log("Normalized club HTML, metadata, links, logos, consent, and recovered Cloudflare artifacts.");
