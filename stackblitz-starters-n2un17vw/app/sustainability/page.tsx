"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

const ASSETS = "https://cdn.voskopulence.com";
const asset = (p: string) => `${ASSETS}${p}`;

const PROG_DISTANCE = 120;
const EASE = 0.12;

/* ---------- Tiny fixed top sentinel to help iOS compositor ---------- */
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

/* ---------- Solid top cap for iOS (prevents header tucking) ---------- */
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

/* =================================================================== */

export default function SustainabilityPage() {
  const router = useRouter();

  // ===== MENU / HEADER STATE =====
  const [menuOpen, setMenuOpen] = useState(false);
  const [hdrReady, setHdrReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [capPx, setCapPx] = useState<number>(0);

  useEffect(() => setHdrReady(true), []);
  useEffect(() => setMounted(true), []);

  // Header blur progress
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

  // Hairline var
  useEffect(() => {
    const dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));
    document.documentElement.style.setProperty(
      "--hairline",
      `${1 / dpr}px`
    );
  }, []);

  // iOS cap
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

    const onPageShow = (e: any) => {
      if (e?.persisted) nudge();
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

  // ===== HEADER (same as home/shop/contact) =====
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

          {/* Center: logo (slightly down like shop/contact) */}
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

  /* ======================= RENDER ======================= */

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopSentinel />
      <IOSCap />

      {/* Header (portal) */}
      {hdrReady
        ? createPortal(<SiteHeader capPx={capPx} />, document.body)
        : <SiteHeader capPx={capPx} />}

      {/* Mobile curtain menu */}
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

      {/* ===== Sustainability content (your original JSX) ===== */}
      <main className="flex-1 bg-white pt-28 pb-20">
        <section className="mx-auto max-w-5xl px-6 lg:px-10">
          {/* HERO */}
          <div className="max-w-5xl mx-auto">
            <h1 className="heading-script text-4xl sm:text-5xl text-[#004642] text-center mb-4">
              Sustainability &amp; Formulation
            </h1>

            <p className="text-center text-neutral-700 max-w-3xl mx-auto mb-10 text-sm sm:text-base">
              A transparent look at how Voskopulence bars are crafted:
              ingredients, COSMOS-style standards, sustainability choices
              and our formulation philosophy.
            </p>
          </div>

          {/* COSMOS EXPLAINER */}
          <section className="mt-10 rounded-3xl bg-[#f6fbf9] border border-[#8C9A91]/30 p-6 lg:p-7 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)]">
            <h2 className="text-base font-semibold tracking-[0.14em] uppercase text-[#004642]">
              What does “COSMOS” mean?
            </h2>
            <p className="mt-3 text-sm text-neutral-700">
              COSMOS is an independent European standard that defines how
              natural and organic cosmetics should be made. It covers:
            </p>
            <ul className="mt-3 text-sm text-neutral-700 list-disc list-inside space-y-1">
              <li>Which ingredients are allowed and in what form</li>
              <li>Minimum levels of natural / organic content</li>
              <li>
                Rules on animal testing, biodegradable ingredients &amp; GMOs
              </li>
              <li>
                Packaging, traceability and how formulas are checked by
                auditors
              </li>
            </ul>
            <p className="mt-3 text-xs text-neutral-600">
              In short: COSMOS is about safe, well-documented formulas with
              a lower impact on people and the environment – not just
              marketing words like “green” or “clean”.
            </p>
          </section>

          {/* HOW VOSKOPULENCE FITS */}
          <section className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl bg-[#004642] text-white p-6 lg:p-7 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.38)]">
              <h2 className="text-sm font-semibold tracking-[0.18em] uppercase">
                Our formulation philosophy
              </h2>
              <p className="mt-3 text-sm text-white/90">
                Our bars are developed with a European lab that works with
                COSMOS-compliant formulations. For Voskopulence, we focus on:
              </p>
              <ul className="mt-3 text-sm text-white/90 list-disc list-inside space-y-1">
                <li>High share of naturally-derived ingredients</li>
                <li>Vegan &amp; cruelty-free formulations</li>
                <li>No deliberately added palm oil in the bar base</li>
                <li>Botanical scents inspired by the Mediterranean</li>
              </ul>
              <p className="mt-3 text-xs text-white/80">
                As we finalise each bar, we work with the lab to ensure it
                fits the requirements for COSMOS-style formulations and good
                scalp tolerance.
              </p>
            </div>

            <div className="rounded-3xl bg-[#f6fbf9] border border-[#8C9A91]/30 p-6 lg:p-7">
              <h2 className="text-sm font-semibold tracking-[0.18em] uppercase text-[#004642]">
                Solid bars, less waste
              </h2>
              <p className="mt-3 text-sm text-neutral-700">
                A solid bar means:
              </p>
              <ul className="mt-3 text-sm text-neutral-700 list-disc list-inside space-y-1">
                <li>No plastic bottle for the product itself</li>
                <li>Much less water shipped compared with liquid shampoo</li>
                <li>Compact format that’s easier to ship and store</li>
              </ul>
              <p className="mt-3 text-xs text-neutral-600">
                Packaging for Voskopulence bars is designed to be simple,
                protective and fully recyclable, with a focus on paper and
                cardboard rather than mixed materials.
              </p>
            </div>
          </section>

          {/* HONESTY / TRANSPARENCY BLOCK */}
          <section className="mt-10 rounded-3xl bg-[#fffaf3] border border-[#e8d7b8] p-6 lg:p-7">
            <h2 className="text-sm font-semibold tracking-[0.18em] uppercase text-[#7a5a2f]">
              A note on certifications &amp; honesty
            </h2>
            <p className="mt-3 text-sm text-[#55412a]">
              We believe sustainability also means being honest about where
              we are today:
            </p>
            <ul className="mt-3 text-sm text-[#55412a] list-disc list-inside space-y-1">
              <li>
                Our goal is to launch bars that are compatible with
                COSMOS-style requirements, using ingredients and bases that
                can be certified.
              </li>
              <li>
                Official third-party certification (logos on pack, audited
                documents, etc.) is a separate step and will be clearly
                indicated when obtained.
              </li>
              <li>
                Until then, we do not claim to be “certified COSMOS”; we
                simply share how and why the formulas are designed in that
                direction.
              </li>
            </ul>
            <p className="mt-3 text-xs text-[#6c5434]">
              If you ever have questions about ingredients, allergens or how
              to recycle our packaging in your country, you can always reach
              us at{" "}
              <a
                href="mailto:hello@voskopulence.com"
                className="underline underline-offset-2"
              >
                hello@voskopulence.com
              </a>
              .
            </p>
          </section>

          {/* FAQ STYLE BOTTOM BLOCK */}
          <section className="mt-10 space-y-5 text-sm text-neutral-800">
            <div>
              <h3 className="font-semibold">
                Are Voskopulence bars officially COSMOS certified?
              </h3>
              <p className="mt-1">
                Not yet. Our current focus is on working with a lab that
                develops COSMOS-style formulas and on choosing ingredients
                that fit that philosophy. Once official certification is in
                place, it will be clearly visible on our packaging and on
                this page.
              </p>
            </div>

            <div>
              <h3 className="font-semibold">
                Are the bars suitable for vegans and cruelty-free?
              </h3>
              <p className="mt-1">
                Our intention for Voskopulence is to keep all bars vegan and
                not tested on animals. We confirm this with our manufacturing
                partner for each batch and will never knowingly work with
                animal testing.
              </p>
            </div>

            <div>
              <h3 className="font-semibold">
                Do the formulas contain sulfates or harsh detergents?
              </h3>
              <p className="mt-1">
                The bars are formulated with gentler, modern surfactants that
                are compatible with COSMOS-style guidelines, rather than
                traditional SLS/SLES. They are designed to cleanse
                effectively while remaining respectful of the scalp when used
                as directed.
              </p>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
