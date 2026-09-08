import { readFile, writeFile } from "node:fs/promises";

const homeUrl = new URL("../app/page.tsx", import.meta.url);
const footerUrl = new URL("../app/_components/SiteFooter.tsx", import.meta.url);
const shopUrl = new URL("../app/shop/page.tsx", import.meta.url);

function replaceRegexRequired(source, pattern, to, label) {
  if (!pattern.test(source)) throw new Error(`BRAND_REFINEMENT: ${label} not found`);
  return source.replace(pattern, to);
}

let home = await readFile(homeUrl, "utf8");
let footer = await readFile(footerUrl, "utf8");
let shop = await readFile(shopUrl, "utf8");

home = replaceRegexRequired(
  home,
  /Solid shampoo\s*&(?:amp;)?\s*conditioner bars inspired by Mediterranean botanicals and developed toward COSMOS-style formulation principles\./,
  "Botanical rituals shaped by the Mediterranean, beginning with concentrated solid haircare.",
  "hero positioning"
);

home = replaceRegexRequired(
  home,
  /A Mediterranean vocabulary for hair and scalp\./,
  "A Mediterranean vocabulary, distilled.",
  "botanical heading"
);

home = replaceRegexRequired(home, />\s*About us\s*<\/h2>/, ">The house</h2>", "about heading");

home = replaceRegexRequired(
  home,
  /Founded in 2024, Voskopulence explores a quieter approach to haircare:[\s\S]*?rather than excessive\./,
  "Voskopulence is a Mediterranean house of botanical rituals. Our first chapter takes form in concentrated solid haircare, where considered formulation, lower-waste design and a distinctive botanical palette come together in a quieter kind of luxury.",
  "house copy"
);

home = replaceRegexRequired(
  home,
  /<p className="luxury-kicker text-\[#777065\]">\s*The first collection\s*<\/p>/,
  '<p className="luxury-kicker text-[#777065]">The first chapter</p>',
  "final band kicker"
);

home = replaceRegexRequired(
  home,
  /Be there when the first batch leaves the lab\./,
  "The story begins with hair.",
  "final band heading"
);

home = replaceRegexRequired(
  home,
  /Voskopulence is currently pre-launch\. Explore the bars and join the waitlist for the formula that fits your ritual\./,
  "Three solid formulas introduce the world of Voskopulence. Explore the collection and join the waitlist for first availability.",
  "final band copy"
);

home = replaceRegexRequired(home, /Explore the first collection/, "Discover the first collection", "final CTA");

shop = replaceRegexRequired(
  shop,
  /A first collection of concentrated shampoo and conditioner bars, each shaped around a different hair ritual and the same Mediterranean sensibility\./,
  "The first chapter of Voskopulence: three concentrated formulas shaped around distinct hair rituals and one Mediterranean sensibility.",
  "shop introduction"
);

footer = replaceRegexRequired(
  footer,
  /Mediterranean haircare · Pre-launch/,
  "A Mediterranean house · Pre-launch",
  "footer kicker"
);

footer = replaceRegexRequired(
  footer,
  /Rituals inspired by the coast, concentrated into solid form\./,
  "A world of Mediterranean rituals, beginning in solid form.",
  "footer heading"
);

footer = replaceRegexRequired(
  footer,
  /Botanical shampoo and conditioner bars developed with naturally derived ingredients,\s*considered formulation principles and a lower-waste format\./,
  "Our first collection explores botanical solid haircare through considered formulation, a lower-waste format and a distinctly Mediterranean point of view.",
  "footer copy"
);

await writeFile(homeUrl, home);
await writeFile(shopUrl, shop);
await writeFile(footerUrl, footer);

console.log("BRAND_REFINEMENT_PREPARED", {
  broaderHousePositioning: true,
  haircareFramedAsFirstChapter: true,
  futureCategoriesNotPromised: true,
  startupLanguageReduced: true,
  layoutChanged: false,
});
