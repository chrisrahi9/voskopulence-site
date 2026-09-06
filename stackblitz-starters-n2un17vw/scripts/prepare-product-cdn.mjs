import { mkdir, readFile, writeFile } from "node:fs/promises";

const shopUrl = new URL("../app/shop/page.tsx", import.meta.url);
const publicProducts = new URL("../public/products-live/", import.meta.url);
const CDN = "https://vosko-cdn.b-cdn.net";

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
    old: 'img: "/Fig_sea.png",',
    base: "product-fig-cedar",
    local: "/products-live/product-fig-cedar.png",
    filename: "product-fig-cedar.png",
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
  return [
    `${CDN}/products/${base}.png`,
    `${CDN}/products/${base}.png.png`,
    `${CDN}/products/${base}.PNG`,
    `${CDN}/Products/${base}.png`,
    `${CDN}/${base}.png`,
  ];
}

async function fetchFirstImage(product) {
  const attempted = [];
  for (const url of candidateUrls(product.base)) {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        accept: "image/png,image/*;q=0.8,*/*;q=0.5",
        "user-agent": "Voskopulence-Vercel-Build/1.0",
      },
    });

    attempted.push(`${url} -> ${response.status}`);
    console.log("PRODUCT_CDN_PROBE", {
      label: product.label,
      url,
      status: response.status,
      contentType: response.headers.get("content-type"),
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
console.log("PRODUCT_CDN: Bunny images found, verified, and mirrored into Vercel static assets");
