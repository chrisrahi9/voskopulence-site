import { readFile, writeFile } from "node:fs/promises";

const pageUrl = new URL("../app/page.tsx", import.meta.url);
let source = await readFile(pageUrl, "utf8");

const seam = '        <div className="pointer-events-none absolute -bottom-[2px] left-0 right-0 h-[4px] bg-white" />\n';

if (source.includes(seam)) {
  source = source.replace(seam, "");
  await writeFile(pageUrl, source, "utf8");
  console.log("SPOTLIGHT_SEAM_REMOVED", { whiteDividerRemoved: true });
} else {
  console.log("SPOTLIGHT_SEAM_REMOVED", { whiteDividerRemoved: false, alreadyAbsent: true });
}
