import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const publicRoot = new URL("../public/", import.meta.url);
const shopUrl = new URL("../app/shop/page.tsx", import.meta.url);

const assets = [
  {
    id: "thyme",
    data: "../product-assets/thyme-rosemary.00.b64",
    output: "../public/product-thyme-rosemary.webp",
    from: 'img: "/Thyme_sea.png"',
    to: 'img: "/product-thyme-rosemary.webp"',
  },
  {
    id: "fig",
    data: "../product-assets/fig-v3.b64",
    output: "../public/product-fig-cedar.webp",
    from: 'img: "/Fig_sea.png"',
    to: 'img: "/product-fig-cedar.webp"',
  },
  {
    id: "lemon",
    data: "../product-assets/lemon-v3.b64",
    output: "../public/product-lemon-seabreeze.webp",
    from: 'img: "/Lemon_sea.png"',
    to: 'img: "/product-lemon-seabreeze.webp"',
  },
];

function assertWebP(buffer, id) {
  if (buffer.length < 12 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
    throw new Error(`PRODUCT_IMAGES: ${id} is not a valid WebP payload`);
  }
  const declaredLength = buffer.readUInt32LE(4) + 8;
  if (declaredLength !== buffer.length) {
    throw new Error(`PRODUCT_IMAGES: ${id} is truncated (${buffer.length}/${declaredLength} bytes)`);
  }
}

await mkdir(publicRoot, { recursive: true });

for (const asset of assets) {
  const encoded = (await readFile(new URL(asset.data, import.meta.url), "utf8")).replace(/\s+/g, "");
  const buffer = Buffer.from(encoded, "base64");
  assertWebP(buffer, asset.id);
  await writeFile(new URL(asset.output, import.meta.url), buffer);
}

let shop = await readFile(shopUrl, "utf8");
for (const asset of assets) {
  if (!shop.includes(asset.from)) throw new Error(`PRODUCT_IMAGES: ${asset.id} source image reference not found`);
  shop = shop.replace(asset.from, asset.to);
}

const oldSrc = "src={asset(bar.img)}";
const newSrc = 'src={bar.img.startsWith("/product-") ? bar.img : asset(bar.img)}';
if (!shop.includes(oldSrc)) throw new Error("PRODUCT_IMAGES: Shop image src expression not found");
shop = shop.replace(oldSrc, newSrc);
await writeFile(shopUrl, shop, "utf8");

console.log("PRODUCT_IMAGES_PREPARED", {
  outputs: assets.map(({ id, output }) => ({ id, output: output.replace("../public/", "/") })),
  webpValidated: true,
});
