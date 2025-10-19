"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// All assets live at CDN root:
const ASSETS = "https://cdn.voskopulence.com";
const asset = (p: string) => `${ASSETS}${p}`;

// Gate touch-only handlers (desktop uses simple click)
const isTouch =
  typeof window !== "undefined" && matchMedia("(hover: none)").matches;

export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<any>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // For portals
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // --- Pulsing CTA (touch behavior) ---
  const ctaRef = useRef<HTMLButtonElement | null>(null);
  const [showArrow, setShowArrow] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const [pressing, setPressing] = useState(false);
  const longTimer = useRef<number | null>(null);
  const canVibrate = typeof navigator !== "undefined" && "vibrate" in navigator;
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown: React.PointerEventHandler<HTMLButtonElement> = (e) => {
    if (e.pointerType === "mouse") return;
    startPos.current = { x: e.clientX, y: e.clientY };
    setPressing(true);
    setShowArrow(true);
    const LONG_MS = 700;
    longTimer.current = window.setTimeout(() => {
      setIsLongPress(true);
      try { if (canVibrate) navigator.vibrate(18); } catch {}
    }, LONG_MS);
  };

  const handlePointerMove: React.PointerEventHandler<HTMLButtonElement> = (e) => {
    if (!startPos.current) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    if (Math.hypot(dx, dy) > 24) {
      if (longTimer.current) {
        clearTimeout(longTimer.current);
        longTimer.current = null;
      }
    }
  };

  const handlePointerEnd: React.PointerEventHandler<HTMLButtonElement> = () => {
    if (longTimer.current) {
      clearTimeout(longTimer.current);
      longTimer.current = null;
    }
    const delay = isLongPress ? 120 : 0;
    window.setTimeout(() => {
      if (!isLongPress) scrollDown();
      setIsLongPress(false);
      setShowArrow(false);
      setPressing(false);
    }, delay);
  };

  // keep a ref of menuOpen for observers/listeners (avoid stale closure)
  const menuOpenRef = useRef(menuOpen);
  useEffect(() => { menuOpenRef.current = menuOpen; }, [menuOpen]);

  // Frosted header on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Smooth scroll to first next section
  const scrollDown = () => {
    const targets = ["spotlight", "about"];
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    for (const id of targets) {
      const el = document.getElementById(id);
      if (!el) continue;
      const top = el.getBoundingClientRect().top;
      if (top > 80) {
        const yOffset =
          window.innerWidth < 640 ? -window.innerHeight * 0.12 : -window.innerHeight * 0.25;
        const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
        return;
      }
    }
    document.getElementById("about")
      ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  // Lock page scroll when mobile menu is open
  useEffect(() => {
    const root = document.documentElement;
    if (menuOpen) root.classList.add("overflow-hidden");
    else root.classList.remove("overflow-hidden");
    return () => root.classList.remove("overflow-hidden");
  }, [menuOpen]);

  // Edge-swipe to open/close mobile menu (touch only)
  useEffect(() => {
    if (!isTouch) return;
    let startX = 0, startY = 0, tracking = false, openedFromEdge = false;

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      startX = t.clientX; startY = t.clientY;
      openedFromEdge = !menuOpen && startX <= 50;
      tracking = openedFromEdge || menuOpen;
    };

    const onMove = (e: TouchEvent) => {
      if (!tracking) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dy) > Math.abs(dx) + 10) { tracking = false; return; }
      if (openedFromEdge && Math.abs(dx) > 10 && Math.abs(dy) < 40) e.preventDefault();
    };

    const onEnd = (e: TouchEvent) => {
      if (!tracking) return;
      const t = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0]);
      if (!t) { tracking = false; return; }
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const horizontalEnough = Math.abs(dx) >= 45 && Math.abs(dy) <= 50;
      if (!menuOpen && openedFromEdge && horizontalEnough && dx > 0) setMenuOpen(true);
      else if (menuOpen && horizontalEnough && dx < 0) setMenuOpen(false);
      tracking = false;
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove as unknown as EventListener, { passive: false });
    window.addEventListener("touchend", onEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove as unknown as EventListener);
      window.removeEventListener("touchend", onEnd);
    };
  }, [menuOpen, isTouch]);

  const tryPlay = (v: HTMLVideoElement | null) => {
    if (!v) return;
    v.muted = true;
    // @ts-ignore
    v.setAttribute("webkit-playsinline", "true");
    v.setAttribute("playsinline", "true");
    const p = v.play?.();
    if (p && typeof p.catch === "function") p.catch(() => {});
  };

  // --- Video setup (HLS with MP4 fallback)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const HLS_SRC = asset("/hero_hls/master.m3u8");
    const MP4_SRC = asset("/hero_web.mp4");
    const POSTER = asset("/hero_poster.jpg");

    v.poster = POSTER;
    let destroyed = false;

    const setup = async () => {
      const isIOS =
        /iP(hone|od|ad)/.test(navigator.platform) ||
        (/Mac/.test(navigator.userAgent) && "ontouchend" in document);

      if (isIOS) {
        v.src = MP4_SRC;
        try { v.load(); } catch {}
        tryPlay(v);
        return;
      }

      if (v.canPlayType("application/vnd.apple.mpegurl")) {
        v.src = HLS_SRC;
        try { v.load(); } catch {}
        tryPlay(v);
        return;
      }

      try {
        const Hls = (await import("hls.js")).default;
        if (Hls?.isSupported?.()) {
          const hls = new Hls({
            capLevelToPlayerSize: true,
            startLevel: -1,
            maxBufferLength: 10,
            maxMaxBufferLength: 20,
            backBufferLength: 0,
            enableWorker: true,
            fragLoadingRetryDelay: 500,
            fragLoadingMaxRetry: 3,
          });
          // @ts-expect-error – not in local typings
          hls.config.maxInitialBitrate = 2_500_000;

          hlsRef.current = hls;
          hls.attachMedia(v);
          hls.on(Hls.Events.MEDIA_ATTACHED, () => { if (!destroyed) hls.loadSource(HLS_SRC); });
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            try {
              if (hls.levels?.length) {
                const lvls = hls.levels;
                let pick = lvls.findIndex((l) => (l.height ?? 0) >= 1080);
                if (pick < 0) pick = lvls.findIndex((l) => /1080/i.test(l.name ?? ""));
                if (pick < 0) pick = lvls.length - 1;
                hls.currentLevel = pick;
                setTimeout(() => { hls.loadLevel = -1; }, 3000);
              }
            } catch {}
            if (!destroyed) tryPlay(v);
          });
          hls.on(Hls.Events.ERROR, (_e: any, data: any) => {
            if (data?.fatal) {
              try { hls.destroy(); } catch {}
              hlsRef.current = null;
              v.src = MP4_SRC;
              try { v.load(); } catch {}
              tryPlay(v);
            }
          });
          return;
        }
      } catch {}

      v.src = MP4_SRC;
      try { v.load(); } catch {}
      tryPlay(v);
    };

    setup();

    const onLoaded = () => tryPlay(v);
    const onCanPlay = () => { if (v.paused) tryPlay(v); };
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("canplay", onCanPlay);

    // Fade in when video starts
    v.addEventListener("playing", () => { v.style.opacity = "1"; });

    const onVis = () =>
      document.visibilityState === "visible" ? tryPlay(v) : v.pause();
    document.addEventListener("visibilitychange", onVis);

    const io = new IntersectionObserver(
      ([e]) => {
        if (menuOpenRef.current) { tryPlay(v); return; }
        if (e.intersectionRatio > 0.03) tryPlay(v);
        else v.pause();
      },
      { threshold: [0, 0.01, 0.02, 0.03, 0.1, 0.25, 0.5, 1] }
    );
    io.observe(v);

    return () => {
      destroyed = true;
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("canplay", onCanPlay);
      document.removeEventListener("visibilitychange", onVis);
      io.disconnect();
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch {}
        hlsRef.current = null;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col scroll-smooth">
      {/* =================== NAVBAR =================== */}
<header
  className="fixed top-0 z-50 w-full text-white/95 [padding-top:env(safe-area-inset-top)]"
  style={{ transform: "translateZ(0)", willChange: "transform", contain: "paint" }}
>
  {/* ✅ Solid paint under iOS status bar (no white flash, ends at camera area) */}
  <div
    aria-hidden="true"
    className="fixed inset-x-0 top-0 pointer-events-none"
    style={{
      height: "clamp(4px, env(safe-area-inset-top), 34px)", // 👈 slightly shorter cap
      background: "#004642",
      zIndex: 0,
    }}
  />

  {/* Smooth frosted background */}
  <div
    className="absolute inset-0 pointer-events-none [transition:opacity_300ms_ease]
               backdrop-blur-md backdrop-saturate-150 transform-gpu"
    style={{ backgroundColor: "#004642", opacity: scrolled ? 0.94 : 0, zIndex: 1 }}
    aria-hidden="true"
  />

  {!scrolled && (
    <div
      className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 to-transparent"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    />
  )}

  <div className="relative mx-auto max-w-screen-2xl px-4 sm:px-6" style={{ zIndex: 2 }}>
    <div className="relative flex items-center justify-between h-[56px] md:h-[64px] lg:h-[72px]">
      {/* LEFT: hamburger */}
      <div className="grow basis-0">
        <button
          className="inline-flex items-center justify-center p-2 rounded-md hover:bg-white/10 lg:hidden relative z-[3]"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen(true)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
      </div>

      {/* CENTER: logo */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ zIndex: 2 }}
      >
        <img
          src={asset("/logo_improved.svg")}
          alt="Voskopulence"
          className="block w-auto max-h-[120px] md:max-h-[132px] lg:max-h-[144px]"
          loading="eager"
          decoding="async"
        />
      </div>

      {/* RIGHT: desktop nav */}
      <nav className="grow basis-0 hidden lg:flex justify-end items-center gap-6 text-sm lg:text-base relative z-[3]">
        <a href="/shop" className="hover:text-gray-200">Shop</a>
        <a href="#about" className="hover:text-gray-200">About</a>
        <a href="/sustainability" className="hover:text-gray-200">Sustainability</a>
        <a href="/contact" className="hover:text-gray-200">Contact</a>
      </nav>
    </div>
  </div>
</header>


      {/* ===== Mobile curtain (portal, fixed inset-0) ===== */}
      {mounted && typeof document !== "undefined" &&
        createPortal(
          <div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-hidden={!menuOpen}
            className={`lg:hidden ${menuOpen ? "" : "hidden"}`}
          >
            {/* Backdrop – EXACT same color/blur */}
            <div
              className="fixed inset-0 z-[999] bg-[#004642]/75 backdrop-blur-xl supports-[backdrop-filter]:bg-[#004642]/60 transition-opacity duration-200"
              style={{ opacity: menuOpen ? 1 : 0 }}
              onClick={() => setMenuOpen(false)}
            />
            {/* Safe-area fillers */}
            <div className="fixed inset-x-0 top-0 z-[1000] pointer-events-none bg-[#004642]/75 backdrop-blur-xl supports-[backdrop-filter]:bg-[#004642]/60" style={{ height: "env(safe-area-inset-top)" }} />
            <div className="fixed inset-x-0 bottom-0 z-[1000] pointer-events-none bg-[#004642]/75 backdrop-blur-xl supports-[backdrop-filter]:bg-[#004642]/60" style={{ height: "env(safe-area-inset-bottom)" }} />
            {/* Menu content */}
            <div className={`fixed inset-0 z-[1001] flex flex-col text-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] transition-all duration-200 ${menuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1 pointer-events-none"}`}>
              <div className="flex items-center justify-between h-[64px] px-4">
                <span className="font-semibold">Menu</span>
                <button className="p-2 rounded-md hover:bg-white/10" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="flex-1 flex flex-col items-center justify-center gap-6 text-xl">
                <a href="/shop" onClick={() => setMenuOpen(false)} className="hover:text-gray-200">Shop</a>
                <a href="#about" onClick={() => setMenuOpen(false)} className="hover:text-gray-200">About</a>
                <a href="/sustainability" onClick={() => setMenuOpen(false)} className="hover:text-gray-200">Sustainability</a>
                <a href="/contact" onClick={() => setMenuOpen(false)} className="hover:text-gray-200">Contact</a>
              </nav>
            </div>
          </div>,
          document.body
        )
      }

      {/* ===================== HERO ===================== */}
      <section className="relative z-0 w-full overflow-visible">
        <div className="relative h-[96svh] md:h-[96svh] lg:h-[96dvh]">
          {/* 12px taller wrapper prevents seams */}
          <div className="absolute inset-x-0 top-0 -bottom-[16px]">
            {/* instant static background before video loads */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${asset("/hero_poster.jpg")})`, filter: "brightness(0.9)" }}
            />

            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-[1200ms] ease-[cubic-bezier(.22,1,.36,1)]"
              poster={asset("/hero_poster.jpg")}
              autoPlay
              muted
              playsInline
              // @ts-ignore
              webkit-playsinline="true"
              loop
              preload="metadata"
              aria-hidden="true"
              disablePictureInPicture
              controlsList="nodownload noplaybackrate"
            />

            {/* Legibility overlay */}
            <div className="absolute inset-0 bg-black/30" />
            {/* Bottom gradient (also rides the extra 12px) */}
            <div className="absolute bottom-0 left-0 right-0 h-[16vh] bg-gradient-to-b from-transparent to-[#004642]/20 pointer-events-none" />
          </div>

          <div className="relative z-10 h-full flex items-center justify-center">
            <div className="px-6 lg:px-10 text-center max-w-3xl">
              <h1
                className="heading-script leading-tight tracking-[0.01em] text-white md:drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]"
                style={{ fontSize: "clamp(2.5rem, 2rem + 2.5vw, 4rem)" }}
              >
                Welcome to Voskopulence
              </h1>
              <p className="mt-6 text-white/95 md:drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.5)] text-sans text-base lg:text-lg">
                Solid shampoo &amp; conditioner bars crafted to COSMOS standards
                with botanicals inspired by sunlit coasts — rosemary, lemon,
                cedar &amp; fig.
              </p>

              <button
                ref={ctaRef}
                onClick={scrollDown}
                {...(isTouch
                  ? {
                      onPointerDown: handlePointerDown,
                      onPointerUp: handlePointerEnd,
                      onPointerMove: handlePointerMove,
                      onPointerCancel: handlePointerEnd,
                    }
                  : {})}
                aria-label="Scroll to next section"
                data-show-arrow={showArrow ? "true" : undefined}
                data-long={isLongPress ? "true" : undefined}
                style={{
                  WebkitTouchCallout: "none",
                  WebkitUserSelect: "none",
                  userSelect: "none",
                  touchAction: "none",
                  ...(pressing ? { animation: "pressGrow 1600ms cubic-bezier(.22,1,.36,1) forwards" } : {}),
                }}
                onContextMenu={(e) => e.preventDefault()}
                className={`group relative mt-10 inline-flex items-center justify-center
                  h-14 w-14 rounded-full
                  ring-1 ring-white/30 hover:ring-white/60
                  bg-white/10 hover:bg-white/10
                  backdrop-blur-[3px]
                  transition-transform duration-[900ms] ease-[cubic-bezier(.19,1,.22,1)]
                  will-change-transform
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80
                  before:content-[''] before:absolute before:-inset-4 before:rounded-full before:bg-transparent before:-z-10
                  ${isLongPress ? "ring-2 ring-white/60" : ""}
                  ${!pressing ? "animate-[pulse-smooth_2.6s_ease-in-out_infinite]" : "animate-none"}
                `}
              >
                {/* Soft glowing dot */}
                <div
                  className={`
                    relative h-2.5 w-2.5 rounded-full bg-white/95
                    shadow-[0_0_8px_rgba(255,255,255,0.6)]
                    transition-opacity duration-300
                    ${(!isLongPress && showArrow) ? "opacity-0" : "opacity-100"}
                    group-hover:opacity-0
                  `}
                  style={pressing ? { animation: "dotGrow 1600ms cubic-bezier(.22,1,.36,1) forwards" } : {}}
                />
                {/* Chevron */}
                <svg
                  width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"
                  className={`absolute z-10 transition-all duration-500
                    ${(!isLongPress && showArrow) ? "opacity-100 translate-y-[2px]" : "opacity-0"}
                    group-hover:opacity-100 group-hover:translate-y-[2px]`}
                >
                  <path d="M6 9.5 L12 15.5 L18 9.5" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* (NEW) 3px underlap to prevent any seam at narrow widths */}
          <div className="pointer-events-none absolute -bottom-[3px] left-0 right-0 h-[6px] bg-[#004642]/20" />
        </div>
      </section>

      {/* ===================== PRODUCT SPOTLIGHT ===================== */}
      <section
        id="spotlight"
        className="
          relative z-10 isolate overflow-hidden py-16 sm:py-20
          -mt-4 sm:-mt-5 lg:-mt-6
          rounded-t-[32px] sm:rounded-t-[40px]
          shadow-[0_-12px_30px_-12px_rgba(140,154,145,0.28)]
          bg-[#f6fbf9]
          border-t border-[#8C9A91]/30
        "
      >
        <div className="pointer-events-none absolute inset-0 -z-10 shadow-[0_40px_120px_-40px_rgba(140,154,145,0.35)]" />
        <div className="absolute -top-6 left-0 w-full h-6 pointer-events-none bg-gradient-to-b from-black/20 to-transparent opacity-40" />
        <div className="absolute inset-0 bg-[#004642]/5" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-transparent mix-blend-overlay pointer-events-none" />

        <div className="relative mx-auto max-w-screen-xl px-6 lg:px-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="flex justify-center md:justify-start">
            <img
              src="https://cdn.voskopulence.com/Spotlight_pic.png"
              alt="Mediterranean Rosemary Bar"
              className="w-72 sm:w-80 lg:w-96 h-auto drop-shadow-xl rounded-2xl"
            />
          </div>

          <div className="text-center md:text-left">
            <p className="uppercase tracking-[0.25em] text-sm text-neutral-600">Spotlight</p>
            <h3 className="mt-3 heading-script text-3xl sm:text-4xl text-[#004642]">
              Mediterranean Rosemary Bar
            </h3>
            <p className="mt-4 text-neutral-700 max-w-md mx-auto md:mx-0">
              Solid shampoo crafted to COSMOS standards with rosemary and mint. Clean, concentrated, travel-ready.
            </p>

            <div className="mt-6 flex items-center gap-3 justify-center md:justify-start">
              <a
                href="/shop"
                className="inline-flex items-center gap-3 rounded-full border-2 border-[#004642]
                           px-7 py-3 text-[#004642] text-[1.05rem] font-semibold tracking-[0.04em]
                           whitespace-nowrap hover:bg-[#004642] hover:text-white transition-all duration-300
                           shadow-[0_0_10px_rgba(140,154,145,0.35)] hover:shadow-[0_0_16px_rgba(140,154,145,0.5)]
                           ring-1 ring-[#8C9A91]/30 hover:ring-[#8C9A91]/50 hover:[transform:translateY(-1px)]
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C9A91]/60"
              >
                <span>Discover the bar</span>
                <svg width="22" height="22" viewBox="0 0 24 24" className="transition-transform duration-300 group-hover:translate-x-[2.5px]" strokeWidth="2.2">
                  <path d="M4 12H20M15 7L20 12L15 17" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>

              <a href="#about" className="text-sm text-neutral-600 hover:text-neutral-800 underline underline-offset-4">
                Learn about the formula
              </a>
            </div>

            <div className="mt-4 text-xs text-neutral-500">
              COSMOS-standard • Vegan & Cruelty-Free • 40+ washes
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute -bottom-[2px] left-0 right-0 h-[4px] bg-white" />
      </section>

      {/* ===================== ABOUT ===================== */}
      <section
        id="about"
        className="
          relative z-20 isolate overflow-hidden
          min-h-[80vh] scroll-mt-24
          pt-[64px] md:pt-[72px] lg:pt-[80px]
          -mt-7 sm:-mt-9 lg:-mt-11
          rounded-t-[32px] sm:rounded-t-[40px]
          shadow-[0_-12px_30px_-12px_rgba(140,154,145,0.28)]
          border-t border-[#8C9A91]/25
          bg-transparent
        "
      >
        <div className="pointer-events-none absolute inset-0 -z-10 shadow-[0_50px_140px_-50px_rgba(140,154,145,0.4)]" />
        <div className="absolute -top-6 left-0 w-full h-6 pointer-events-none bg-gradient-to-b from-black/20 to-transparent opacity-40" />

        <div className="absolute inset-0 z-0">
          <img
            src={asset("/about-visual.jpg")}
            alt="Mediterranean terrace"
            className="h-full w-full object-cover"
            style={{ objectPosition: "right center" }}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#00000080] via-[#00000060] to-[#00000040]" />

        <div className="relative z-10 mx-auto max-w-screen-2xl px-6 lg:px-10 py-28 md:py-32">
          <h2
            className="heading-script text-4xl sm:text-5xl mb-6 md:drop-shadow-[0_-12px_30px_-12px_rgba(140,154,145,0.28)]"
            style={{ color: "white", fontWeight: 400 }}
          >
            About us
          </h2>
          <p
            className="text-sans max-w-3xl text-lg leading-relaxed md:drop-shadow-[0_-12px_30px_-12px_rgba(140,154,145,0.28)]"
            style={{ color: "rgba(255,255,255,0.95)", fontWeight: 300 }}
          >
            Founded in 2024, Voskopulence emerged from a deep passion for creating organic, eco-conscious, and luxurious hair care solutions. Our exclusive shampoo and conditioner bars are thoughtfully crafted with naturally-derived ingredients inspired by the rich, natural bounty of the Mediterranean. Each formula is palm-oil-free, vegan, and cruelty-free, bringing you closer to nature while honoring ethical beauty. Each bar echoes the timeless beauty and serenity of the Mediterranean Sea. At Voskopulence, we are committed to offering a sophisticated hair-care experience that nurtures your hair while embracing the essence of sustainable living.
          </p>
        </div>
      </section>

      {/* Keyframes for the build-up press (scoped to this page) */}
      <style jsx>{`
        @keyframes pressGrow { from { transform: scale(1); } to { transform: scale(1.4); } }
        @keyframes dotGrow   { from { transform: scale(1); } to { transform: scale(1.6); } }
      `}</style>
    </div>
  );
}
