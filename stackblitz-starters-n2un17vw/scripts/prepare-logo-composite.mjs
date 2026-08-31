import { readFile, writeFile } from "node:fs/promises";

const appRoot = new URL("../app/", import.meta.url);
const pageFiles = [
  "page.tsx",
  "shop/page.tsx",
  "contact/page.tsx",
  "sustainability/page.tsx",
];

const DIRECT_LOGO = "https://vosko-cdn.b-cdn.net/logo_improved.svg";

// Exact visual equivalents of the previously approved SVG refinements.
// All geometry is expressed against the source SVG viewBox (1961.6471 x 1024).
const WORDMARK_SHIFT_PCT = -3.56493; // -70 SVG units after parent transform
const WORDMARK_SCALE = 1.03;
const WORDMARK_ORIGIN_X = 81.76795; // original anchor x=922 transformed to viewBox
const WORDMARK_ORIGIN_Y = 55.07813; // y=564
const EMBLEM_SCALE = 1.03;
const EMBLEM_ORIGIN_X = 92.41027; // measured center of g4 in final viewBox
const EMBLEM_ORIGIN_Y = 44.71582;
const EMBLEM_SHIFT_Y_PCT = -0.30273; // -3.1 / 1024
const SPLIT_X = 84.5; // blank gap between wordmark and emblem

const composite = `
            <div
              aria-label="Voskopulence"
              role="img"
              className="relative block shrink-0 h-[108px] w-[207px] md:h-[132px] md:w-[253px] lg:h-[144px] lg:w-[276px]"
            >
              <div
                className="absolute inset-0"
                style={{
                  clipPath: "inset(0 ${100 - SPLIT_X}% 0 0)",
                  WebkitClipPath: "inset(0 ${100 - SPLIT_X}% 0 0)",
                }}
              >
                <img
                  src="${DIRECT_LOGO}"
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
              </div>

              <div
                className="absolute inset-0"
                style={{
                  clipPath: "inset(0 0 0 ${SPLIT_X}%)",
                  WebkitClipPath: "inset(0 0 0 ${SPLIT_X}%)",
                }}
              >
                <img
                  src="${DIRECT_LOGO}"
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
              </div>
            </div>`;

// Site pages differ slightly: some wrap the logo in a button and add a GPU
// stabilization style object. Match only the img element itself, regardless of
// those optional attributes, while requiring the known-good source + alt text.
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

console.log("SAFE_COMPOSITE_LOGO_PREPARED", {
  source: DIRECT_LOGO,
  delivery: "two clipped img layers using the known-good CDN SVG",
  wordmarkShiftPct: WORDMARK_SHIFT_PCT,
  wordmarkScale: WORDMARK_SCALE,
  emblemScale: EMBLEM_SCALE,
  emblemShiftYPct: EMBLEM_SHIFT_Y_PCT,
  splitX: SPLIT_X,
});
