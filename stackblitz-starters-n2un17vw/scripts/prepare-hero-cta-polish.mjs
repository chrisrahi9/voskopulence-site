import { readFile, writeFile } from "node:fs/promises";

const pageUrl = new URL("../app/page.tsx", import.meta.url);
let source = await readFile(pageUrl, "utf8");

const insertedCta = `              <a
                href="/shop"
                className="mt-9 inline-flex items-center gap-3 border-b border-white/75 pb-1 text-[0.72rem] sm:text-xs font-semibold uppercase tracking-[0.2em] text-white transition-opacity duration-200 hover:opacity-70"
              >
                Explore the collection
                <span aria-hidden="true">↗</span>
              </a>`;

if (!source.includes(insertedCta)) {
  throw new Error("HERO_ORB_POLISH: redesigned hero CTA not found");
}

// The orb is the signature discovery interaction. Keep the hero intriguing rather
// than pairing it with a conventional ecommerce CTA in the same visual zone.
source = source.replace(insertedCta, "");
source = source.replace(
  'aria-label="Scroll to next section"',
  'aria-label="Discover the collection"'
);
source = source.replace(
  "group relative mt-7 inline-flex items-center justify-center",
  "hero-orb group relative mt-10 inline-flex items-center justify-center cursor-pointer hover:animate-none"
);
source = source.replace(
  `                  h-14 w-14 rounded-full
                  ring-1 ring-white/30 hover:ring-white/60
                  bg-white/10 hover:bg-white/10
                  backdrop-blur-[3px]`,
  `                  h-16 w-16 sm:h-[68px] sm:w-[68px] rounded-full
                  ring-1 ring-white/35 hover:ring-white/70
                  bg-white/[0.09] hover:bg-white/[0.14]
                  shadow-[0_8px_28px_rgba(0,0,0,0.12)] hover:shadow-[0_10px_34px_rgba(0,0,0,0.16)]
                  backdrop-blur-[4px]`
);
source = source.replace(
  `                    ${'${isLongPress && showArrow ? "opacity-0" : "opacity-100"}'}
                    will-change-[opacity,transform]`,
  `                    ${'${isLongPress && showArrow ? "opacity-0" : "opacity-100"}'}
                    group-hover:opacity-0 group-hover:scale-75
                    will-change-[opacity,transform]`
);
source = source.replace(
  `className={\`absolute left-1/2 top-1/2 z-10 transition-opacity duration-220 ease-[cubic-bezier(.22,1,.36,1)]
                    ${'${isLongPress && showArrow ? "opacity-100" : "opacity-0"}'}`,
  `className={\`absolute left-1/2 top-1/2 z-10 transition-[opacity,transform] duration-220 ease-[cubic-bezier(.22,1,.36,1)] group-hover:opacity-100
                    ${'${isLongPress && showArrow ? "opacity-100" : "opacity-0"}'}`
);

await writeFile(pageUrl, source, "utf8");

console.log("HERO_ORB_POLISHED", {
  conventionalHeroCtaRemoved: true,
  orbIsPrimaryDiscoveryInteraction: true,
  desktopHoverMorph: "dot-to-chevron",
  touchHoldInteractionPreserved: true,
  haloTreatment: true,
});
