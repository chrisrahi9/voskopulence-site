const base = "https://vosko-cdn.b-cdn.net";
const candidates = [
  "/hero_hls_v2/master.m3u8",
  "/hero_hls_v2/1080p/playlist.m3u8",
  "/hero_hls_v2/1080p/seg_000.ts",
  "/hero_web_v4.mp4",
  "/hero_poster_v2.jpg",
  "/voskopulence_hero_v2/hero_hls_v2/master.m3u8",
  "/voskopulence_hero_v2/hero_web_v4.mp4",
  "/voskopulence_hero_v2/hero_poster_v2.jpg",
];

for (const path of candidates) {
  try {
    const response = await fetch(`${base}${path}`, { method: "HEAD", redirect: "manual" });
    console.log("HERO_V2_CHECK", JSON.stringify({
      path,
      status: response.status,
      contentType: response.headers.get("content-type"),
      contentLength: response.headers.get("content-length"),
    }));
  } catch (error) {
    console.log("HERO_V2_CHECK", JSON.stringify({ path, error: String(error) }));
  }
}
