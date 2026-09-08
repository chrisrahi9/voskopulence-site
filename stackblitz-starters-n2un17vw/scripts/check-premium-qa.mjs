import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const pages = [
  "app/page.tsx",
  "app/shop/page.tsx",
  "app/contact/page.tsx",
  "app/sustainability/page.tsx",
];

function assert(condition, message) {
  if (!condition) throw new Error(`PREMIUM_QA: ${message}`);
}

const loaded = new Map();
for (const file of pages) {
  loaded.set(file, await readFile(new URL(file, root), "utf8"));
}

const labels = ["Home", "Shop", "About", "Sustainability", "Contact"];
for (const [file, source] of loaded) {
  for (const label of labels) {
    assert(source.includes(label), `${file} is missing navigation label ${label}`);
  }

  assert(
    source.includes("hidden xl:flex") && source.includes("xl:hidden"),
    `${file} does not use the canonical xl desktop/mobile breakpoint`
  );
  assert(
    source.includes("translate-y-[2px]") || !source.includes("hidden xl:flex"),
    `${file} desktop navigation lost its 2px optical alignment`
  );
  assert(
    source.includes("translate-y-[5px]"),
    `${file} mobile burger lost its 5px optical alignment`
  );
  assert(
    !source.includes('mode: "no-cors"'),
    `${file} contains a no-cors form/analytics request`
  );
  assert(
    !source.includes(".png.png"),
    `${file} references a legacy double-extension image`
  );
  assert(
    !/chrissiky/i.test(source),
    `${file} contains legacy Chrissiky branding`
  );
}

const home = loaded.get("app/page.tsx");
const shop = loaded.get("app/shop/page.tsx");
const contact = loaded.get("app/contact/page.tsx");

assert(home.includes("/products-live/true-cedar.png"), "Homepage Spotlight is not using true-cedar");
assert(!home.includes('src={asset("/Spotlight_pic.png")}'), "Homepage still uses the legacy Spotlight image");
assert(shop.includes("/products-live/true-cedar.png"), "Shop Fig & Cedar is not using true-cedar");
assert(shop.includes('const ANALYTICS_ENDPOINT = "/api/interest";'), "Shop is not using same-origin interest API");
assert(contact.includes('const FORMS_ENDPOINT = "/api/contact";'), "Contact is not using same-origin contact API");
assert(shop.includes("...getMarketingContext(),"), "Shop submissions are missing campaign context");
assert(contact.includes("...getMarketingContext(),"), "Contact submissions are missing campaign context");

const interestRoute = await readFile(new URL("app/api/interest/route.ts", root), "utf8");
const contactRoute = await readFile(new URL("app/api/contact/route.ts", root), "utf8");
for (const field of ["landingUrl", "referrer", "utmSource", "utmMedium", "utmCampaign"]) {
  assert(interestRoute.includes(field), `interest API does not forward ${field}`);
  assert(contactRoute.includes(field), `contact API does not forward ${field}`);
}

console.log("PREMIUM_QA_PASSED", {
  pages,
  navigationUniform: true,
  mobileOpticalAlignmentPx: 5,
  desktopOpticalAlignmentPx: 2,
  cleanProductFilenames: true,
  trueCedarEverywhere: true,
  verifiedSameOriginForms: true,
  campaignContext: true,
  legacyBrandingAbsent: true,
});
