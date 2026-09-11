import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const targets = [
  "app/page.tsx",
  "app/shop/page.tsx",
  "app/contact/page.tsx",
  "app/sustainability/page.tsx",
  "app/sv/page.tsx",
  "app/sv/shop/page.tsx",
  "app/sv/contact/page.tsx",
  "app/sv/sustainability/page.tsx",
];

const capBlocks = [
`  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isIOS =
      /iP(hone|od|ad)/.test(ua) ||
      (/\\bMac\\b/.test(ua) && "ontouchend" in window);
    setCapPx(isIOS ? 5 : 0);
    const onResize = () => setCapPx(isIOS ? 5 : 0);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);`,
`  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isIOS =
      /iP(hone|od|ad)/.test(ua) ||
      (/\\bMac\\b/.test(ua) && "ontouchend" in window);
    const update = () => setCapPx(isIOS ? 5 : 0);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);`,
];

for (const relative of targets) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) continue;

  let source = fs.readFileSync(file, "utf8");

  // Add useLayoutEffect to the existing named React import without disturbing
  // type-only React imports used for React.TouchEvent etc.
  if (!source.includes("useLayoutEffect")) {
    source = source.replace(
      /import \{([^}]*\buseEffect\b[^}]*)\} from "react";/,
      (_m, names) => {
        const list = names.split(",").map((v) => v.trim()).filter(Boolean);
        if (!list.includes("useLayoutEffect")) {
          const i = list.indexOf("useEffect");
          list.splice(i + 1, 0, "useLayoutEffect");
        }
        return `import { ${list.join(", ")} } from "react";`;
      }
    );
  }

  // The portal must exist before the first painted frame of a client-side route.
  source = source.replace(
    /useEffect\(\(\) => setHdrReady\(true\), \[\]\);/g,
    "useLayoutEffect(() => setHdrReady(true), []);"
  );

  // Likewise, resolve the iOS cap before paint so the header never renders at
  // capPx=0 and then jumps down by 5px one frame later.
  for (const block of capBlocks) {
    if (source.includes(block)) {
      source = source.replace(block, block.replace("useEffect(() => {", "useLayoutEffect(() => {"));
    }
  }

  fs.writeFileSync(file, source);
  console.log(`Prepared header pre-paint timing in ${relative}`);
}
