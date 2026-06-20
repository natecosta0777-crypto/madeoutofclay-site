const fs = require("fs");
const path = require("path");
function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]
  );
}
const files = walk("_site").filter((f) => f.endsWith(".html"));
let total = 0, bad = 0;
const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
for (const f of files) {
  const html = fs.readFileSync(f, "utf8");
  let m;
  while ((m = re.exec(html))) {
    total++;
    try { JSON.parse(m[1]); }
    catch (e) { bad++; console.log("BAD JSON-LD in", f, "->", e.message); }
  }
}
console.log("JSON-LD blocks:", total, "| invalid:", bad);
