const url = "https://vosko-cdn.b-cdn.net/hero_web_4k_test.mp4";
try {
  const response = await fetch(url, {
    method: "GET",
    headers: { Range: "bytes=0-1023" },
    redirect: "manual",
  });
  const bytes = new Uint8Array(await response.arrayBuffer());
  console.log(
    "HERO_4K_CHECK",
    JSON.stringify({
      status: response.status,
      contentType: response.headers.get("content-type"),
      contentLength: response.headers.get("content-length"),
      contentRange: response.headers.get("content-range"),
      acceptRanges: response.headers.get("accept-ranges"),
      receivedBytes: bytes.byteLength,
      signature: Array.from(bytes.slice(4, 12)),
    })
  );
} catch (error) {
  console.error("HERO_4K_CHECK_ERROR", String(error));
  process.exitCode = 1;
}
