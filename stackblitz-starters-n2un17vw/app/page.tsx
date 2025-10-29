"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// All assets live at CDN root:
const ASSETS = "https://cdn.voskopulence.com";
const asset = (p: string) => `${ASSETS}${p}`;

const CAP_PX = 5;            // iOS cap
const PROG_DISTANCE = 120;   // px of scroll to reach full header state
const EASE = 0.12;           // smoothing factor for lerp

// Gate touch-only handlers (desktop uses simple click)
const isTouch =
  typeof window !== "undefined" && matchMedia("(hover: none)").matches;

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
    return () => { try { document.body.removeChild(s); } catch {} };
  }, []);
  return null;
}

/* ---------- Robust scroll lock (no jump) ---------- */
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

  const top = body.style.top;                // read before clear
  const y = top ? -parseInt(top || "0", 10) : 0;

  // clear styles first
  docEl.style.overflow = "";
  docEl.style.height = "";
  body.style.overflow = "";
  body.style.position = "";
  body.style.top = "";
  body.style.left = "";
  body.style.right = "";
  body.style.width = "";

  // restore scroll on next frame for stability on iOS/Safari
  requestAnimationFrame(() => {
    window.scrollTo(0, y || scrollYRef.current || 0);
  });
}

export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<any>(null);

  const [menuOpen, setMenuOpen] = useState(false);

  // For header portal
  const [hdrReady, setHdrReady] = useState(false);
  useEffect(() => setHdrReady(true), []);

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

  // --- CTA morph+drift animation (smooth & springy) ---
type CtaAnim = {
  // live values (what we render)
  x: number; y: number; sx: number; sy: number;
  // targets (where we want to go)
  tx: number; ty: number; tsx: number; tsy: number;
  raf: number | null; pressing: boolean;
};
const ctaAnim = useRef<CtaAnim>({
  x: 0, y: 0, sx: 1, sy: 1,
  tx: 0, ty: 0, tsx: 1, tsy: 1,
  raf: null, pressing: false,
});

const CTA_DRIFT_MAX = 18;   // px drift
const CTA_SQUISH_MAX = 1.25; // up to 1.25x along drag axis
const CTA_EASE = 0.18;      // smoothing (lower = smoother)
const CTA_RETURN_EASE = 0.14;

const startCtaRaf = () => {
  if (ctaAnim.current.raf != null) return;
  const tick = () => {
    const a = ctaAnim.current;
    const ease = a.pressing ? CTA_EASE : CTA_RETURN_EASE;
    a.x += (a.tx - a.x) * ease;
    a.y += (a.ty - a.y) * ease;
    a.sx += (a.tsx - a.sx) * ease;
    a.sy += (a.tsy - a.sy) * ease;

    // paint to element using CSS vars (no layout thrash)
    const btn = ctaRef.current;
    if (btn) {
      btn.style.setProperty("--cta-x", `${a.x.toFixed(2)}px`);
      btn.style.setProperty("--cta-y", `${a.y.toFixed(2)}px`);
      btn.style.setProperty("--cta-sx", a.sx.toFixed(3));
      btn.style.setProperty("--cta-sy", a.sy.toFixed(3));
    }

    // keep animating while moving
    if (
      Math.abs(a.tx - a.x) > 0.05 ||
      Math.abs(a.ty - a.y) > 0.05 ||
      Math.abs(a.tsx - a.sx) > 0.005 ||
      Math.abs(a.tsy - a.sy) > 0.005
    ) {
      a.raf = requestAnimationFrame(tick);
    } else {
      a.raf = null;
    }
  };
  ctaAnim.current.raf = requestAnimationFrame(tick);
};

const setCtaTarget = (tx: number, ty: number, tsx: number, tsy: number) => {
  const a = ctaAnim.current;
  a.tx = tx; a.ty = ty; a.tsx = tsx; a.tsy = tsy;
  startCtaRaf();
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/** Map pointer delta to drift + oval squish */
const updateCtaFromDelta = (dx: number, dy: number) => {
  // clamp drift
  const ddx = clamp(dx, -CTA_DRIFT_MAX, CTA_DRIFT_MAX);
  const ddy = clamp(dy, -CTA_DRIFT_MAX, CTA_DRIFT_MAX);

  // compute stretch along dominant axis
  const ax = Math.abs(ddx);
  const ay = Math.abs(ddy);
  const alongX = ax >= ay;

  const ratio = clamp((alongX ? ax : ay) / CTA_DRIFT_MAX, 0, 1);
  const boost = 1 + CTA_SQUISH_MAX * ratio;      // up to 1.25
  const shrink = 1 - CTA_SQUISH_MAX * 0.5 * ratio; // slight squish on the other axis

  const sx = alongX ? boost : shrink;
  const sy = alongX ? shrink : boost;

  setCtaTarget(ddx, ddy, sx, sy);
};

const handlePointerDown: React.PointerEventHandler<HTMLButtonElement> = (e) => {
  if (e.pointerType === "mouse") return; // keep as touch-only
  startPos.current = { x: e.clientX, y: e.clientY };
  setPressing(true);
  setShowArrow(true);
  ctaAnim.current.pressing = true;
  // tiny “engage” squish
  setCtaTarget(0, 0, 1.06, 0.94);

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

  // cancel long press if user moves a lot
  if (Math.hypot(dx, dy) > 24 && longTimer.current) {
    clearTimeout(longTimer.current);
    longTimer.current = null;
  }

  // update drift + squish while pressing
  if (pressing) updateCtaFromDelta(dx, dy);
};

const handlePointerEnd: React.PointerEventHandler<HTMLButtonElement> = () => {
  if (longTimer.current) { clearTimeout(longTimer.current); longTimer.current = null; }

  // release: spring back to center & circle
  ctaAnim.current.pressing = false;
  setCtaTarget(0, 0, 1, 1);

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

  // === Ultra-smooth header progress ===
  useEffect(() => {
    const root = document.documentElement;
    let target = 0;
    let prog = 0;
    let raf: number | null = null;

    const clamp01 = (x: number) => x < 0 ? 0 : x > 1 ? 1 : x;

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

  // Smooth scroll to first next section
  const scrollDown = () => {
    const targets = ["spotlight", "about"];
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    for (const id of targets) {
      const el = document.getElementById(id);
      if (!el) continue;
      const top = el.getBoundingClientRect().top;
      if (top > 80) {
        const yOffset = window.innerWidth < 640 ? -window.innerHeight * 0.12 : -window.innerHeight * 0.25;
        const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
        return;
      }
    }
    document.getElementById("about")
      ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  /* ---------- Lock page scroll when curtain is open ---------- */
  useEffect(() => {
    if (menuOpen) lockScroll();
    else unlockScroll();
    return () => unlockScroll();
  }, [menuOpen]);

  // fixes seams by giving us 1 physical pixel to overlap with
  useEffect(() => {
    const dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));
    document.documentElement.style.setProperty("--hairline", `${1 / dpr}px`);
  }, []);

  // Unified helper: quiet attempt to play
  const tryPlay = (el: HTMLVideoElement | null) => {
    if (!el) return;
    el.muted = true;
    // @ts-ignore
    el.setAttribute("webkit-playsinline", "true");
    el.setAttribute("playsinline", "true");
    const p = el.play?.();
    if (p && typeof p.catch === "function") p.catch(() => {});
  };

  // --- Video setup (HLS with MP4 fallback) ---
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const HLS_SRC = asset("/hero_hls/master.m3u8");
    const HLS_SRC_IOS_1080 = asset("/hero_hls/1080_only.m3u8");
    const MP4_SRC = asset("/hero_web.mp4");
    const POSTER = asset("/hero_poster.jpg");

    v.poster = POSTER;

    const revealPoster = () => { v.style.opacity = "1"; };
    v.addEventListener("loadeddata", revealPoster, { once: true } as any);

    let destroyed = false;

    const setup = async () => {
      const ua = navigator.userAgent || "";
      const isiOS =
        /iP(hone|od|ad)/.test(navigator.platform) ||
        (/\bMac\b/.test(ua) && "ontouchend" in document);

      const isSafariDesktop =
        /^((?!chrome|android|edg).)*safari/i.test(ua) && !isiOS;

      if (isSafariDesktop) {
        v.src = MP4_SRC;
        try { v.load(); } catch {}
        tryPlay(v);
        return;
      }

      if (isiOS) {
        let loaded = false;
        const onLoadedData = () => { loaded = true; };
        const onError = () => {
          if (!loaded) {
            v.removeEventListener("loadeddata", onLoadedData);
            v.src = MP4_SRC;
            try { v.load(); } catch {}
            tryPlay(v);
          }
        };

        v.addEventListener("loadeddata", onLoadedData, { once: true } as any);
        v.addEventListener("error", onError, { once: true } as any);
        v.src = HLS_SRC_IOS_1080;
        try { v.load(); } catch {}
        tryPlay(v);

        setTimeout(() => { if (!loaded && v.currentSrc === HLS_SRC_IOS_1080) onError(); }, 2000);
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
          // @ts-expect-error
          hls.config.maxInitialBitrate = 2_500_000;

          hlsRef.current = hls;
          hls.attachMedia(v);
          hls.on(Hls.Events.MEDIA_ATTACHED, () => { if (!destroyed) hls.loadSource(HLS_SRC); });
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            try {
              if (hls.levels?.length) {
                const lvls = hls.levels;
                let pick = lvls.findIndex((l: any) => (l.height ?? 0) >= 1080);
                if (pick < 0) pick = lvls.findIndex((l: any) => /1080/i.test(l.name ?? ""));
                if (pick < 0) pick = lvls.length - 1;
                hls.currentLevel = pick;
                setTimeout(() => { hls.loadLevel = -1; }, 3000);
              }
            } catch {}
            tryPlay(v);
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

    const onPlaying = () => { v.style.opacity = "1"; };
    v.addEventListener("playing", onPlaying);

    const onVis = () => document.visibilityState === "visible" ? tryPlay(v) : v.pause();
    document.addEventListener("visibilitychange", onVis);

    const io = new IntersectionObserver(
      ([e]) => {
        if (menuOpenRef.current) { tryPlay(v); return; }
        if (e.intersectionRatio > 0.03) tryPlay(v); else v.pause();
      },
      { threshold: [0, 0.03, 0.1, 0.25, 0.5, 1] }
    );
    io.observe(v);

    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("playing", onPlaying);
      document.removeEventListener("visibilitychange", onVis);
      io.disconnect();
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch {}
        hlsRef.current = null;
      }
    };
  }, []);

  // One small autoplay nudge + poster safety
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.setAttribute("playsinline", "true");
    // @ts-ignore
    v.setAttribute("webkit-playsinline", "true");
    const tryOnce = () => v.play().catch(() => {});
    if (v.readyState >= 2) tryOnce();
    else {
      const onCanPlay = () => { tryOnce(); v.removeEventListener("canplay", onCanPlay); };
      v.addEventListener("canplay", onCanPlay);
    }
    const t = setTimeout(() => v.classList.add("opacity-100"), 1200);
    return () => clearTimeout(t);
  }, []);

  // Cap is only needed on phones; on desktop it should be 0
  const [capPx, setCapPx] = useState<number>(0);
  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isIOS =
      /iP(hone|od|ad)/.test(ua) || (/\bMac\b/.test(ua) && "ontouchend" in window);
    setCapPx(isIOS ? 5 : 0);
    const onResize = () => setCapPx(isIOS ? 5 : 0);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Stronger Safari fixed-header nudge (kept)
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
    const onVis = () => { if (document.visibilityState === "visible") nudge(); };
    const onOri = () => nudge();
    const vv = (window as any).visualViewport;
    const onVV = () => nudge();

    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("orientationchange", onOri);
    vv?.addEventListener?.("resize", onVV);
    vv?.addEventListener?.("scroll", onVV);

    setTimeout(nudge, 0);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("orientationchange", onOri);
      vv?.removeEventListener?.("resize", onVV);
      vv?.removeEventListener?.("scroll", onVV);
    };
  }, []);

  /* ---------- SiteHeader (reads CSS vars for buttery transitions) ---------- */
  function SiteHeader({ capPx }: { capPx: number }) {
    const hasCap = (capPx ?? 0) > 0;

    return (
      <header
        className="fixed inset-x-0 top-0 z-[9999] text-white/95"
        style={{
          ["--cap" as any]: `${capPx}px`,
          ["--bleed" as any]: capPx > 0 ? "calc(var(--cap) + var(--hairline,1px))" : "var(--cap)",
          paddingTop: "calc(var(--cap) + env(safe-area-inset-top, 0px))",
          transform: "translateZ(0)",
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
        }}
      >
        {/* Background layer driven by --hdrProg */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backdropFilter: "blur(calc(var(--hdrProg, 0) * 12px)) saturate(calc(1 + var(--hdrProg, 0) * 0.5))",
            WebkitBackdropFilter: "blur(calc(var(--hdrProg, 0) * 12px)) saturate(calc(1 + var(--hdrProg, 0) * 0.5))",
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
            transition: "backdrop-filter 120ms linear, -webkit-backdrop-filter 120ms linear",
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 7h16M4 12h16M4 17h16" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Center: logo (scale by --hdrProg) */}
          <div
            className="absolute left-1/2 top-1/2 pointer-events-none"
            style={{
              transform: "translate3d(-50%, -50%, 0) scale(calc(1 - var(--hdrProg, 0) * 0.04))",
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
              style={{ transform: "translateZ(0)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
            />
          </div>

          {/* Right: nav */}
          <nav className="grow basis-0 hidden lg:flex justify-end items-center gap-6 text-sm lg:text-base relative z-[1]">
            <a href="/shop" className="hover:text-gray-200">Shop</a>
            <a href="#about" className="hover:text-gray-200">About</a>
            <a href="/sustainability" className="hover:text-gray-200">Sustainability</a>
            <a href="/contact" className="hover:text-gray-200">Contact</a>
          </nav>
        </div>
      </header>
    );
  }

  /* ---------- Curtain: LEFT → RIGHT, smooth, no jump ---------- */

  // Horizontal swipe handlers
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

    // Only handle rightward drags (closing)
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

    panel.style.transition = "transform 420ms cubic-bezier(.22,1,.36,1)";
    panel.style.transform = shouldClose ? "translateX(100%)" : "translateX(0%)";

    if (shouldClose) setTimeout(() => setMenuOpen(false), 360);
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col scroll-smooth">
      <TopSentinel />

      {/* === Header Portal === */}
      {hdrReady
        ? createPortal(<SiteHeader capPx={capPx} />, document.body)
        : <SiteHeader capPx={capPx} />}

      {/* ===== Mobile curtain (portal) — mounted ONLY when open ===== */}
      {mounted && typeof document !== "undefined" && menuOpen && createPortal(
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
              transition: "opacity 420ms cubic-bezier(.22,1,.36,1)",
            }}
            onClick={() => setMenuOpen(false)}
          />

          {/* Sliding panel from LEFT */}
          <div
            id="curtain-panel"
            className="absolute inset-y-0 left-0 right-0 z-[12001] flex flex-col text-white"
            style={{
              transform: "translateX(0%)",
              transition: "transform 460ms cubic-bezier(.22,1,.36,1)",
              paddingTop: "env(safe-area-inset-top)",
              paddingBottom: "env(safe-area-inset-bottom)",
              willChange: "transform",
              transformOrigin: "left center",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
            onTouchStart={(e) => startSwipeX(e)}
            onTouchMove={(e) => moveSwipeX(e)}
            onTouchEnd={() => endSwipeX()}
          >
            {/* Top row */}
            <div className="flex items-center justify-between h-[64px] px-5 shrink-0">
              <span className="font-semibold text-white/95">Menu</span>
              <button
                type="button"
                aria-label="Close menu"
                className="p-2 rounded-md hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                onClick={() => setMenuOpen(false)}
                style={{ position: "relative", zIndex: 1 }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 6L6 18M6 6l12 12" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Links */}
            <nav className="grow grid place-items-center">
              <ul className="flex flex-col items-center gap-8 text-[1.25rem] font-light tracking-wide">
                <li><a href="/shop" onClick={() => setMenuOpen(false)} className="hover:text-gray-200">Shop</a></li>
                <li><a href="#about" onClick={() => setMenuOpen(false)} className="hover:text-gray-200">About</a></li>
                <li><a href="/sustainability" onClick={() => setMenuOpen(false)} className="hover:text-gray-200">Sustainability</a></li>
                <li><a href="/contact" onClick={() => setMenuOpen(false)} className="hover:text-gray-200">Contact</a></li>
              </ul>
            </nav>
          </div>
        </div>,
        document.body
      )}

      {/* ===================== HERO ===================== */}
      <section className="relative z-0 w-full overflow-visible">
        <div className="relative h-[96dvh] md:h-[96dvh] lg:h-[96dvh]">
          {/* 12px taller wrapper prevents seams */}
          <div className="absolute inset-x-0 top-0 -bottom-[16px]">
            {/* instant static background before video loads */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${asset("/hero_poster.jpg")})`, filter: "brightness(0.9)" }}
            />

            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-[800ms]"
              poster={asset("/hero_poster.jpg")}
              autoPlay
              muted
              playsInline
              loop
              preload="auto"
              aria-hidden="true"
              disablePictureInPicture
              controlsList="nodownload noplaybackrate"
              onLoadedData={(e) => { e.currentTarget.classList.add("opacity-100"); }}
              onPlay={(e) => { e.currentTarget.classList.add("opacity-100"); }}
              onError={() => { videoRef.current?.classList.add("opacity-100"); }}
              style={{ willChange: "opacity", transform: "translateZ(0)" }}
            >
              {/* WEBM then MP4 (H.264) */}
              <source src={asset("/hero_web.webm")} type="video/webm" />
              <source src={asset("/hero_web.mp4")} type="video/mp4; codecs=avc1" />
            </video>

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
        onPointerCancel={handlePointerEnd},
        onPointerLeave={handlePointerEnd},
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
    ...(pressing
      ? { animation: "pressGrow 1600ms cubic-bezier(.22,1,.36,1) forwards" }
      : {}),
    // 🔽 new: live morph + drift driven by CSS vars set in JS
    transform: `
      translate3d(var(--cta-x,0), var(--cta-y,0), 0)
      scale(var(--cta-sx,1), var(--cta-sy,1))
    `,
    willChange: "transform",
  }}
  onContextMenu={(e) => e.preventDefault()}
  className={`group relative mt-10 inline-flex items-center justify-center
    h-14 w-14 rounded-full
    ring-1 ring-white/30 hover:ring-white/60
    bg-white/10 hover:bg-white/10
    backdrop-blur-[3px]
    /* smoother because rAF drives motion; keep tiny fallback transition */
    transition-[transform] duration-[120ms] ease-linear
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
      ${!isLongPress && showArrow ? "opacity-0" : "opacity-100"}
      group-hover:opacity-0
    `}
    style={pressing ? { animation: "dotGrow 1600ms cubic-bezier(.22,1,.36,1) forwards" } : {}}
  />
  {/* Chevron */}
  <svg
    width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"
    className={`absolute z-10 transition-all duration-500
      ${!isLongPress && showArrow ? "opacity-100 translate-y-[2px]" : "opacity-0"}
      group-hover:opacity-100 group-hover:translate-y-[2px]`}
  >
    <path d="M6 9.5 L12 15.5 L18 9.5" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
</button>
            </div>
          </div>

          {/* 3px underlap to prevent any seam at narrow widths */}
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
            <h3 className="mt-3 heading-script text-3xl sm:text-4xl text-[#004642]">Mediterranean Rosemary Bar</h3>
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

            <div className="mt-4 text-xs text-neutral-500">COSMOS-standard • Vegan & Cruelty-Free • 40+ washes</div>
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
            Founded in 2024, Voskopulence emerged from a deep passion for creating
            organic, eco-conscious, and luxurious hair care solutions. Our exclusive
            shampoo and conditioner bars are thoughtfully crafted with naturally-derived
            ingredients inspired by the rich, natural bounty of the Mediterranean. Each
            formula is palm-oil-free, vegan, and cruelty-free, bringing you closer to
            nature while honoring ethical beauty. Each bar echoes the timeless beauty and
            serenity of the Mediterranean Sea. At Voskopulence, we are committed to
            offering a sophisticated hair-care experience that nurtures your hair while
            embracing the essence of sustainable living.
          </p>
        </div>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes pressGrow { from { transform: scale(1); } to { transform: scale(1.4); } }
@keyframes dotGrow   { from { transform: scale(1); } to { transform: scale(1.6); } }

/* Reduce tap highlight + improve feel on curtain */
#mobile-menu, #curtain-panel, #curtain-panel * {
  -webkit-tap-highlight-color: transparent;
}

/* Extra smooth motion */
@media (prefers-reduced-motion: no-preference) {
  #curtain-panel { transition-timing-function: cubic-bezier(.22,1,.36,1); }
}
        `,
        }}
      />
    </div>
  );
}
