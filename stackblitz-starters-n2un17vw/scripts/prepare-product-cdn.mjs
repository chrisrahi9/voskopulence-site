import { readFile, writeFile } from "node:fs/promises";

const shopUrl = new URL("../app/shop/page.tsx", import.meta.url);

function replaceRequired(source, from, to, label) {
  if (source.includes(to)) return source;
  if (!source.includes(from)) {
    throw new Error(`PRODUCT_CDN: ${label} not found`);
  }
  return source.replace(from, to);
}

let source = await readFile(shopUrl, "utf8");

source = replaceRequired(
  source,
  'img: "/Thyme_sea.png",',
  'img: "https://vosko-cdn.b-cdn.net/products/product-thyme-rosemary.png",',
  "thyme image"
);
source = replaceRequired(
  source,
  'img: "/Fig_sea.png",',
  'img: "https://vosko-cdn.b-cdn.net/products/product-fig-cedar.png",',
  "fig image"
);
source = replaceRequired(
  source,
  'img: "/Lemon_sea.png",',
  'img: "https://vosko-cdn.b-cdn.net/products/product-lemon-seabreeze.png",',
  "lemon image"
);
source = replaceRequired(
  source,
  'src={asset(bar.img)}',
  'src={bar.img}',
  "direct CDN image source"
);

await writeFile(shopUrl, source, "utf8");
console.log("PRODUCT_CDN: shop images now use Bunny CDN directly");
