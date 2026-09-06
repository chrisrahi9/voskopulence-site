import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../app/", import.meta.url);
const targets = ["page.tsx", "shop/page.tsx"];

for (const file of targets) {
  const url = new URL(file, root);
  let source = await readFile(url, "utf8");

  const navStart = source.indexOf(
    '<nav className="grow basis-0 hidden lg:flex justify-end items-center gap-6 text-sm lg:text-base relative z-[1]">'
  );
  if (navStart === -1) {
    throw new Error(`HOME_NAV: desktop nav not found in ${file}`);
  }

  const navEnd = source.indexOf("</nav>", navStart);
  if (navEnd === -1) {
    throw new Error(`HOME_NAV: desktop nav end not found in ${file}`);
  }

  const navBlock = source.slice(navStart, navEnd);
  const alreadyHasHome = /(?:>\s*Home\s*<|router\.push\("\/"\))/.test(navBlock);

  if (!alreadyHasHome) {
    const openTagEnd = source.indexOf(">", navStart) + 1;
    const homeLink = `\n            <a href="/" className="hover:text-gray-200">\n              Home\n            </a>`;
    source = source.slice(0, openTagEnd) + homeLink + source.slice(openTagEnd);
  }

  await writeFile(url, source, "utf8");
}

console.log("HOME_NAV_PREPARED", {
  desktopHomeLink: true,
  pages: targets,
});
