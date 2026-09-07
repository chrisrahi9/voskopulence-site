import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../app/", import.meta.url);
const targets = [
  "page.tsx",
  "shop/page.tsx",
  "contact/page.tsx",
  "sustainability/page.tsx",
];

const DESKTOP_NAV =
  '<nav className="grow basis-0 hidden xl:flex justify-end items-center gap-6 text-sm lg:text-base relative z-[1]">';
const MOBILE_NAV = '<nav className="grow grid place-items-center">';

function getNavRange(source, openTag, file, label) {
  const start = source.indexOf(openTag);
  if (start === -1) throw new Error(`NAV_UNIFORMITY: ${label} nav not found in ${file}`);
  const end = source.indexOf("</nav>", start);
  if (end === -1) throw new Error(`NAV_UNIFORMITY: ${label} nav end not found in ${file}`);
  return { start, end };
}

function insertBeforeNavItem(source, range, itemText, markup, file, label) {
  const block = source.slice(range.start, range.end);
  const textIndex = block.indexOf(itemText);
  if (textIndex === -1) {
    throw new Error(`NAV_UNIFORMITY: ${itemText} item not found in ${label} nav of ${file}`);
  }

  const anchorStart = block.lastIndexOf("<a", textIndex);
  const buttonStart = block.lastIndexOf("<button", textIndex);
  const liStart = block.lastIndexOf("<li>", textIndex);
  const relativeInsert = label === "mobile"
    ? liStart
    : Math.max(anchorStart, buttonStart);

  if (relativeInsert === -1) {
    throw new Error(`NAV_UNIFORMITY: insertion point not found in ${label} nav of ${file}`);
  }

  const insertAt = range.start + relativeInsert;
  return source.slice(0, insertAt) + markup + source.slice(insertAt);
}

for (const file of targets) {
  const url = new URL(file, root);
  let source = await readFile(url, "utf8");

  // ----- Desktop: canonical order = Home, Shop, About, Sustainability, Contact -----
  let desktop = getNavRange(source, DESKTOP_NAV, file, "desktop");
  let desktopBlock = source.slice(desktop.start, desktop.end);

  const hasHome = /(?:>\s*Home\s*<|router\.push\("\/"\))/.test(desktopBlock);
  if (!hasHome) {
    const openTagEnd = source.indexOf(">", desktop.start) + 1;
    const homeLink = `\n            <a href="/" className="hover:text-gray-200">\n              Home\n            </a>`;
    source = source.slice(0, openTagEnd) + homeLink + source.slice(openTagEnd);
  }

  desktop = getNavRange(source, DESKTOP_NAV, file, "desktop");
  desktopBlock = source.slice(desktop.start, desktop.end);
  if (!/>\s*About\s*</.test(desktopBlock)) {
    const aboutLink = `            <a\n              href="/#about"\n              className="hover:text-gray-200"\n              onClick={(e) => {\n                e.preventDefault();\n                router.push("/#about");\n              }}\n            >\n              About\n            </a>\n`;
    source = insertBeforeNavItem(
      source,
      desktop,
      "Sustainability",
      aboutLink,
      file,
      "desktop"
    );
  }

  // ----- Mobile curtain: ensure About exists in the same canonical location. -----
  let mobile = getNavRange(source, MOBILE_NAV, file, "mobile");
  let mobileBlock = source.slice(mobile.start, mobile.end);
  if (!/>\s*About\s*</.test(mobileBlock)) {
    const closeAction = source.includes("const closeMenu =")
      ? "closeMenu()"
      : "setMenuOpen(false)";
    const aboutItem = `                  <li>\n                    <a\n                      href="/#about"\n                      className="hover:text-gray-200"\n                      onClick={(e) => {\n                        e.preventDefault();\n                        router.push("/#about");\n                        ${closeAction};\n                      }}\n                    >\n                      About\n                    </a>\n                  </li>\n`;
    source = insertBeforeNavItem(
      source,
      mobile,
      "Sustainability",
      aboutItem,
      file,
      "mobile"
    );
  }

  // Fail the build if a future page edit silently drifts from the five-item nav.
  desktop = getNavRange(source, DESKTOP_NAV, file, "desktop");
  mobile = getNavRange(source, MOBILE_NAV, file, "mobile");
  const desktopFinal = source.slice(desktop.start, desktop.end);
  const mobileFinal = source.slice(mobile.start, mobile.end);
  for (const label of ["Home", "Shop", "About", "Sustainability", "Contact"]) {
    if (!desktopFinal.includes(label)) {
      throw new Error(`NAV_UNIFORMITY: desktop ${label} missing in ${file}`);
    }
    if (!mobileFinal.includes(label)) {
      throw new Error(`NAV_UNIFORMITY: mobile ${label} missing in ${file}`);
    }
  }

  await writeFile(url, source, "utf8");
}

console.log("NAV_UNIFORMITY_PREPARED", {
  pages: targets,
  desktopBreakpoint: "xl",
  desktop: ["Home", "Shop", "About", "Sustainability", "Contact"],
  mobile: ["Home", "Shop", "About", "Sustainability", "Contact"],
  guardedAgainstFutureDrift: true,
});