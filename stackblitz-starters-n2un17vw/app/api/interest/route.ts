import { NextResponse } from "next/server";

const ANALYTICS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbxu9MZaTjNjJQJ6NrRoow1HMEkFoUwPGe3uB1VR1ltF-YZZSU6WBkkRGq_bOxBCqKaO/exec";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { ok: false, error: message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", 400);
  }

  // Invisible honeypot: bots often populate fields that humans never see.
  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json(
      { ok: true },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  const event = body.event === "waitlist" ? "waitlist" : body.event === "click" ? "click" : null;
  if (!event) return jsonError("Unsupported event", 400);

  const product = typeof body.product === "string" ? body.product.trim().slice(0, 160) : "";
  if (!product) return jsonError("Product is required", 400);

  const payload: Record<string, string> = {
    event,
    product,
    page: typeof body.page === "string" ? body.page.slice(0, 300) : "/shop",
    userAgent:
      typeof body.userAgent === "string"
        ? body.userAgent.slice(0, 500)
        : request.headers.get("user-agent")?.slice(0, 500) ?? "",
  };

  if (event === "waitlist") {
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!EMAIL_RE.test(email) || email.length > 254) {
      return jsonError("A valid email address is required", 400);
    }
    payload.email = email;
  }

  try {
    const upstream = await fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (!upstream.ok) {
      console.error("INTEREST_UPSTREAM_ERROR", {
        status: upstream.status,
        event,
        product,
      });
      return jsonError("Interest service unavailable", 502);
    }

    return NextResponse.json(
      { ok: true },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("INTEREST_PROXY_ERROR", error);
    return jsonError("Interest service unavailable", 502);
  }
}
