import { readFile, writeFile } from "node:fs/promises";

const appRoot = new URL("../app/", import.meta.url);
const pages = ["page.tsx", "shop/page.tsx", "contact/page.tsx", "sustainability/page.tsx"];

function replaceRequired(source, from, to, label) {
  if (!source.includes(from)) throw new Error(`LUXURY_REDESIGN: ${label} not found`);
  return source.replace(from, to);
}

function replaceRegexRequired(source, pattern, to, label) {
  if (!pattern.test(source)) throw new Error(`LUXURY_REDESIGN: ${label} not found`);
  return source.replace(pattern, to);
}

function addFooterImport(source, file) {
  if (source.includes('import SiteFooter from "./_components/SiteFooter"') || source.includes('import SiteFooter from "../_components/SiteFooter"')) return source;
  const importLine = /import \{ useRouter \} from "next\/navigation";\s*/;
  if (!importLine.test(source)) throw new Error(`LUXURY_REDESIGN: ${file} router import not found`);
  const footerPath = file === "page.tsx" ? "./_components/SiteFooter" : "../_components/SiteFooter";
  return source.replace(importLine, (m) => `${m}import SiteFooter from "${footerPath}";\n`);
}

function redesignHome(source) {
  source = addFooterImport(source, "page.tsx");

  source = replaceRegexRequired(
    source,
    /Solid shampoo &amp; conditioner bars crafted to\s*COSMOS standards with botanicals inspired by sunlit\s*coasts — rosemary, lemon, cedar &amp; fig\./,
    "Solid shampoo &amp; conditioner bars inspired by Mediterranean botanicals and developed toward COSMOS-style formulation principles.",
    "home hero claim"
  );

  const heroCta = `
              <a
                href="/shop"
                className="mt-9 inline-flex items-center gap-3 border-b border-white/75 pb-1 text-[0.72rem] sm:text-xs font-semibold uppercase tracking-[0.2em] text-white transition-opacity duration-200 hover:opacity-70"
              >
                Explore the collection
                <span aria-hidden="true">↗</span>
              </a>
`;
  source = replaceRequired(
    source,
    "              <button\n                ref={ctaRef}",
    `${heroCta}\n              <button\n                ref={ctaRef}`,
    "home hero CTA anchor"
  );
  source = source.replace("group relative mt-10 inline-flex", "group relative mt-7 inline-flex");

  source = source.replace(
    'className="mt-3 heading-script text-3xl sm:text-4xl text-[#004642]"',
    'className="mt-3 heading-editorial text-4xl sm:text-5xl leading-none text-[#004642]"'
  );
  source = source.replace(
    /Solid shampoo crafted to COSMOS standards with rosemary\s*and mint\. Clean, concentrated, travel-ready\./,
    "A concentrated shampoo bar built around rosemary and mint, with a fresh herbal character inspired by the Mediterranean coast."
  );
  source = source.replace(
    "COSMOS-standard • Vegan & Cruelty-Free • 40+ washes",
    "COSMOS-style formulation direction • Vegan-first • Concentrated format"
  );
  source = source.replace("Learn about the formula", "Explore our formulation approach");

  const editorialSections = `
      {/* ===================== BOTANICAL EDITORIAL ===================== */}
      <section className="relative z-20 bg-[#f3eee5] text-[#003f3b] py-20 sm:py-24">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-10">
          <div className="max-w-2xl">
            <p className="luxury-kicker text-[#70685d]">The botanical palette</p>
            <h2 className="mt-5 heading-editorial text-4xl sm:text-6xl leading-[0.95]">
              A Mediterranean vocabulary for hair and scalp.
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 border-y border-[#004642]/20">
            {[
              { name: "Rosemary", note: "Herbal · aromatic", cls: "py-8 sm:py-10 pr-6" },
              { name: "Fig", note: "Soft · sun-ripened", cls: "py-8 sm:py-10 pl-6 border-l border-[#004642]/16" },
              { name: "Cedar", note: "Dry · grounding", cls: "py-8 sm:py-10 pr-6 border-t lg:border-t-0 lg:border-l lg:pl-6 border-[#004642]/16" },
              { name: "Lemon", note: "Bright · coastal", cls: "py-8 sm:py-10 pl-6 border-l border-t lg:border-t-0 border-[#004642]/16" },
            ].map(({ name, note, cls }) => (
              <div key={name} className={cls}>
                <p className="heading-editorial text-3xl sm:text-4xl">{name}</p>
                <p className="mt-2 text-[0.68rem] uppercase tracking-[0.18em] text-[#70685d]">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== SOLID BY DESIGN ===================== */}
      <section className="relative z-20 bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-10 grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 items-start">
          <div>
            <p className="luxury-kicker text-[#6d776f]">Solid by design</p>
            <h2 className="mt-5 heading-editorial text-4xl sm:text-6xl leading-[0.95] text-[#004642]">
              Less water to ship. Less packaging to leave behind.
            </h2>
          </div>
          <div className="lg:pt-8">
            <p className="max-w-xl text-base sm:text-lg leading-relaxed text-neutral-700">
              Solid haircare concentrates the ritual into a compact format. The product itself needs no plastic bottle, travels easily and avoids shipping the water that makes up much of a traditional liquid formula.
            </p>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 border-y editorial-rule">
              <div className="py-6 sm:pr-6">
                <p className="heading-editorial text-3xl text-[#004642]">Concentrated</p>
                <p className="mt-2 text-xs leading-relaxed text-neutral-600">A compact format designed around the active ritual.</p>
              </div>
              <div className="py-6 sm:px-6 border-t sm:border-t-0 sm:border-l editorial-rule">
                <p className="heading-editorial text-3xl text-[#004642]">Bottle-free</p>
                <p className="mt-2 text-xs leading-relaxed text-neutral-600">No plastic bottle for the product itself.</p>
              </div>
              <div className="py-6 sm:pl-6 border-t sm:border-t-0 sm:border-l editorial-rule">
                <p className="heading-editorial text-3xl text-[#004642]">Travel-ready</p>
                <p className="mt-2 text-xs leading-relaxed text-neutral-600">Small, solid and easy to pack without liquid limits.</p>
              </div>
            </div>
            <a href="/sustainability" className="mt-8 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#004642] border-b border-[#004642]/50 pb-1 hover:opacity-65 transition-opacity">
              Read our formulation philosophy <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>

`;
  source = replaceRequired(
    source,
    "      {/* ===================== ABOUT ===================== */}",
    `${editorialSections}      {/* ===================== ABOUT ===================== */}`,
    "home about marker"
  );

  source = source.replace(
    'className="heading-script text-4xl sm:text-5xl mb-6 md:drop-shadow-[0_-12px_30px_-12px_rgba(140,154,145,0.28)]"',
    'className="heading-editorial text-5xl sm:text-7xl leading-none mb-7 md:drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]"'
  );

  source = replaceRegexRequired(
    source,
    /Founded in 2024, Voskopulence emerged from a deep passion[\s\S]*?essence of sustainable\s*living\./,
    "Founded in 2024, Voskopulence explores a quieter approach to haircare: concentrated solid formulas, naturally derived ingredients and botanical profiles shaped by the Mediterranean. We are building each bar with an emphasis on thoughtful formulation, lower-waste packaging and a sensory ritual that feels considered rather than excessive.",
    "home about copy"
  );

  const ending = `      {/* No extra global CSS needed beyond transitions above */}`;
  const finalBand = `
      <section className="relative z-20 bg-[#fbf8f2] py-20 sm:py-24 border-t border-[#004642]/10">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="luxury-kicker text-[#777065]">The first collection</p>
          <h2 className="mt-5 heading-editorial text-4xl sm:text-6xl leading-[0.95] text-[#004642]">
            Be there when the first batch leaves the lab.
          </h2>
          <p className="mt-6 mx-auto max-w-xl text-sm sm:text-base leading-relaxed text-neutral-700">
            Voskopulence is currently pre-launch. Explore the bars and join the waitlist for the formula that fits your ritual.
          </p>
          <a href="/shop" className="mt-8 inline-flex items-center justify-center rounded-full bg-[#004642] px-7 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-transform hover:-translate-y-0.5">
            Explore the first collection
          </a>
        </div>
      </section>

      <SiteFooter />
`;
  source = replaceRequired(source, ending, `${finalBand}\n${ending}`, "home footer marker");
  return source;
}

function redesignShop(source) {
  source = addFooterImport(source, "shop/page.tsx");
  source = source.replace(
    'className="heading-script text-4xl sm:text-5xl text-[#004642] text-center mb-4"',
    'className="heading-editorial text-5xl sm:text-7xl leading-none text-[#004642] text-center mb-5"'
  );
  source = source.replace(
    /Solid shampoo and conditioner bars crafted to COSMOS standards,\s*designed for different hair needs but all with the same Mediterranean,\s*eco-conscious spirit\./,
    "A first collection of concentrated shampoo and conditioner bars, each shaped around a different hair ritual and the same Mediterranean sensibility."
  );

  const introAnchor = `          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">`;
  const launchNote = `          <div className="mb-12 border-y border-[#004642]/16 py-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="luxury-kicker text-[#004642]">Pre-launch collection</p>
            <p className="text-xs text-neutral-600">No payment today · Join the waitlist for first availability</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">`;
  source = replaceRequired(source, introAnchor, launchNote, "shop grid");

  source = source.replace(
    'className="flex flex-col rounded-3xl bg-[#f6fbf9] border border-[#8C9A91]/30 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.3)] overflow-hidden"',
    'className="group flex flex-col overflow-hidden"'
  );
  source = source.replace('className="bg-[#e6f2ee]"', 'className="bg-[#f3eee5] overflow-hidden rounded-[2rem]"');
  source = source.replace(
    'className="w-full h-auto object-cover"',
    'className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015]"'
  );
  source = source.replace('className="p-5 flex flex-col gap-3 flex-1"', 'className="pt-5 px-1 flex flex-col gap-3 flex-1"');
  source = source.replace(
    'className="text-lg font-semibold text-[#004642]"',
    'className="heading-editorial text-2xl leading-tight text-[#004642]"'
  );
  source = source.replace(
    'className="mt-1 text-sm text-neutral-700 list-disc list-inside space-y-1"',
    'className="mt-2 border-t border-[#004642]/14 pt-4 text-sm text-neutral-700 space-y-1.5"'
  );
  source = source.replace(
    /className="inline-flex w-full items-center justify-center rounded-full bg-\[#004642\][\s\S]*?focus-visible:ring-\[#8C9A91\]\/70"/,
    'className="inline-flex w-full items-center justify-center rounded-full bg-[#004642] px-4 py-3 text-xs font-semibold tracking-[0.14em] text-white hover:bg-[#015b55] transition-all duration-200 hover:-translate-y-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C9A91]/70"'
  );
  source = source.replace(">\n                      BUY NOW\n                    </button>", ">\n                      JOIN WAITLIST\n                    </button>");
  source = source.replace("Pre-launch · Out of stock", "Pre-launch · Join the waitlist");
  source = source.replace(
    "This product is not available to purchase yet, but you can leave",
    "This product is not available to purchase yet. Leave"
  );

  source = replaceRegexRequired(
    source,
    /\n\s*<\/main>\s*\n\s*<\/div>\s*\n\s*\);\s*\n}/,
    `\n      </main>\n      <SiteFooter />\n    </div>\n  );\n}`,
    "shop closing"
  );
  return source;
}

function redesignSustainability(source) {
  source = addFooterImport(source, "sustainability/page.tsx");
  source = source.replace(
    'className="heading-script text-4xl sm:text-5xl text-[#004642] text-center mb-4"',
    'className="heading-editorial text-5xl sm:text-7xl leading-none text-[#004642] text-center mb-5"'
  );
  source = source.replace(
    "A transparent look at how Voskopulence bars are crafted:\n              ingredients, COSMOS-style standards, sustainability choices\n              and our formulation philosophy.",
    "A transparent look at our formulation direction, ingredient choices, lower-waste format and where official certification stands today."
  );

  const cosmosAnchor = `          {/* COSMOS EXPLAINER */}`;
  const principles = `          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 border-y border-[#004642]/16 text-center sm:text-left">
            <div className="py-6 sm:pr-6"><p className="luxury-kicker text-[#6f776f]">Principle 01</p><p className="mt-2 heading-editorial text-2xl text-[#004642]">Transparency first</p></div>
            <div className="py-6 sm:px-6 border-t sm:border-t-0 sm:border-l border-[#004642]/16"><p className="luxury-kicker text-[#6f776f]">Principle 02</p><p className="mt-2 heading-editorial text-2xl text-[#004642]">Concentrated format</p></div>
            <div className="py-6 sm:pl-6 border-t sm:border-t-0 sm:border-l border-[#004642]/16"><p className="luxury-kicker text-[#6f776f]">Principle 03</p><p className="mt-2 heading-editorial text-2xl text-[#004642]">Botanical character</p></div>
          </div>

${cosmosAnchor}`;
  source = replaceRequired(source, cosmosAnchor, principles, "sustainability principles");

  source = source.replace(
    'className="mt-10 rounded-3xl bg-[#f6fbf9] border border-[#8C9A91]/30 p-6 lg:p-7 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)]"',
    'className="mt-14 border-b border-[#004642]/16 pb-10"'
  );
  source = source.replace(
    'className="mt-10 grid gap-6 md:grid-cols-2"',
    'className="mt-14 grid gap-0 md:grid-cols-2 overflow-hidden border-y border-[#004642]/16"'
  );
  source = source.replace(
    'className="rounded-3xl bg-[#004642] text-white p-6 lg:p-7 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.38)]"',
    'className="bg-[#004642] text-white p-8 lg:p-10"'
  );
  source = source.replace(
    'className="rounded-3xl bg-[#f6fbf9] border border-[#8C9A91]/30 p-6 lg:p-7"',
    'className="bg-[#f3eee5] p-8 lg:p-10"'
  );
  source = source.replace(
    'className="mt-10 rounded-3xl bg-[#fffaf3] border border-[#e8d7b8] p-6 lg:p-7"',
    'className="mt-14 bg-[#fbf8f2] border-y border-[#d9c8aa] px-6 py-9 lg:px-10"'
  );
  source = source.replace(
    'className="mt-10 space-y-5 text-sm text-neutral-800"',
    'className="mt-14 divide-y divide-[#004642]/14 border-y border-[#004642]/14 text-sm text-neutral-800 [&>div]:py-6"'
  );
  source = source.replaceAll("info@voskopulence.com", "hello@voskopulence.com");

  source = replaceRegexRequired(
    source,
    /\n\s*<\/main>\s*\n\s*<\/div>\s*\n\s*\);\s*\n}/,
    `\n      </main>\n      <SiteFooter />\n    </div>\n  );\n}`,
    "sustainability closing"
  );
  return source;
}

function redesignContact(source) {
  source = addFooterImport(source, "contact/page.tsx");
  source = source.replace(
    'className="heading-script text-4xl sm:text-5xl text-[#004642] text-center mb-4"',
    'className="heading-editorial text-5xl sm:text-7xl leading-none text-[#004642] text-center mb-5"'
  );
  source = source.replace(
    'className="rounded-3xl bg-[#f6fbf9] border border-[#8C9A91]/30 p-6 lg:p-8 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.3)]"',
    'className="border-y border-[#004642]/16 py-8 sm:py-10"'
  );
  source = source.replaceAll("info@voskopulence.com", "hello@voskopulence.com");
  source = replaceRegexRequired(
    source,
    /\n\s*<\/main>\s*\n\s*<\/div>\s*\n\s*\);\s*\n}/,
    `\n      </main>\n      <SiteFooter />\n    </div>\n  );\n}`,
    "contact closing"
  );
  return source;
}

for (const file of pages) {
  const url = new URL(file, appRoot);
  let source = await readFile(url, "utf8");
  if (file === "page.tsx") source = redesignHome(source);
  if (file === "shop/page.tsx") source = redesignShop(source);
  if (file === "sustainability/page.tsx") source = redesignSustainability(source);
  if (file === "contact/page.tsx") source = redesignContact(source);
  await writeFile(url, source, "utf8");
}

console.log("LUXURY_REDESIGN_PREPARED", {
  pages,
  editorialTypography: true,
  premiumFooter: true,
  explicitHeroCTA: true,
  botanicalEditorialSection: true,
  solidFormatStory: true,
  prelaunchLanguageAligned: true,
  cosmosClaimsTightened: true,
  cardChromeReduced: true,
});
