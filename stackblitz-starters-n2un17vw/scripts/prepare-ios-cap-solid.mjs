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

for (const relative of targets) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) continue;

  const source = fs.readFileSync(file, "utf8");
  const next = source.replace(
    /background:\s*["']rgba\(0\s*,\s*70\s*,\s*66\s*,\s*0\.94\)["']/g,
    'background: "#004642"'
  );

  if (next !== source) {
    fs.writeFileSync(file, next);
    console.log(`Made iOS cap solid in ${relative}`);
  }
}
