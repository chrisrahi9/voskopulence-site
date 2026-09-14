import { readFile, writeFile } from "node:fs/promises";

const appRoot = new URL("../app/", import.meta.url);

const englishUrl = new URL("page.tsx", appRoot);
const swedishUrl = new URL("sv/page.tsx", appRoot);

const oldEnglish = "Voskopulence is a Mediterranean house of botanical rituals. Our first chapter takes form in concentrated solid haircare, where considered formulation, lower-waste design and a distinctive botanical palette come together in a quieter kind of luxury.";
const newEnglish = "Voskopulence grew from our personal connection to the Mediterranean, its landscapes, botanical traditions and the quiet rituals woven into everyday life. We wanted to translate that world into something contemporary, considered, sensorial and made with purpose. Voskopulence is our interpretation of Mediterranean beauty, rooted in nature, shaped by modern design and created to turn everyday care into a more intentional ritual.";

const oldSwedish = "Voskopulence är ett medelhavsinspirerat varumärke där botaniska ritualer möter genomtänkt formgivning. Vårt första kapitel är koncentrerad hårvård i fast form, där noggrant utvecklade formuleringar, mindre förpackningsavfall och en distinkt botanisk palett förenas i en lågmäld form av lyx.";
const newSwedish = "Voskopulence växte fram ur vår personliga relation till Medelhavet, dess landskap, botaniska traditioner och de stillsamma ritualer som är en del av vardagen. Vi ville tolka den världen på ett modernt sätt, genomtänkt, sinnligt och med ett tydligt syfte. Voskopulence är vår tolkning av medelhavsinspirerad skönhet, med rötter i naturen, formad av modern design och skapad för att göra den dagliga hårvården till en mer medveten ritual.";

for (const [url, from, to, label] of [
  [englishUrl, oldEnglish, newEnglish, "English"],
  [swedishUrl, oldSwedish, newSwedish, "Swedish"],
]) {
  let source = await readFile(url, "utf8");
  if (!source.includes(from)) {
    throw new Error(`STORY_COPY: ${label} source copy not found`);
  }
  source = source.replace(from, to);
  if (!source.includes(to)) {
    throw new Error(`STORY_COPY: ${label} replacement failed`);
  }
  await writeFile(url, source, "utf8");
}

let swedishHome = await readFile(swedishUrl, "utf8");
swedishHome = swedishHome.replace("Berättelsen börjar med håret.", "Allt börjar med håret.");
await writeFile(swedishUrl, swedishHome, "utf8");

console.log("STORY_COPY_PREPARED", {
  voice: "we",
  founderInspiration: true,
  concise: true,
  englishUpdated: true,
  swedishUpdated: true,
  swedishFirstChapterHeading: "Allt börjar med håret.",
});
