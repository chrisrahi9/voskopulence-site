import { readFile, writeFile } from "node:fs/promises";

const homeUrl = new URL("../app/page.tsx", import.meta.url);
const footerUrl = new URL("../app/_components/SiteFooter.tsx", import.meta.url);
const shopUrl = new URL("../app/shop/page.tsx", import.meta.url);

function replaceRequired(source, from, to, label) {
  if (!source.includes(from)) throw new Error(`BRAND_REFINEMENT: ${label} not found`);
  return source.replace(from, to);
}

let home = await readFile(homeUrl, "utf8");
let footer = await readFile(footerUrl, "utf8");
let shop = await readFile(shopUrl, "utf8");

home = replaceRequired(
  home,
  "Solid shampoo & conditioner bars inspired by Mediterranean botanicals and developed toward COSMOS-style formulation principles.",
  "Botanical rituals shaped by the Mediterranean, beginning with concentrated solid haircare.",
  "hero positioning"
);

home = replaceRequired(
  home,
  "A Mediterranean vocabulary for hair and scalp.",
  "A Mediterranean vocabulary, distilled.",
  "botanical heading"
);

home = replaceRequired(home, ">About us</h2>", ">The house</h2>", "about heading");

home = replaceRequired(
  home,
  "Founded in 2024, Voskopulence explores a quieter approach to haircare: concentrated solid formulas, naturally derived ingredients and botanical profiles shaped by the Mediterranean. We are building each bar with an emphasis on thoughtful formulation, lower-waste packaging and a sensory ritual that feels considered rather than excessive.",
  "Voskopulence is a Mediterranean house of botanical rituals. Our first chapter takes form in concentrated solid haircare, where considered formulation, lower-waste design and a distinctive botanical palette come together in a quieter kind of luxury.",
  "house copy"
);

home = replaceRequired(
  home,
  '<p className="luxury-kicker text-[#777065]">The first collection</p>',
  '<p className="luxury-kicker text-[#777065]">The first chapter</p>',
  "final band kicker"
);

home = replaceRequired(
  home,
  "Be there when the first batch leaves the lab.",
  "The story begins with hair.",
  "final band heading"
);

home = replaceRequired(
  home,
  "Voskopulence is currently pre-launch. Explore the bars and join the waitlist for the formula that fits your ritual.",
  "Three solid formulas introduce the world of Voskopulence. Explore the collection and join the waitlist for first availability.",
  "final band copy"
);

home = replaceRequired(home, "Explore the first collection", "Discover the first collection", "final CTA");

shop = replaceRequired(
  shop,
  "A first collection of concentrated shampoo and conditioner bars, each shaped around a different hair ritual and the same Mediterranean sensibility.",
  "The first chapter of Voskopulence: three concentrated formulas shaped around distinct hair rituals and one Mediterranean sensibility.",
  "shop introduction"
);

footer = replaceRequired(
  footer,
  "Mediterranean haircare · Pre-launch",
  "A Mediterranean house · Pre-launch",
  "footer kicker"
);

footer = replaceRequired(
  footer,
  "Rituals inspired by the coast, concentrated into solid form.",
  "A world of Mediterranean rituals, beginning in solid form.",
  "footer heading"
);

footer = replaceRequired(
  footer,
  "Botanical shampoo and conditioner bars developed with naturally derived ingredients, considered formulation principles and a lower-waste format.",
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
