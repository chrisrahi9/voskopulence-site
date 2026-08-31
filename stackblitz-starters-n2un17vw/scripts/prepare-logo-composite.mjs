import { mkdir, readFile, writeFile } from "node:fs/promises";

const appRoot = new URL("../app/", import.meta.url);
const publicRoot = new URL("../public/", import.meta.url);
const pageFiles = [
  "page.tsx",
  "shop/page.tsx",
  "contact/page.tsx",
  "sustainability/page.tsx",
];

const DIRECT_LOGO = "https://vosko-cdn.b-cdn.net/logo_improved.svg";
const WORDMARK_ONLY = "/logo_wordmark_only.svg";
const EMBLEM_ONLY = "/logo_emblem_only.svg";

// Previously agreed visual refinements, expressed against the original SVG canvas.
const WORDMARK_SHIFT_PCT = -3.56493; // -70 SVG units
const WORDMARK_SCALE = 1.03;
const WORDMARK_ORIGIN_X = 81.76795;
const WORDMARK_ORIGIN_Y = 55.07813;
const EMBLEM_SCALE = 1.03;
const EMBLEM_ORIGIN_X = 92.41027;
const EMBLEM_ORIGIN_Y = 44.71582;
const EMBLEM_SHIFT_Y_PCT = -0.30273; // -3.1 / 1024

const response = await fetch(DIRECT_LOGO, { cache: "no-store" });
if (!response.ok) {
  throw new Error(`Unable to fetch source logo: ${response.status}`);
}
const sourceSvg = await response.text();

// Do not split the logo with a vertical clip: the emblem and final letters overlap
// horizontally in the source artwork. Instead create two identical-canvas SVGs and
// hide only the unwanted source element in each one.
let wordmarkSvg = sourceSvg;
const emblemStylePattern = /(id="g4"[\s\S]{0,220}?style=")display:inline(")/;
if (!emblemStylePattern.test(wordmarkSvg)) {
  throw new Error("Emblem group g4 was not found in source SVG");
}
wordmarkSvg = wordmarkSvg.replace(emblemStylePattern, "$1display:none$2");

let emblemSvg = sourceSvg;
const wordmarkStylePattern = /(id="path5"[\s\S]{0,180}?style=")([^"]*)(")/;
if (!wordmarkStylePattern.test(emblemSvg)) {
  throw new Error("Wordmark path5 was not found in source SVG");
}
emblemSvg = emblemSvg.replace(wordmarkStylePattern, "$1display:none;$2$3");

await mkdir(publicRoot, { recursive: true });
await writeFile(new URL(`../public${WORDMARK_ONLY}`, import.meta.url), wordmarkSvg, "utf8");
await writeFile(new URL(`../public${EMBLEM_ONLY}`, import.meta.url), emblemSvg, "utf8");

const composite = `
            <div
              aria-label="Voskopulence"
              role="img"
              className="relative block shrink-0 h-[108px] w-[207px] md:h-[132px] md:w-[253px] lg:h-[144px] lg:w-[276px]"
            >
              <img
                src="${WORDMARK_ONLY}"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 block h-full w-full"
                loading="eager"
                decoding="async"
                style={{
                  transform: "translateX(${WORDMARK_SHIFT_PCT}%) scale(${WORDMARK_SCALE})",
                  transformOrigin: "${WORDMARK_ORIGIN_X}% ${WORDMARK_ORIGIN_Y}%",
                  filter: "drop-shadow(0 0 0.35px rgba(255,255,255,0.95))",
                }}
              />
              <img
                src="${EMBLEM_ONLY}"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 block h-full w-full"
                loading="eager"
                decoding="async"
                style={{
                  transform: "translateY(${EMBLEM_SHIFT_Y_PCT}%) scale(${EMBLEM_SCALE})",
                  transformOrigin: "${EMBLEM_ORIGIN_X}% ${EMBLEM_ORIGIN_Y}%",
                  filter: "drop-shadow(0 0 0.25px rgba(255,255,255,0.95))",
                }}
              />
            </div>`;

const logoPattern = /<img\s+src="https:\/\/vosko-cdn\.b-cdn\.net\/logo_improved\.svg"\s+alt="Voskopulence"[\s\S]*?\/>/m;

for (const file of pageFiles) {
  const url = new URL(file, appRoot);
  let source = await readFile(url, "utf8");
  if (!logoPattern.test(source)) {
    throw new Error(`${file}: visible direct-CDN logo block not found`);
  }
  source = source.replace(logoPattern, composite.trim());
  await writeFile(url, source, "utf8");
}

console.log("SEPARATED_LOGO_REFINEMENT_PREPARED", {
  source: DIRECT_LOGO,
  delivery: "separate same-canvas wordmark/emblem SVG layers; no clipping",
  wordmarkShiftPct: WORDMARK_SHIFT_PCT,
  wordmarkScale: WORDMARK_SCALE,
  emblemScale: EMBLEM_SCALE,
  emblemShiftYPct: EMBLEM_SHIFT_Y_PCT,
});
