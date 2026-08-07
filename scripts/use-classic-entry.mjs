import { readFile, writeFile } from "node:fs/promises";

const entryPath = new URL("../dist/index.html", import.meta.url);
const html = await readFile(entryPath, "utf8");
const classicHtml = html.replace(
  /<script type="module" crossorigin src="(\/assets\/index-[^"]+\.js)"><\/script>/,
  '<script defer src="$1"></script>',
);

if (classicHtml === html) {
  throw new Error("Vite entry script was not found in dist/index.html");
}

await writeFile(entryPath, classicHtml);
