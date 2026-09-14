import { readFile, writeFile } from "node:fs/promises";

const appRoot = new URL("../app/", import.meta.url);
const swedishTargets = [
  "sv/page.tsx",
  "sv/shop/page.tsx",
  "sv/contact/page.tsx",
  "sv/sustainability/page.tsx",
  "_components/SwedishSiteFooter.tsx",
];

const exactStoryLabel = />\s*(?:Our Story|About|Om oss|The house)\s*</g;

for (const file of swedishTargets) {
  const url = new URL(file, appRoot);
  let source = await readFile(url, "utf8");
  source = source.replace(exactStoryLabel, ">Vår historia<");

  if (/(>\s*(?:Our Story|About|Om oss|The house)\s*<)/.test(source)) {
    throw new Error(`STORY_LABELS: stale story label remains in ${file}`);
  }
  if (!source.includes("Vår historia")) {
    throw new Error(`STORY_LABELS: Vår historia missing in ${file}`);
  }

  await writeFile(url, source, "utf8");
}

const englishHome = await readFile(new URL("page.tsx", appRoot), "utf8");
if (!/>\s*Our Story\s*<\/h2>/.test(englishHome)) {
  throw new Error("STORY_LABELS: English homepage heading is not Our Story");
}
if (/>\s*The house\s*</.test(englishHome)) {
  throw new Error("STORY_LABELS: legacy The house label remains on English homepage");
}

console.log("STORY_LABELS_PREPARED", {
  english: "Our Story",
  swedish: "Vår historia",
  anchorPreserved: "#about",
  pagesUpdated: swedishTargets,
});