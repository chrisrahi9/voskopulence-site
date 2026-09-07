import { readFile, writeFile } from "node:fs/promises";

const pageUrl = new URL("../app/page.tsx", import.meta.url);
let source = await readFile(pageUrl, "utf8");

const version = process.env.VERCEL_GIT_COMMIT_SHA || `${Date.now()}`;
const oldSrc = 'src={asset("/Spotlight_pic.png")}';
const newSrc = `src="/products-live/product-fig-cedar.png?v=${version}"`;

if (source.includes(oldSrc)) {
  source = source.replace(oldSrc, newSrc);
} else if (!source.includes("/products-live/product-fig-cedar.png")) {
  throw new Error("SPOTLIGHT_FIG: existing Spotlight image source not found");
}

source = source.replace(
  'alt="Mediterranean Rosemary Bar"',
  'alt="Fig & Cedar Nourishing Bar"'
);
source = source.replace(
  "Mediterranean Rosemary Bar",
  "Fig & Cedar Nourishing Bar"
);
source = source.replace(
  "A concentrated shampoo bar built around rosemary and mint, with a fresh herbal character inspired by the Mediterranean coast.",
  "A creamy nourishing shampoo bar where sun-ripened fig meets dry cedarwood, created for softer-feeling hair with a warm Mediterranean character."
);

await writeFile(pageUrl, source, "utf8");
console.log("SPOTLIGHT_FIG: using freshly mirrored Bunny Fig & Cedar image with versioned URL");
