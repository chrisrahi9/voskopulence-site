import { NextResponse } from "next/server";

const FORMS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbyY-t0Mwa_LxylYoVhsIFxz1FzkPQo7OWFXDdLz5-7W64NMZIO3hgQFO3MpDFd8TOfY/exec";

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

  const name = cleanField(body.name, 120);
  const email = cleanField(body.email, 254).toLowerCase();
  const message = cleanField(body.message, 5000);

  if (!name) return jsonError("Name is required", 400);
  if (!EMAIL_RE.test(email)) {
    return jsonError("A valid email address is required", 400);
  }
  if (!message) return jsonError("Message is required", 400);

  const payload = {
    type: "contact",
    name,
    email,
    message,
    page: cleanField(body.page, 300) || "/contact",
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

  try {
    const upstream = await fetch(FORMS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (!upstream.ok) {
      console.error("CONTACT_UPSTREAM_ERROR", { status: upstream.status });
      return jsonError("Contact service unavailable", 502);
    }

    return NextResponse.json(
      { ok: true },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("CONTACT_PROXY_ERROR", error);
    return jsonError("Contact service unavailable", 502);
  }
}
