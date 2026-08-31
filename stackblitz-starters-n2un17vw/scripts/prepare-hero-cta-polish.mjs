import { readFile, writeFile } from "node:fs/promises";

const pageUrl = new URL("../app/page.tsx", import.meta.url);
let source = await readFile(pageUrl, "utf8");

const oldBlock = `              <a
                href="/shop"
                className="mt-9 inline-flex items-center gap-3 border-b border-white/75 pb-1 text-[0.72rem] sm:text-xs font-semibold uppercase tracking-[0.2em] text-white transition-opacity duration-200 hover:opacity-70"
              >
                Explore the collection
                <span aria-hidden="true">↗</span>
              </a>`;

const newBlock = `              <div className="mt-9 flex w-full justify-center">
                <a
                  href="/shop"
                  className="inline-flex items-center gap-3 border-b border-white/70 pb-1.5 text-[0.72rem] sm:text-xs font-semibold uppercase tracking-[0.2em] text-white transition-opacity duration-200 hover:opacity-70"
                >
                  Explore the collection
                  <span aria-hidden="true">→</span>
                </a>
              </div>`;

if (!source.includes(oldBlock)) {
  throw new Error("HERO_CTA_POLISH: redesigned hero CTA not found");
}

source = source.replace(oldBlock, newBlock);
source = source.replace("group relative mt-7 inline-flex", "group relative mt-8 inline-flex");

await writeFile(pageUrl, source, "utf8");

console.log("HERO_CTA_POLISHED", {
  primaryCtaSeparated: true,
  scrollIndicatorSeparated: true,
  arrow: "horizontal",
});
