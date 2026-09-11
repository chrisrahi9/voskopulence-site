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

  if (!/\buseLayoutEffect\b/.test(source.match(/^import[^\n]+from ["']react["'];/m)?.[0] || "")) {
    source = source.replace(
      /import\s+(React\s*,\s*)?\{([^}]*)\}\s+from\s+["']react["'];/,
      (_m, reactPrefix = "", names) => {
        const list = names.split(",").map((v) => v.trim()).filter(Boolean);
        if (!list.includes("useLayoutEffect")) {
          const i = list.indexOf("useEffect");
          list.splice(i >= 0 ? i + 1 : list.length, 0, "useLayoutEffect");
        }
        return `import ${reactPrefix}{ ${list.join(", ")} } from "react";`;
      }
    );
  }

  source = source.replace(
    /useEffect\(\(\) => setHdrReady\(true\), \[\]\);/g,
    "useLayoutEffect(() => setHdrReady(true), []);"
  );

  for (const block of capBlocks) {
    if (source.includes(block)) {
      source = source.replace(block, block.replace("useEffect(() => {", "useLayoutEffect(() => {"));
    }
  }

  fs.writeFileSync(file, source);
  console.log(`Prepared header pre-paint timing in ${relative}`);
}
