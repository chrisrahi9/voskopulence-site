import { mkdir, readFile, writeFile } from "node:fs/promises";

const CDN_LOGO = "https://vosko-cdn.b-cdn.net/logo_improved.svg";
const WORDMARK_SHIFT = -70;
const EMBLEM_Y_SHIFT = -3.1;
const WORDMARK_SCALE = 1.03;
const WORDMARK_ANCHOR_X = 922;
const WORDMARK_CENTER_Y = 564;
const WORDMARK_STROKE = 1.0;
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
  `       stroke="#ffffff"\n       stroke-width="${WORDMARK_STROKE}"\n       stroke-linejoin="round"\n       transform="translate(${WORDMARK_SHIFT},0) translate(${WORDMARK_ANCHOR_X},${WORDMARK_CENTER_Y}) scale(${WORDMARK_SCALE}) translate(${-WORDMARK_ANCHOR_X},${-WORDMARK_CENTER_Y})"\n${path5Id}`
);

const originalEmblemTransform = 'transform="translate(1.5000001e-5)"';
if (!svg.includes(originalEmblemTransform)) {
  throw new Error("Voskopulence emblem group (g4) transform not found");
}
svg = svg.replace(
  originalEmblemTransform,
  `transform="translate(1.5000001e-5,${EMBLEM_Y_SHIFT})"`
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
  emblemYShift: EMBLEM_Y_SHIFT,
  wordmarkScale: WORDMARK_SCALE,
  wordmarkStroke: WORDMARK_STROKE,
  horizontalEffect: "preserved approved emblem gap",
  verticalEffect: "preserved approved emblem alignment",
  refinement: "slightly larger and more confident wordmark",
});
