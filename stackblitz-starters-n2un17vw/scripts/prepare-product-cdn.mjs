import { mkdir, readFile, writeFile } from "node:fs/promises";

const shopUrl = new URL("../app/shop/page.tsx", import.meta.url);
const publicProducts = new URL("../public/products-live/", import.meta.url);
const CDN = "https://vosko-cdn.b-cdn.net";
const PRODUCT_ASSET_VERSION = process.env.VERCEL_GIT_COMMIT_SHA || `${Date.now()}`;

function replaceRequired(source, from, to, label) {
  if (source.includes(to)) return source;
  if (!source.includes(from)) {
    throw new Error(`PRODUCT_CDN: ${label} not found`);
  }
  return source.replace(from, to);
}

const products = [
  {
    label: "thyme",
    old: 'img: "/Thyme_sea.png",',
    base: "product-thyme-rosemary",
    local: "/products-live/product-thyme-rosemary.png",
    filename: "product-thyme-rosemary.png",
  },
  {
    label: "fig",
    old: 'img: "/true-cedar.png",',
    base: "true-cedar",
    local: `/products-live/true-cedar.png?v=${PRODUCT_ASSET_VERSION}`,
    filename: "true-cedar.png",
  },
  {
    label: "lemon",
    old: 'img: "/Lemon_sea.png",',
    base: "product-lemon-seabreeze",
    local: "/products-live/product-lemon-seabreeze.png",
    filename: "product-lemon-seabreeze.png",
  },
];

function candidateUrls(base) {
  const paths = [
    `${CDN}/products/${base}.png`,
    `${CDN}/products/${base}.png.png`,
    `${CDN}/products/${base}`,
    `${CDN}/products/${base}.PNG`,
    `${CDN}/Products/${base}.png`,
    `${CDN}/${base}.png`,
  ];
  return paths.map((url) => `${url}?v=${encodeURIComponent(PRODUCT_ASSET_VERSION)}`);
}

async function fetchFirstImage(product) {
  const attempted = [];
  for (const url of candidateUrls(product.base)) {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        accept: "image/png,image/*;q=0.8,*/*;q=0.5",
        "cache-control": "no-cache, no-store, max-age=0",
        pragma: "no-cache",
        "user-agent": "Voskopulence-Vercel-Build/1.0",
      },
    });

    attempted.push(`${url} -> ${response.status}`);
    console.log("PRODUCT_CDN_PROBE", {
      label: product.label,
      url,
      status: response.status,
      contentType: response.headers.get("content-type"),
      age: response.headers.get("age"),
      etag: response.headers.get("etag"),
      lastModified: response.headers.get("last-modified"),
    });

    if (!response.ok) continue;

    const bytes = Buffer.from(await response.arrayBuffer());
    const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    if (bytes.length >= 10000 && bytes.subarray(0, 8).equals(pngSignature)) {
      console.log("PRODUCT_CDN_MATCH", { label: product.label, url, bytes: bytes.length });
      return { url, bytes };
    }
  }

  throw new Error(`PRODUCT_CDN: no valid image found for ${product.label}. Tried: ${attempted.join(" | ")}`);
}

await mkdir(publicProducts, { recursive: true });

for (const product of products) {
  const { bytes } = await fetchFirstImage(product);
  await writeFile(new URL(product.filename, publicProducts), bytes);
}

let source = await readFile(shopUrl, "utf8");
for (const product of products) {
  source = replaceRequired(
    source,
    product.old,
    `img: "${product.local}",`,
    `${product.label} image`
  );
}

source = replaceRequired(
  source,
  'src={asset(bar.img)}',
  'src={bar.img}',
  "local mirrored image source"
);

await writeFile(shopUrl, source, "utf8");
console.log("PRODUCT_CDN: Bunny product images fetched, verified, and mirrored; Fig & Cedar uses true-cedar creative");
