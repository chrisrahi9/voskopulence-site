import { mkdir, readFile, writeFile } from "node:fs/promises";

const shopUrl = new URL("../app/shop/page.tsx", import.meta.url);
const publicProducts = new URL("../public/products-live/", import.meta.url);

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
    remote: "https://vosko-cdn.b-cdn.net/products/product-thyme-rosemary.png",
    local: "/products-live/product-thyme-rosemary.png",
    filename: "product-thyme-rosemary.png",
  },
  {
    label: "fig",
    old: 'img: "/Fig_sea.png",',
    remote: "https://vosko-cdn.b-cdn.net/products/product-fig-cedar.png",
    local: "/products-live/product-fig-cedar.png",
    filename: "product-fig-cedar.png",
  },
  {
    label: "lemon",
    old: 'img: "/Lemon_sea.png",',
    remote: "https://vosko-cdn.b-cdn.net/products/product-lemon-seabreeze.png",
    local: "/products-live/product-lemon-seabreeze.png",
    filename: "product-lemon-seabreeze.png",
  },
];

await mkdir(publicProducts, { recursive: true });

for (const product of products) {
  const response = await fetch(product.remote, {
    cache: "no-store",
    headers: {
      accept: "image/png,image/*;q=0.8,*/*;q=0.5",
      "user-agent": "Voskopulence-Vercel-Build/1.0",
    },
  });

  console.log("PRODUCT_CDN_CHECK", {
    label: product.label,
    url: product.remote,
    status: response.status,
    contentType: response.headers.get("content-type"),
    contentLength: response.headers.get("content-length"),
  });

  if (!response.ok) {
    throw new Error(`PRODUCT_CDN: ${product.label} returned HTTP ${response.status}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 10000) {
    throw new Error(`PRODUCT_CDN: ${product.label} image is unexpectedly small (${bytes.length} bytes)`);
  }

  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!bytes.subarray(0, 8).equals(pngSignature)) {
    throw new Error(`PRODUCT_CDN: ${product.label} did not return a valid PNG`);
  }

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
console.log("PRODUCT_CDN: verified Bunny images and mirrored them into the Vercel static build");
