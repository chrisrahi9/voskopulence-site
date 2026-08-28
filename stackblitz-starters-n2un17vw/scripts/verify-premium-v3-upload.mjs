const base = "https://vosko-cdn.b-cdn.net";
const files = [
  ["/hero_web_4k_v2.mp4", 5362245],
  ["/hero_web_1440_v2.mp4", 3569968],
];

for (const [path, expectedSize] of files) {
  try {
    const response = await fetch(`${base}${path}`, {
      method: "GET",
      headers: { Range: "bytes=0-1023" },
      redirect: "manual",
    });
    const bytes = new Uint8Array(await response.arrayBuffer());
    const range = response.headers.get("content-range") || "";
    const match = range.match(/\/(\d+)$/);
    const totalSize = match ? Number(match[1]) : null;
    console.log("PREMIUM_V3_CHECK", JSON.stringify({
      path,
      status: response.status,
      contentType: response.headers.get("content-type"),
      contentRange: range,
      totalSize,
      expectedSize,
      exactSizeMatch: totalSize === expectedSize,
      receivedBytes: bytes.byteLength,
      mp4Signature: String.fromCharCode(...bytes.slice(4, 8)),
    }));
    if (response.status !== 206 || totalSize !== expectedSize || bytes.byteLength !== 1024) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("PREMIUM_V3_CHECK_ERROR", JSON.stringify({ path, error: String(error) }));
    process.exitCode = 1;
  }
}
