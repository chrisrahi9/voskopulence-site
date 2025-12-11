"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

const ASSETS = "https://cdn.voskopulence.com";
const asset = (p: string) => `${ASSETS}${p}`;

const PROG_DISTANCE = 120;
const EASE = 0.12;

// ---------- Tiny fixed top sentinel to help iOS compositor ----------
function TopSentinel() {
  useEffect(() => {
    const s = document.createElement("div");
    Object.assign(s.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "1px",
      height: "calc(env(safe-area-inset-top, 0px) + 1px)",
      pointerEvents: "none",
      zIndex: "2147483647",
      transform: "translateZ(0)",
      willChange: "transform",
      WebkitBackfaceVisibility: "hidden",
      backfaceVisibility: "hidden",
      contain: "strict",
      opacity: "0",
    });
    document.body.appendChild(s);
    return () => {
      try {
        document.body.removeChild(s);
      } catch {}
    };
  }, []);
  return null;
}

// ---------- Solid top cap for iOS (prevents header tucking) ----------
function IOSCap() {
  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isiOS =
      /iP(hone|od|ad)/.test(ua) ||
      (/\bMac\b/.test(ua) && "ontouchend" in window);
    if (!isiOS) return;

    const cap = document.createElement("div");
    Object.assign(cap.style, {
      position: "fixed",
      top: "0",
      left: "0",
      right: "0",
      height: "env(safe-area-inset-top, 0px)",
      background: "rgba(0,70,66,0.94)",
      pointerEvents: "none",
      zIndex: "9998",
      transform: "translateZ(0)",
      WebkitBackfaceVisibility: "hidden",
      backfaceVisibility: "hidden",
      contain: "strict",
    });
    document.body.appendChild(cap);
    return () => {
      try {
        document.body.removeChild(cap);
      } catch {}
    };
  }, []);
  return null;
}

/* ---------- Robust scroll lock ---------- */
const scrollYRef = { current: 0 };

function lockScroll() {
  const docEl = document.documentElement;
  const body = document.body;
  scrollYRef.current = window.scrollY;

  docEl.style.overflow = "hidden";
  docEl.style.height = "100%";
  body.style.overflow = "hidden";
  body.style.position = "fixed";
  body.style.top = `-${scrollYRef.current}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
}

function unlockScroll() {
  const docEl = document.documentElement;
  const body = document.body;

  const top = body.style.top;
  const y = top ? -parseInt(top || "0", 10) : 0;

  docEl.style.overflow = "";
  docEl.style.height = "";
  body.style.overflow = "";
  body.style.position = "";
  body.style.top = "";
  body.style.left = "";
  body.style.right = "";
  body.style.width = "";

  requestAnimationFrame(() => {
    window.scrollTo(0, y || scrollYRef.current || 0);
  });
}

const FORMS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbyY-t0Mwa_LxylYoVhsIFxz1FzkPQo7OWFXDdLz5-7W64NMZIO3hgQFO3MpDFd8TOfY/exec";

export default function ContactPage() {
  const router = useRouter();

  // ===== MENU / HEADER STATE =====
  const [menuOpen, setMenuOpen] = useState(false);
  const [hdrReady, setHdrReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [capPx, setCapPx] = useState<number>(0);

  useEffect(() => setHdrReady(true), []);
  useEffect(() => setMounted(true), []);

  // Scroll blur progress (same as home)
  useEffect(() => {
    const root = document.documentElement;
    let target = 0;
    let prog = 0;
    let raf: number | null = null;

    const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

    const read = () => {
      const y = window.scrollY || 0;
      target = clamp01(y / PROG_DISTANCE);
    };

    const tick = () => {
      prog += (target - prog) * EASE;
      if (Math.abs(target - prog) < 0.001) prog = target;
      root.style.setProperty("--hdrProg", prog.toFixed(4));
      if (prog !== target) raf = requestAnimationFrame(tick);
      else raf = null;
    };

    const onScroll = () => {
      read();
      if (raf == null) raf = requestAnimationFrame(tick);
    };

    read();
    root.style.setProperty("--hdrProg", "0");
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, []);

  // Lock page scroll when curtain is open
  useEffect(() => {
    if (menuOpen) lockScroll();
    else unlockScroll();
    return () => unlockScroll();
  }, [menuOpen]);

  // Hairline
  useEffect(() => {
    const dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));
    document.documentElement.style.setProperty(
      "--hairline",
      `${1 / dpr}px`
    );
  }, []);

  // iOS cap value
  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isIOS =
      /iP(hone|od|ad)/.test(ua) ||
      (/\bMac\b/.test(ua) && "ontouchend" in window);
    const update = () => setCapPx(isIOS ? 5 : 0);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Stronger Safari header nudge
  useEffect(() => {
    const header = document.querySelector("header") as HTMLElement | null;
    if (!header) return;

    const nudge = () => {
      header.style.willChange = "transform";
      const prev = header.style.transform;
      header.style.transform = "translateZ(0)";
      requestAnimationFrame(() => {
        header.style.willChange = "auto";
        header.style.transform = prev;
      });
    };

    const onPageShow = (e: PageTransitionEvent) => {
      // @ts-ignore
      if (e.persisted) nudge();
    };
    const onVis = () => {
      if (document.visibilityState === "visible") nudge();
    };
    const onOri = () => nudge();

    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("orientationchange", onOri);

    setTimeout(nudge, 0);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("orientationchange", onOri);
    };
  }, []);

  // ===== HEADER COMPONENT (same style as home) =====
  function SiteHeader({ capPx }: { capPx: number }) {
    const hasCap = (capPx ?? 0) > 0;

    return (
      <header
        className="fixed inset-x-0 top-0 z-[9999] text-white/95"
        style={{
          isolation: "isolate",
          contain: "paint",
          ["--cap" as any]: `${capPx}px`,
          ["--bleed" as any]:
            capPx > 0
              ? "calc(var(--cap) + var(--hairline,1px))"
              : "var(--cap)",
          paddingTop: "calc(var(--cap) + env(safe-area-inset-top, 0px))",
          transform: "translateZ(0)",
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
        }}
      >
        {/* Background layer */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backdropFilter:
              "blur(calc(var(--hdrProg, 0) * 12px)) saturate(calc(1 + var(--hdrProg, 0) * 0.5))",
            WebkitBackdropFilter:
              "blur(calc(var(--hdrProg, 0) * 12px)) saturate(calc(1 + var(--hdrProg, 0) * 0.5))",
            background: hasCap
              ? `
                linear-gradient(
                  to bottom,
                  rgba(0,70,66,0.94) 0,
                  rgba(0,70,66,0.94) calc(${capPx}px + var(--hairline, 1px)),
                  transparent           calc(${capPx}px + var(--hairline, 1px)),
                  transparent           100%
                ),
                linear-gradient(
                  to bottom,
                  rgba(0,70,66, calc(var(--hdrProg,0) * 0.94)) calc(${capPx}px + var(--hairline, 1px)),
                  rgba(0,70,66, calc(var(--hdrProg,0) * 0.94)) 100%
                )`
              : `
                linear-gradient(
                  to bottom,
                  rgba(0,70,66, calc(var(--hdrProg,0) * 0.94)) 0,
                  rgba(0,70,66, calc(var(--hdrProg,0) * 0.94)) 100%
                )`,
            transition:
              "backdrop-filter 120ms linear, -webkit-backdrop-filter 120ms linear",
            transform: "translateZ(0)",
          }}
          aria-hidden="true"
        />

        {/* Row */}
        <div className="relative mx-auto max-w-screen-2xl px-4 sm:px-6 flex items-center justify-between h-[64px] md:h-[72px] lg:h-[80px]">
          {/* Left: burger */}
          <div className="grow basis-0">
            <button
              className="inline-flex h-11 w-11 items-center justify-center rounded-full lg:hidden relative z-[1] hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              aria-label="Open menu"
              aria-controls="mobile-menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Center: logo */}
          <div
            className="absolute left-1/2 top-1/2 pointer-events-none"
            style={{
              transform:
                "translate3d(-50%, calc(-50% + 4px), 0) scale(calc(1 - var(--hdrProg, 0) * 0.04))",
              transition: "transform 60ms linear",
              contain: "paint",
              textShadow: "0 1px 6px rgba(0,0,0,0.35)",
            }}
          >
            <img
              src={asset("/logo_improved.svg")}
              alt="Voskopulence"
              className="block w-auto h-[108px] md:h-[132px] lg:h-[144px]"
              loading="eager"
              decoding="async"
              style={{
                transform: "translateZ(0)",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            />
          </div>

          {/* Right: nav */}
          <nav className="grow basis-0 hidden lg:flex justify-end items-center gap-6 text-sm lg:text-base relative z-[1]">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="hover:text-gray-200"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => router.push("/shop")}
              className="hover:text-gray-200"
            >
              Shop
            </button>
            <button
              type="button"
              onClick={() => router.push("/sustainability")}
              className="hover:text-gray-200"
            >
              Sustainability
            </button>
            <button
              type="button"
              onClick={() => router.push("/contact")}
              className="hover:text-gray-200"
            >
              Contact
            </button>
          </nav>
        </div>
      </header>
    );
  }

  // ===== Curtain swipe logic =====
  const swipe = useRef({
    active: false,
    startX: 0,
    lastX: 0,
  });

  function startSwipeX(e: React.TouchEvent) {
    if (!menuOpen) return;
    const t = e.touches[0];
    swipe.current.active = true;
    swipe.current.startX = t.clientX;
    swipe.current.lastX = t.clientX;
  }

  function moveSwipeX(e: React.TouchEvent) {
    if (!menuOpen || !swipe.current.active) return;
    const t = e.touches[0];
    const dx = t.clientX - swipe.current.startX;
    swipe.current.lastX = t.clientX;

    if (dx > 0) {
      e.preventDefault();
      const panel = document.getElementById("curtain-panel");
      if (panel) {
        const translate = Math.min(dx * 0.6, window.innerWidth);
        panel.style.transition = "none";
        panel.style.transform = `translateX(${translate}px)`;
      }
    }
  }

  function endSwipeX() {
    if (!menuOpen || !swipe.current.active) return;
    const dx = swipe.current.lastX - swipe.current.startX;
    swipe.current.active = false;

    const panel = document.getElementById("curtain-panel");
    if (!panel) return;

    const shouldClose = dx > Math.min(window.innerWidth * 0.25, 200);

    panel.style.transition = "transform 420ms cubic-bezier(.19,1,.22,1)";
    panel.style.transform = shouldClose
      ? "translateX(100%)"
      : "translateX(0%)";

    if (shouldClose) setTimeout(() => setMenuOpen(false), 360);
  }

  // ===== Contact form state (your original logic) =====
  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");
    const message = String(formData.get("message") || "");

    try {
      await fetch(FORMS_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({
          type: "contact",
          name,
          email,
          message,
          page:
            typeof window !== "undefined"
              ? window.location.pathname
              : "/contact",
          userAgent:
            typeof navigator !== "undefined"
              ? navigator.userAgent
              : "",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
      });

      setStatus("sent");
      form.reset();
    } catch (err) {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopSentinel />
      <IOSCap />

      {/* Header (portal like home) */}
      {hdrReady
        ? createPortal(<SiteHeader capPx={capPx} />, document.body)
        : <SiteHeader capPx={capPx} />}

      {/* Mobile curtain menu (same as home) */}
      {mounted &&
        typeof document !== "undefined" &&
        menuOpen &&
        createPortal(
          <div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            className="lg:hidden fixed inset-0 z-[12000]"
          >
            {/* Backdrop */}
            <button
              aria-label="Close menu"
              className="absolute inset-0 bg-[rgba(0,70,66,0.70)] backdrop-blur-md"
              style={{
                opacity: 1,
                transition:
                  "opacity 420ms cubic-bezier(.22,1,.36,1)",
              }}
              onClick={() => setMenuOpen(false)}
            />

            {/* Sliding panel */}
            <div
              id="curtain-panel"
              className="absolute inset-y-0 left-0 right-0 z-[12001] flex flex-col text-white"
              style={{
                transform: "translateX(0%)",
                transition:
                  "transform 460ms cubic-bezier(.22,1,.36,1)",
                paddingTop: "env(safe-area-inset-top)",
                paddingBottom: "env(safe-area-inset-bottom)",
                willChange: "transform",
                transformOrigin: "left center",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
              onTouchStart={startSwipeX}
              onTouchMove={moveSwipeX}
              onTouchEnd={endSwipeX}
            >
              {/* Top row */}
              <div className="flex items-center justify-between h-[64px] px-5 shrink-0">
                <span className="font-semibold text-white/95">
                  Menu
                </span>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="p-2 rounded-md hover:bg:white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  onClick={() => setMenuOpen(false)}
                  style={{ position: "relative", zIndex: 1 }}
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              {/* Links */}
              <nav className="grow grid place-items-center">
                <ul className="flex flex-col items-center gap-8 text-[1.25rem] font-light tracking-wide">
                  <li>
                    <a
                      href="/"
                      className="hover:text-gray-200"
                      onClick={(e) => {
                        e.preventDefault();
                        router.push("/");
                        setMenuOpen(false);
                      }}
                    >
                      Home
                    </a>
                  </li>
                  <li>
                    <a
                      href="/shop"
                      onClick={() => setMenuOpen(false)}
                      className="hover:text-gray-200"
                    >
                      Shop
                    </a>
                  </li>
                  <li>
                    <a
                      href="/sustainability"
                      onClick={() => setMenuOpen(false)}
                      className="hover:text-gray-200"
                    >
                      Sustainability
                    </a>
                  </li>
                  <li>
                    <a
                      href="/contact"
                      onClick={() => setMenuOpen(false)}
                      className="hover:text-gray-200"
                    >
                      Contact
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>,
          document.body
        )}

      {/* ===== Contact content (unchanged, just inside <main>) ===== */}
      <main className="flex-1 bg-white pt-28 pb-20 px-6 lg:px-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="heading-script text-4xl sm:text-5xl text-[#004642] text-center mb-4">
            Contact us
          </h1>
          <p className="text-center text-neutral-700 max-w-2xl mx-auto mb-10 text-sm sm:text-base">
            Questions about the bars, ingredients, or wholesale? Send us
            a message and we&apos;ll get back to you as soon as we can.
          </p>

          <div className="rounded-3xl bg-[#f6fbf9] border border-[#8C9A91]/30 p-6 lg:p-8 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.3)]">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm text-neutral-600 mb-1">
                  Your name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="John Doe"
                  className="w-full border border-[#c4d3ca] px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#004642]/60"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm text-neutral-600 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@example.com"
                  className="w-full border border-[#c4d3ca] px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#004642]/60"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm text-neutral-600 mb-1">
                  Message
                </label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  placeholder="Write your message here..."
                  className="w-full border border-[#c4d3ca] px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#004642]/60 resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={status === "sending"}
                className="mt-2 inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-[#004642]
                           px-6 py-2.5 text-sm font-semibold tracking-[0.12em] text-white
                           hover:bg-[#015b55] transition-all duration-200 disabled:opacity-60"
              >
                {status === "sending" ? "Sending..." : "Send message"}
              </button>

              {status === "sent" && (
                <p className="mt-3 text-sm text-emerald-700">
                  Thank you for contacting us. We&apos;ll get back to you
                  as soon as possible.
                </p>
              )}
              {status === "error" && (
                <p className="mt-3 text-sm text-red-600">
                  Something went wrong. Please try again in a moment.
                </p>
              )}
            </form>

            <p className="mt-4 text-[0.75rem] text-neutral-500 text-center sm:text-left">
              You can also write to us directly at{" "}
              <a
                href="mailto:info@voskopulence.com"
                className="underline underline-offset-2"
              >
                info@voskopulence.com
              </a>
              .
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
