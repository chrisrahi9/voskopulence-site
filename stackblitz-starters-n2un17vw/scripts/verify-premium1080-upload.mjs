const url = "https://vosko-cdn.b-cdn.net/hero_web_1080_premium_v1.mp4";
const expectedSize = 2712804;

const res = await fetch(url, {
  headers: { Range: "bytes=0-1023" },
  cache: "no-store",
});

const buf = Buffer.from(await res.arrayBuffer());
const contentRange = res.headers.get("content-range") || "";
const contentType = res.headers.get("content-type") || "";
const totalMatch = contentRange.match(/\/(\d+)$/);
const totalSize = totalMatch ? Number(totalMatch[1]) : null;
const sig = buf.subarray(4, 8).toString("ascii");

const result = {
  path: "/hero_web_1080_premium_v1.mp4",
  status: res.status,
  contentType,
  contentRange,
  totalSize,
  expectedSize,
  exactSizeMatch: totalSize === expectedSize,
  receivedBytes: buf.length,
  mp4Signature: sig,
};

console.log("PREMIUM1080_VERIFY", JSON.stringify(result));

if (
  res.status !== 206 ||
  !contentType.includes("video/mp4") ||
  totalSize !== expectedSize ||
  buf.length !== 1024 ||
  sig !== "ftyp"
) {
  process.exit(1);
}
