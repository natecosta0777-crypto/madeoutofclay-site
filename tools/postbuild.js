const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

async function minify(file, loader) {
  const source = fs.readFileSync(file, "utf8");
  const result = await esbuild.transform(source, {
    loader,
    minify: true,
    target: loader === "js" ? "es2018" : undefined,
    legalComments: "none",
  });
  fs.writeFileSync(file, result.code);
}

async function main() {
  const output = path.join(__dirname, "..", "_site", "assets");
  await Promise.all([
    minify(path.join(output, "css", "styles.css"), "css"),
    minify(path.join(output, "js", "main.js"), "js"),
  ]);
  console.log("Minified production CSS and JavaScript");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
