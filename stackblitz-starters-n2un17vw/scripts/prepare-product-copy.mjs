import { readFile, writeFile } from "node:fs/promises";

const shopUrl = new URL("../app/shop/page.tsx", import.meta.url);
let source = await readFile(shopUrl, "utf8");

const replacements = [
  [
    'name: "Mediterranean Thyme & Rosemary Bar",',
    'name: "Herbal Mint & Rosemary Shampoo Bar",',
    "mint and rosemary product name",
  ],
  [
    'tagline: "A fresh herbal cleanse that keeps roots light and awake.",',
    'tagline: "A refreshing herbal cleanse with rosemary, wild mint and nettle for a light, revitalised finish.",',
    "mint and rosemary tagline",
  ],
  [
    'hairType: "Normal to oily hair · Scalps that feel heavy or quickly greasy",',
    'hairType: "Normal to oily hair · Scalps prone to excess oil or buildup",',
    "mint and rosemary hair type",
  ],
  [
    '      "Gently clarifies without stripping",\n      "Helps reduce excess sebum at the roots",\n      "Leaves hair light and refreshed",',
    '      "Gently cleanses without leaving hair feeling stripped",\n      "Helps roots feel fresh, light and balanced",\n      "Rich, creamy lather with an invigorating herbal scent",',
    "mint and rosemary benefits",
  ],
  [
    '      "Rosemary, thyme & mint essential oils, coconut & olive oils, castor oil, shea butter, nettle leaf powder",',
    '      "Coconut oil, olive oil, castor oil, shea butter, wild mint essential oil, rosemary essential oil & nettle leaf powder",',
    "mint and rosemary ingredients",
  ],
  [
    'name: "Fig & Cedar Nourishing Bar",',
    'name: "Fig & Cedar Nourishing Shampoo Bar",',
    "fig and cedar product name",
  ],
  [
    'tagline: "Creamy comfort for hair that likes extra softness and care.",',
    'tagline: "A creamy, comforting cleanse with a warm fig-and-cedar character for hair that benefits from extra softness.",',
    "fig and cedar tagline",
  ],
  [
    'hairType: "Normal to dry hair · Frizz or sensitised ends",',
    'hairType: "Normal to dry hair · Frizz-prone lengths or dry-feeling ends",',
    "fig and cedar hair type",
  ],
  [
    '      "Softens and smooths the hair fibre",\n      "Adds light nourishment without heaviness",\n      "Leaves a warm, fruity Mediterranean scent",',
    '      "Gently cleanses while helping preserve a soft, conditioned feel",\n      "Helps smooth frizz and improve manageability",\n      "Leaves hair supple with a warm, woody-fruity scent",',
    "fig and cedar benefits",
  ],
  [
    '      "Fig extract, cedarwood & lavender, coconut & olive oils, castor oil, shea butter.",',
    '      "Fig extract, cedarwood, lavender, coconut oil, olive oil, castor oil & shea butter",',
    "fig and cedar ingredients",
  ],
  [
    'tagline: "Detangling solid conditioner with coastal freshness.",',
    'tagline: "A lightweight solid conditioner with bright citrus and coastal freshness, created to soften and detangle after washing.",',
    "lemon conditioner tagline",
  ],
  [
    'hairType: "All hair types · ideal after every wash",',
    'hairType: "All hair types · Especially hair that tangles easily or needs lightweight softness",',
    "lemon conditioner hair type",
  ],
  [
    '      "Instantly eases tangles after washing",\n      "Adds softness and shine",\n      "Light, fresh citrus–marine scent",',
    '      "Helps detangle and improve combability",\n      "Leaves hair smoother, softer and more manageable",\n      "Adds light shine without a heavy finish",',
    "lemon conditioner benefits",
  ],
  [
    '      "Lemon peel oil, sea minerals, jojoba oil, coconut & olive oils, conditioning esters.",',
    '      "Lemon peel oil, jojoba oil, coconut oil, olive oil, sea minerals & conditioning esters",',
    "lemon conditioner ingredients",
  ],
];

for (const [from, to, label] of replacements) {
  if (source.includes(to)) continue;
  if (!source.includes(from)) {
    throw new Error(`PRODUCT_COPY: ${label} source text not found`);
  }
  source = source.replace(from, to);
}

if (source.includes("Mediterranean Thyme & Rosemary Bar")) {
  throw new Error("PRODUCT_COPY: legacy thyme product name remains");
}

await writeFile(shopUrl, source, "utf8");

console.log("PRODUCT_COPY_PREPARED", {
  shopOnly: true,
  layoutChanged: false,
  productNamesCorrected: true,
  copyRefined: true,
  medicalClaimsAdded: false,
});
