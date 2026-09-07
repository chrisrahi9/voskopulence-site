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

function cleanField(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", 400);
  }

  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json(
      { ok: true },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  const event = body.event === "waitlist" ? "waitlist" : body.event === "click" ? "click" : null;
  if (!event) return jsonError("Unsupported event", 400);

  const product = cleanField(body.product, 160);
  if (!product) return jsonError("Product is required", 400);

  const payload: Record<string, string> = {
    event,
    product,
    page: cleanField(body.page, 300) || "/shop",
    landingUrl: cleanField(body.landingUrl, 800),
    referrer: cleanField(body.referrer, 800),
    utmSource: cleanField(body.utmSource, 160),
    utmMedium: cleanField(body.utmMedium, 160),
    utmCampaign: cleanField(body.utmCampaign, 200),
    utmContent: cleanField(body.utmContent, 200),
    utmTerm: cleanField(body.utmTerm, 200),
    userAgent:
      cleanField(body.userAgent, 500) ||
      request.headers.get("user-agent")?.slice(0, 500) ||
      "",
  };

  if (event === "waitlist") {
    const email = cleanField(body.email, 254).toLowerCase();
    if (!EMAIL_RE.test(email)) {
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
