import { readFile, writeFile } from "node:fs/promises";

const homeUrl = new URL("../app/page.tsx", import.meta.url);
const shopUrl = new URL("../app/shop/page.tsx", import.meta.url);

function ensureImageImport(source, label) {
  if (source.includes('from "next/image"')) return source;
  const anchor = 'import { useRouter } from "next/navigation";';
  if (!source.includes(anchor)) {
    throw new Error(`RESPONSIVE_IMAGES: ${label} router import not found`);
  }
  return source.replace(anchor, `${anchor}\nimport Image from "next/image";`);
}

function replaceRegexRequired(source, pattern, to, label) {
  if (source.includes(to)) return source;
  if (!pattern.test(source)) {
    throw new Error(`RESPONSIVE_IMAGES: ${label} not found`);
  }
  return source.replace(pattern, to);
}

let home = ensureImageImport(await readFile(homeUrl, "utf8"), "home");
let shop = ensureImageImport(await readFile(shopUrl, "utf8"), "shop");

shop = replaceRegexRequired(
  shop,
  /<img\s+[^>]*src=\{bar\.img\}[^>]*\/>/m,
  `<Image
                    src={bar.img}
                    alt={bar.name}
                    width={800}
                    height={1000}
                    sizes="(min-width: 1024px) 31vw, (min-width: 640px) 48vw, 100vw"
                    quality={88}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.015]"
                  />`,
  "shop product image"
);

home = replaceRegexRequired(
  home,
  /<img\s+[^>]*src="\/products-live\/true-cedar\.png"[^>]*\/>/m,
  `<Image
              src="/products-live/true-cedar.png"
              alt="Fig & Cedar Nourishing Bar"
              width={800}
              height={1000}
              sizes="(min-width: 1024px) 384px, (min-width: 640px) 320px, 288px"
              quality={90}
              className="w-72 sm:w-80 lg:w-96 h-auto object-cover object-center drop-shadow-xl rounded-2xl"
            />`,
  "home spotlight image"
);

await writeFile(homeUrl, home, "utf8");
await writeFile(shopUrl, shop, "utf8");

console.log("RESPONSIVE_IMAGES_PREPARED", {
  shop: {
    responsiveSizing: true,
    quality: 88,
    formats: ["AVIF", "WebP"],
    frame: "4:5",
  },
  spotlight: {
    responsiveSizing: true,
    quality: 90,
    formats: ["AVIF", "WebP"],
    frame: "4:5",
  },
  sourceMastersPreserved: true,
});
