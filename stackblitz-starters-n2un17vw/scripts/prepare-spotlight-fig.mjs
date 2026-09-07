import { readFile, writeFile } from "node:fs/promises";

const pageUrl = new URL("../app/page.tsx", import.meta.url);
let source = await readFile(pageUrl, "utf8");

const oldSrc = 'src={asset("/Spotlight_pic.png")}';
const newSrc = 'src="/products-live/product-fig-cedar.png"';

if (source.includes(oldSrc)) {
  source = source.replace(oldSrc, newSrc);
} else if (!source.includes(newSrc)) {
  throw new Error("SPOTLIGHT_FIG: existing Spotlight image source not found");
}

source = source.replace(
  'alt="Mediterranean Rosemary Bar"',
  'alt="Fig & Cedar Nourishing Bar"'
);

await writeFile(pageUrl, source, "utf8");
console.log("SPOTLIGHT_FIG: using mirrored Bunny Fig & Cedar product image");
