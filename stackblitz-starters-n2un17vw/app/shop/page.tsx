"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

const ASSETS = "https://cdn.voskopulence.com";
const asset = (p: string) => `${ASSETS}${p}`;

// Google Apps Script endpoint (clicks + waitlist)
const ANALYTICS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbxu9MZaTjNjJQJ6NrRoow1HMEkFoUwPGe3uB1VR1ltF-YZZSU6WBkkRGq_bOxBCqKaO/exec";

/* ---------- Tiny fixed top sentinel (same as home) ---------- */
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

/* ---------- Solid top cap for iOS (same as home) ---------- */
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

/* ---------- Scroll lock helpers (same as home) ---------- */
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

type Bar = {
  id: string;
  name: string;
  img: string;
  tagline: string;
  hairType: string;
  benefits: string[];
  heroIngredients: string;
};

const BARS: Bar[] = [
  {
    id: "thyme",
    name: "Mediterranean Thyme & Rosemary Bar",
    img: "/Thyme_sea.png",
    tagline: "A fresh herbal cleanse that keeps roots light and awake.",
    hairType: "Normal to oily hair · Scalps that feel heavy or quickly greasy",
    benefits: [
      "Gently clarifies without stripping",
      "Helps reduce excess sebum at the roots",
      "Leaves hair light and refreshed",
    ],
    heroIngredients:
      "Rosemary, thyme & mint essential oils, coconut & olive oils, castor oil, shea butter, nettle leaf powder",
  },
  {
    id: "fig",
    name: "Fig & Cedar Nourishing Bar",
    img: "/Fig_sea.png",
    tagline: "Creamy comfort for hair that likes extra softness and care.",
    hairType: "Normal to dry hair · Frizz or sensitised ends",
    benefits: [
      "Softens and smooths the hair fibre",
      "Adds light nourishment without heaviness",
      "Leaves a warm, fruity Mediterranean scent",
    ],
    heroIngredients:
      "Fig extract, cedarwood & lavender, coconut & olive oils, castor oil, shea butter.",
  },
  {
    id: "lemon",
    name: "Lemon Sea Breeze Conditioner Bar",
    img: "/Lemon_sea.png",
    tagline: "Detangling solid conditioner with coastal freshness.",
    hairType: "All hair types · ideal after every wash",
    benefits: [
      "Instantly eases tangles after washing",
      "Adds softness and shine",
      "Light, fresh citrus–marine scent",
    ],
    heroIngredients:
      "Lemon peel oil, sea minerals, jojoba oil, coconut & olive oils, conditioning esters.",
  },
];

export default function ShopPage() {
  const router = useRouter();

  // ====== MENU / HEADER STATE (same pattern as home) ======
  const [menuOpen, setMenuOpen] = useState(false);
  const [hdrReady, setHdrReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [capPx, setCapPx] = useState(0);

  useEffect(() => setHdrReady(true), []);
  useEffect(() => setMounted(true), []);

  // scroll blur progress var --hdrProg
  useEffect(() => {
    const root = document.documentElement;
    let target = 0;
    let prog = 0;
    let raf: number | null = null;

    const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

    const read = () => {
      const y = window.scrollY || 0;
      target = clamp01(y / 120);
    };

    const tick = () => {
      prog += (target - prog) * 0.12;
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

  // capPx like home
  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isIOS =
      /iP(hone|od|ad)/.test(ua) ||
      (/\bMac\b/.test(ua) && "ontouchend" in window);
    setCapPx(isIOS ? 5 : 0);
    const onResize = () => setCapPx(isIOS ? 5 : 0);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // lock scroll when menu open
  useEffect(() => {
    if (menuOpen) lockScroll();
    else unlockScroll();
    return () => unlockScroll();
  }, [menuOpen]);

  // hairline var
  useEffect(() => {
    const dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));
    document.documentElement.style.setProperty(
      "--hairline",
      `${1 / dpr}px`
    );
  }, []);

  // small header nudge
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

  /* ---------- SiteHeader copied from home (nav adapted) ---------- */
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

        <div className="relative mx-auto max-w-screen-2xl px-4 sm:px-6 flex items-center justify-between h-[64px] md:h-[72px] lg:h-[80px]">
          {/* Left burger */}
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

          {/* Center logo */}
          <div
            className="absolute left-1/2 top-1/2 pointer-events-none"
            style={{
              transform:
                "translate3d(-50%, -50%, 0) scale(calc(1 - var(--hdrProg, 0) * 0.04))",
              transition: "transform 60ms linear",
              contain: "paint",
              textShadow: "0 1px 6px rgba(0,0,0,0.35)",
            }}
          >
            <button
              type="button"
              onClick={() => router.push("/")}
              className="pointer-events-auto"
              aria-label="Go to home"
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
            </button>
          </div>

          {/* Desktop nav */}
          <nav className="grow basis-0 hidden lg:flex justify-end items-center gap-6 text-sm lg:text-base relative z-[1]">
            <a href="/shop" className="hover:text-gray-200">
              Shop
            </a>
            <a
              href="/#about"
              className="hover:text-gray-200"
              onClick={(e) => {
                e.preventDefault();
                router.push("/#about");
              }}
            >
              About
            </a>
            <a href="/sustainability" className="hover:text-gray-200">
              Sustainability
            </a>
            <a href="/contact" className="hover:text-gray-200">
              Contact
            </a>
          </nav>
        </div>
      </header>
    );
  }

  /* ---------- Curtain swipe helpers (copied from home) ---------- */
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

  // ===== PRODUCT / WAITLIST STATE =====
  const [selectedBar, setSelectedBar] = useState<Bar | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  const closeModal = () => {
    setSelectedBar(null);
    setWaitlistEmail("");
    setWaitlistStatus("idle");
  };

  // Click → track + modal
  const handleBuyClick = (bar: Bar) => {
    if (typeof window !== "undefined") {
      try {
        const payload = {
          event: "click",
          product: bar.id,
          page: window.location.pathname,
          userAgent: window.navigator.userAgent,
        };
        fetch(ANALYTICS_ENDPOINT, {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
          mode: "no-cors",
          keepalive: true,
        }).catch(() => {});
      } catch {}
    }

    setSelectedBar(bar);
    setWaitlistEmail("");
    setWaitlistStatus("idle");
  };

  const handleWaitlistSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    if (!selectedBar || !waitlistEmail) return;
    if (waitlistStatus === "sending") return;

    setWaitlistStatus("sending");

    try {
      await fetch(ANALYTICS_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({
          event: "waitlist",
          product: selectedBar.name,
          email: waitlistEmail,
          page:
            typeof window !== "undefined"
              ? window.location.pathname
              : "/shop",
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : "",
        }),
        headers: { "Content-Type": "application/json" },
        mode: "no-cors",
      });

      setWaitlistStatus("sent");
      setWaitlistEmail("");
    } catch {
      setWaitlistStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
      <TopSentinel />
      <IOSCap />

      {/* HEADER (same as home, via portal) */}
      {hdrReady
        ? createPortal(<SiteHeader capPx={capPx} />, document.body)
        : <SiteHeader capPx={capPx} />}

      {/* ===== Mobile curtain (EXACT copy from home) ===== */}
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

            {/* Sliding panel from LEFT */}
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
                      href="/#about"
                      className="hover:text-gray-200"
                      onClick={(e) => {
                        e.preventDefault();
                        router.push("/#about");
                        setMenuOpen(false);
                      }}
                    >
                      About
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

      {/* ===================== MAIN SHOP CONTENT ===================== */}
      <main className="flex-1 pt-28 pb-20 px-6 lg:px-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="heading-script text-4xl sm:text-5xl text-[#004642] text-center mb-4">
            Our Bars
          </h1>
          <p className="text-center text-neutral-700 max-w-2xl mx-auto mb-12">
            Solid shampoo and conditioner bars crafted to COSMOS standards,
            designed for different hair needs but all with the same Mediterranean,
            eco-conscious spirit.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {BARS.map((bar) => (
              <article
                key={bar.id}
                className="flex flex-col rounded-3xl bg-[#f6fbf9] border border-[#8C9A91]/30 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.3)] overflow-hidden"
              >
                <div className="bg-[#e6f2ee]">
                  <img
                    src={asset(bar.img)}
                    alt={bar.name}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                <div className="p-5 flex flex-col gap-3 flex-1">
                  <h2 className="text-lg font-semibold text-[#004642]">
                    {bar.name}
                  </h2>
                  <p className="text-sm text-neutral-700">{bar.tagline}</p>

                  <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                    {bar.hairType}
                  </p>

                  <ul className="mt-1 text-sm text-neutral-700 list-disc list-inside space-y-1">
                    {bar.benefits.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>

                  <p className="mt-2 text-xs text-neutral-600">
                    <span className="font-semibold">Key ingredients: </span>
                    {bar.heroIngredients}
                  </p>

                  <div className="mt-auto pt-4">
                    <button
                      type="button"
                      onClick={() => handleBuyClick(bar)}
                      className="inline-flex w-full items-center justify-center rounded-full bg-[#004642]
                                 px-4 py-2.5 text-sm font-semibold tracking-[0.12em] text-white
                                 hover:bg-[#015b55] transition-all duration-200 hover:-translate-y-[1px]
                                 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C9A91]/70"
                    >
                      BUY NOW
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* WAITLIST MODAL */}
        {selectedBar && (
          <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white shadow-xl border border-[#8C9A91]/30 p-6 relative mx-4">
              <button
                type="button"
                onClick={closeModal}
                className="absolute right-3 top-3 p-1 rounded-full hover:bg-neutral-100 text-neutral-500"
                aria-label="Close"
              >
                ✕
              </button>

              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                Pre-launch · Out of stock
              </p>
              <h2 className="mt-2 text-base font-semibold text-[#004642]">
                {selectedBar.name}
              </h2>
              <p className="mt-2 text-sm text-neutral-700">
                We&apos;re preparing our first small batch of Voskopulence bars.
                This product is not available to purchase yet, but you can leave
                your email below and we&apos;ll let you know as soon as it&apos;s in stock.
              </p>

              <form className="mt-4 space-y-3" onSubmit={handleWaitlistSubmit}>
                <label className="block text-sm font-medium text-neutral-800">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@example.com"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#c4d3ca] px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#004642]/60"
                />

                <p className="text-[0.7rem] text-neutral-500">
                  You won&apos;t be charged now. This only subscribes you to a one-time
                  notification when this bar becomes available.
                </p>

                <button
                  type="submit"
                  disabled={waitlistStatus === "sending"}
                  className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-[#004642]
                             px-4 py-2.5 text-sm font-semibold tracking-[0.12em] text-white
                             hover:bg-[#015b55] transition-all duration-200 disabled:opacity-60"
                >
                  {waitlistStatus === "sending"
                    ? "Sending..."
                    : waitlistStatus === "sent"
                    ? "You’re on the list ✓"
                    : "Notify me at launch"}
                </button>

                {waitlistStatus === "error" && (
                  <p className="mt-2 text-sm text-red-600">
                    Something went wrong. Please try again in a moment.
                  </p>
                )}
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
