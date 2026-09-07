import { readFile, writeFile } from "node:fs/promises";

const shopUrl = new URL("../app/shop/page.tsx", import.meta.url);
let source = await readFile(shopUrl, "utf8");

const frameFrom = 'className="bg-[#f3eee5] overflow-hidden rounded-[2rem]"';
const frameTo = 'className="bg-[#f3eee5] overflow-hidden rounded-[2rem] aspect-[4/5]"';
const imageFrom = 'className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015]"';
const imageTo = 'className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.015]"';

if (!source.includes(frameFrom) && !source.includes(frameTo)) {
  throw new Error("SHOP_IMAGE_FRAMES: product image frame not found");
}
if (!source.includes(imageFrom) && !source.includes(imageTo)) {
  throw new Error("SHOP_IMAGE_FRAMES: product image class not found");
}

source = source.replace(frameFrom, frameTo);
source = source.replace(imageFrom, imageTo);

await writeFile(shopUrl, source, "utf8");

console.log("SHOP_IMAGE_FRAMES_PREPARED", {
  ratio: "4:5",
  crop: "object-cover",
  alignment: "center",
  consistentCardRow: true,
});
