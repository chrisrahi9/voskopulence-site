export const runtime = "edge";

export async function GET() {
  const response = await fetch("https://vosko-cdn.b-cdn.net/logo_improved.svg", {
    cache: "no-store",
  });

  if (!response.ok) {
    return new Response("Unable to fetch logo", { status: response.status });
  }

  return new Response(await response.text(), {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
