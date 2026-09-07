import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../app/", import.meta.url);
const pageFiles = [
  "page.tsx",
  "shop/page.tsx",
  "contact/page.tsx",
  "sustainability/page.tsx",
];
const DIRECT_LOGO = "https://vosko-cdn.b-cdn.net/logo_improved.svg";

function replaceAllExisting(source, from, to) {
  if (!source.includes(from)) return source;
  return source.split(from).join(to);
}

function addSmoothMenuLifecycle(source, file) {
  const stateLine = "const [menuOpen, setMenuOpen] = useState(false);";
  if (!source.includes(stateLine)) {
    throw new Error(`${file}: menu state not found`);
  }

  source = replaceAllExisting(source, "setMenuOpen(true)", "openMenu()");
  source = replaceAllExisting(source, "setMenuOpen(false)", "closeMenu()");

  const lifecycle = `${stateLine}\n  const [menuRendered, setMenuRendered] = useState(false);\n\n  const openMenu = () => {\n    setMenuRendered(true);\n    requestAnimationFrame(() => {\n      requestAnimationFrame(() => setMenuOpen(true));\n    });\n  };\n\n  const closeMenu = () => {\n    setMenuOpen(false);\n    window.setTimeout(() => setMenuRendered(false), 470);\n  };`;
  source = source.replace(stateLine, lifecycle);

  const portalPattern = /(mounted\s*&&\s*\n\s*typeof document !== "undefined"\s*&&\s*\n\s*)menuOpen(\s*&&\s*\n\s*createPortal)/;
  if (!portalPattern.test(source)) {
    throw new Error(`${file}: mobile portal condition not found`);
  }
  source = source.replace(portalPattern, "$1menuRendered$2");

  const opacityPattern = /opacity:\s*1,\s*\n\s*transition:\s*\n?\s*"opacity 420ms cubic-bezier\(\.22,1,\.36,1\)",/;
  if (opacityPattern.test(source)) {
    source = source.replace(
      opacityPattern,
      'opacity: menuOpen ? 1 : 0,\n                transition:\n                  "opacity 360ms cubic-bezier(.22,1,.36,1)",'
    );
  }

  const panelTransform = 'transform: "translateX(0%)",\n                transition:\n                  "transform 460ms cubic-bezier(.22,1,.36,1)",';
  if (!source.includes(panelTransform)) {
    throw new Error(`${file}: curtain transform not found`);
  }
  source = source.replace(
    panelTransform,
    'transform: menuOpen ? "translateX(0%)" : "translateX(-100%)",\n                transition:\n                  "transform 460ms cubic-bezier(.22,1,.36,1)",'
  );

  return source;
}

function protectHeaderSpacing(source) {
  source = replaceAllExisting(
    source,
    "rounded-full lg:hidden relative z-[1]",
    "rounded-full xl:hidden relative z-[1]"
  );
  source = replaceAllExisting(
    source,
    "grow basis-0 hidden lg:flex justify-end items-center",
    "grow basis-0 hidden xl:flex justify-end items-center"
  );
  source = replaceAllExisting(
    source,
    'className="lg:hidden fixed inset-0 z-[12000]"',
    'className="xl:hidden fixed inset-0 z-[12000]"'
  );
  return source;
}

function alignMobileBurger(source, file) {
  const base = "rounded-full xl:hidden relative z-[1] hover:bg-white/10";
  const aligned = "rounded-full xl:hidden relative z-[1] translate-y-[5px] hover:bg-white/10";

  if (source.includes(aligned)) return source;
  if (!source.includes(base)) {
    throw new Error(`${file}: mobile burger alignment target not found`);
  }
  return source.replace(base, aligned);
}

for (const file of pageFiles) {
  const url = new URL(file, root);
  let source = await readFile(url, "utf8");
  source = addSmoothMenuLifecycle(source, file);
  source = protectHeaderSpacing(source);
  source = alignMobileBurger(source, file);

  source = replaceAllExisting(
    source,
    'src={asset("/logo_improved.svg")}',
    `src="${DIRECT_LOGO}"`
  );

  if (file === "page.tsx") {
    const motionStart = "  // === Ultra-smooth header progress ===\n";
    const motionEnd = "  // Smooth scroll to first next section\n";
    const start = source.indexOf(motionStart);
    const end = source.indexOf(motionEnd, start);
    if (start === -1 || end === -1) {
      throw new Error("homepage: legacy header writer markers not found");
    }
    source =
      source.slice(0, start) +
      "  // Header progress is owned by PremiumMotionController.\n\n" +
      source.slice(end);

    const homeHeaderStyle = `          style={{\n            background: hasCap`;
    const uniformHeaderStyle = `          style={{\n            backdropFilter:\n              "blur(calc(var(--hdrProg, 0) * 12px)) saturate(calc(1 + var(--hdrProg, 0) * 0.5))",\n            WebkitBackdropFilter:\n              "blur(calc(var(--hdrProg, 0) * 12px)) saturate(calc(1 + var(--hdrProg, 0) * 0.5))",\n            background: hasCap`;
    if (source.includes(homeHeaderStyle)) {
      source = source.replace(homeHeaderStyle, uniformHeaderStyle);
    } else if (!source.includes("WebkitBackdropFilter:")) {
      throw new Error("homepage: header background style not found");
    }

    const spotlightNeedle = 'src={asset("/Spotlight_pic.png")}\n              alt="Mediterranean Rosemary Bar"';
    if (!source.includes(spotlightNeedle)) {
      throw new Error("homepage: spotlight image not found");
    }
    source = source.replace(
      spotlightNeedle,
      'src={asset("/Spotlight_pic.png")}\n              alt="Mediterranean Rosemary Bar"\n              loading="lazy"\n              decoding="async"'
    );
  }

  await writeFile(url, source);
}

console.log("SITE_POLISH_PREPARED", {
  pages: pageFiles,
  smoothMenuLifecycle: true,
  singleHomepageHeaderWriter: true,
  uniformHeaderBlur: true,
  desktopNavBreakpoint: "xl",
  compactDesktopOverlapGuard: true,
  mobileBurgerOpticalOffsetPx: 5,
  spotlightDeferred: true,
  logoSource: DIRECT_LOGO,
});