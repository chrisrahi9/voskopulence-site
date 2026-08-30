import { mkdir, readFile, writeFile } from "node:fs/promises";

const CDN_LOGO = "https://vosko-cdn.b-cdn.net/logo_improved.svg";
const WORDMARK_SHIFT = -70;
const projectRoot = new URL("../", import.meta.url);
const publicDir = new URL("public/", projectRoot);
const outputLogo = new URL("public/logo_spaced.svg", projectRoot);
const appRoot = new URL("app/", projectRoot);
const pageFiles = [
  "page.tsx",
  "shop/page.tsx",
  "contact/page.tsx",
  "sustainability/page.tsx",
];

const response = await fetch(CDN_LOGO, { cache: "no-store" });
if (!response.ok) {
  throw new Error(`Unable to fetch source logo: ${response.status}`);
}

let svg = await response.text();
const path5Id = '       id="path5"';
if (!svg.includes(path5Id)) {
  throw new Error("Voskopulence wordmark path (path5) not found");
}

svg = svg.replace(
  path5Id,
  `       transform="translate(${WORDMARK_SHIFT},0)"\n${path5Id}`
);

await mkdir(publicDir, { recursive: true });
await writeFile(outputLogo, svg, "utf8");

for (const file of pageFiles) {
  const url = new URL(file, appRoot);
  let source = await readFile(url, "utf8");
  const original = 'src={asset("/logo_improved.svg")}';
  if (!source.includes(original)) {
    throw new Error(`${file}: logo reference not found`);
  }
  source = source.split(original).join('src="/logo_spaced.svg"');
  await writeFile(url, source, "utf8");
}

console.log("LOGO_SPACING_PREPARED", {
  source: CDN_LOGO,
  wordmarkShift: WORDMARK_SHIFT,
  direction: "left",
  effect: "increased horizontal emblem gap",
});
