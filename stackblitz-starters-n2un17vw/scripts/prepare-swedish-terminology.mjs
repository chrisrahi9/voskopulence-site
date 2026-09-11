import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const targets = [
  "app/sv/page.tsx",
  "app/sv/shop/page.tsx",
  "app/sv/contact/page.tsx",
  "app/sv/sustainability/page.tsx",
  "app/sv/thank-you/page.tsx",
  "app/sv/contact/thank-you/page.tsx",
  "app/sv/layout.tsx",
  "app/sv/shop/layout.tsx",
  "app/sv/contact/layout.tsx",
  "app/sv/sustainability/layout.tsx",
  "app/_components/SwedishSiteFooter.tsx",
];

const replacements = [
  ["schampo- och balsamkakor", "schampo bars och balsam bars"],
  ["Schampo- och balsamkakor", "Schampo bars och balsam bars"],
  ["schampokakor", "schampo bars"],
  ["Schampokakor", "Schampo bars"],
  ["balsamkakor", "balsam bars"],
  ["Balsamkakor", "Balsam bars"],
  ["schampokakan", "schampo baren"],
  ["Schampokakan", "Schampo baren"],
  ["balsamkakan", "balsam baren"],
  ["Balsamkakan", "Balsam baren"],
  ["schampokaka", "schampo bar"],
  ["Schampokaka", "Schampo bar"],
  ["balsamkaka", "balsam bar"],
  ["Balsamkaka", "Balsam bar"],

  // Natural Swedish brand copy: avoid literal English "ritual/chapter" phrasing.
  [
    "Botaniska ritualer med rötter i Medelhavet – med koncentrerad hårvård i fast form som första kapitel.",
    "Medelhavsinspirerad hårvård i fast form, med noggrant utvalda botaniska ingredienser.",
  ],
  [
    "Voskopulence är ett medelhavsinspirerat varumärke där botaniska ritualer möter genomtänkt formgivning. Vårt första kapitel är koncentrerad hårvård i fast form, där noggrant utvecklade formuleringar, mindre förpackningsavfall och en distinkt botanisk palett förenas i en lågmäld form av lyx.",
    "Voskopulence är ett medelhavsinspirerat varumärke där botaniska ingredienser möter genomtänkt formgivning. Vi börjar med koncentrerad hårvård i fast form, där noggrant utvecklade formuleringar, mindre förpackningsavfall och en distinkt botanisk palett förenas i en lågmäld form av lyx.",
  ],
  ["Det första kapitlet", "Vår första kollektion"],
  ["Berättelsen börjar med håret.", "Hårvård i fast form, inspirerad av Medelhavet."],
  [
    "Tre fasta formuleringar introducerar Voskopulences värld. Utforska kollektionen och anmäl ditt intresse för att få besked när produkterna blir tillgängliga.",
    "Tre koncentrerade produkter introducerar Voskopulences värld. Utforska kollektionen och anmäl ditt intresse för att få besked när produkterna blir tillgängliga.",
  ],
  [
    "Voskopulences första kapitel: tre koncentrerade formuleringar för olika hårbehov, förenade av en tydligt medelhavsinspirerad känsla.",
    "Voskopulences första kollektion: tre koncentrerade formuleringar för olika hårbehov, förenade av en tydligt medelhavsinspirerad känsla.",
  ],
  [
    "En värld av medelhavsinspirerade ritualer – med hårvård i fast form som första kapitel.",
    "Medelhavsinspirerad hårvård i fast form, med noggrant utvalda botaniska ingredienser.",
  ],
];

for (const relative of targets) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) continue;

  let source = fs.readFileSync(file, "utf8");
  for (const [from, to] of replacements) {
    source = source.split(from).join(to);
  }
  fs.writeFileSync(file, source);
  console.log(`Applied Swedish terminology and copy polish in ${relative}`);
}
