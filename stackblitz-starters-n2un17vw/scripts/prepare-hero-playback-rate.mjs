import { readFile, writeFile } from "node:fs/promises";

const pageUrl = new URL("../app/page.tsx", import.meta.url);
let source = await readFile(pageUrl, "utf8");

const anchor = `      v.preload = "auto";\n      v.poster = heroPosterSrc;`;
const replacement = `      v.preload = "auto";\n      // Keep the hero calmer and more atmospheric across MP4 and native HLS.\n      v.defaultPlaybackRate = 0.75;\n      v.playbackRate = 0.75;\n      v.poster = heroPosterSrc;`;

if (!source.includes(anchor)) {
  throw new Error("HERO_PLAYBACK: applyVideoFlags anchor not found");
}

source = source.replace(anchor, replacement);
await writeFile(pageUrl, source, "utf8");

console.log("HERO_PLAYBACK_PREPARED", { playbackRate: 0.75 });
