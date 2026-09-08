import { readFile, writeFile } from "node:fs/promises";

const targets = [
  new URL("../app/page.tsx", import.meta.url),
  new URL("../app/shop/page.tsx", import.meta.url),
  new URL("../app/contact/page.tsx", import.meta.url),
  new URL("../app/sustainability/page.tsx", import.meta.url),
  new URL("../app/_components/SiteFooter.tsx", import.meta.url),
];

let replacements = 0;

for (const target of targets) {
  let source = await readFile(target, "utf8");
  const before = source;
  source = source.replaceAll("hello@voskopulence.com", "info@voskopulence.com");
  source = source.replaceAll("mailto:hello@voskopulence.com", "mailto:info@voskopulence.com");
  if (source !== before) {
    replacements += 1;
    await writeFile(target, source, "utf8");
  }
}

console.log("INFO_EMAIL_PREPARED", {
  customerFacingEmail: "info@voskopulence.com",
  filesChanged: replacements,
});
