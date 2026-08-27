const CDN_ORIGIN = "https://vosko-cdn.b-cdn.net";

export const runtime = "edge";

const CACHE_CONTROL = "public, max-age=31536000, immutable";
const HLS_CONTENT_TYPES = [
  "application/vnd.apple.mpegurl",
  "application/x-mpegurl",
  "audio/mpegurl",
];
const DIRECT_MEDIA_EXTENSIONS = [".mp4", ".mov", ".webm"];
const HERO_VIDEO_VERSION = "20260517-direct-mp4";

const isHlsManifest = (path: string, contentType: string) =>
  path.endsWith(".m3u8") ||
  HLS_CONTENT_TYPES.some((type) => contentType.toLowerCase().includes(type));

const shouldRedirectToCdn = (path: string) =>
  DIRECT_MEDIA_EXTENSIONS.some((extension) => path.endsWith(extension));

const buildDirectCdnUrl = (request: Request, rawPath: string) => {
  const url = new URL(request.url);
  const directUrl = new URL(`${CDN_ORIGIN}/${rawPath}`);

  url.searchParams.forEach((value, key) => {
    directUrl.searchParams.set(key, value);
  });

  if (rawPath === "hero_web_v3.mp4" && !directUrl.searchParams.has("v")) {
    directUrl.searchParams.set("v", HERO_VIDEO_VERSION);
  }

  return directUrl.toString();
};

const rewriteManifestUrls = (manifest: string) =>
  manifest
    .replaceAll(`${CDN_ORIGIN}/`, "/media/")
    .replaceAll("https://cdn.voskopulence.com/", "/media/")
    .replaceAll("https://www.cdn.voskopulence.com/", "/media/");

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  const rawPath = params.path.join("/");

  if (!rawPath || rawPath.includes("..")) {
    return new Response("Not found", { status: 404 });
  }

  if (shouldRedirectToCdn(rawPath)) {
    return Response.redirect(buildDirectCdnUrl(request, rawPath), 307);
  }

  const upstreamUrl = `${CDN_ORIGIN}/${rawPath}`;
  const range = request.headers.get("range");

  const upstream = await fetch(upstreamUrl, {
    headers: range ? { range } : undefined,
    cache: range ? "no-store" : "force-cache",
  });

  const contentType = upstream.headers.get("content-type") ?? "";
  const headers = new Headers();
  const passthroughHeaders = [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "last-modified",
    "etag",
  ];

  for (const header of passthroughHeaders) {
    const value = upstream.headers.get(header);
    if (value) headers.set(header, value);
  }

  headers.set("cache-control", upstream.headers.get("cache-control") ?? CACHE_CONTROL);
  headers.set("access-control-allow-origin", "*");

  if (upstream.ok && isHlsManifest(rawPath, contentType)) {
    const manifest = rewriteManifestUrls(await upstream.text());
    headers.set("content-type", contentType || "application/vnd.apple.mpegurl");
    headers.delete("content-length");

    return new Response(manifest, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

export async function HEAD(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  const response = await GET(request, { params });
  return new Response(null, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
