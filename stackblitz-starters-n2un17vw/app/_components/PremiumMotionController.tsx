"use client";

import { useEffect } from "react";

const HEADER_DISTANCE = 120;
const HEADER_TAU_MS = 90;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

export default function PremiumMotionController() {
  useEffect(() => {
    if (window.location.pathname !== "/") return;

    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    )?.matches;
    if (reduceMotion) return;

    let disposed = false;
    let scrollRaf: number | null = null;
    let headerRaf: number | null = null;
    let headerLastTime = performance.now();
    let headerTarget = clamp01(window.scrollY / HEADER_DISTANCE);
    let headerProgress = headerTarget;

    const root = document.documentElement;
    const originalScrollTo = window.scrollTo.bind(window);

    const premiumScrollTo = (
      xOrOptions?: number | ScrollToOptions,
      y?: number
    ) => {
      if (
        typeof xOrOptions !== "object" ||
        xOrOptions === null ||
        xOrOptions.behavior !== "smooth" ||
        typeof xOrOptions.top !== "number"
      ) {
        if (typeof xOrOptions === "number") {
          originalScrollTo(xOrOptions, y ?? 0);
        } else if (xOrOptions) {
          originalScrollTo(xOrOptions);
        } else {
          originalScrollTo(0, 0);
        }
        return;
      }

      if (scrollRaf !== null) cancelAnimationFrame(scrollRaf);

      const startY = window.scrollY;
      const maxY = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const destination = Math.min(maxY, Math.max(0, xOrOptions.top));
      const delta = destination - startY;

      if (Math.abs(delta) < 1) {
        originalScrollTo({ top: destination, left: xOrOptions.left ?? 0 });
        return;
      }

      const duration = Math.min(760, Math.max(560, 560 + Math.abs(delta) * 0.08));
      const startTime = performance.now();

      const step = (now: number) => {
        if (disposed) return;
        const t = clamp01((now - startTime) / duration);
        const eased = easeOutQuart(t);
        originalScrollTo({
          top: startY + delta * eased,
          left: xOrOptions.left ?? 0,
        });

        if (t < 1) scrollRaf = requestAnimationFrame(step);
        else {
          scrollRaf = null;
          originalScrollTo({
            top: destination,
            left: xOrOptions.left ?? 0,
          });
        }
      };

      scrollRaf = requestAnimationFrame(step);
    };

    window.scrollTo = premiumScrollTo as typeof window.scrollTo;

    const writeHeaderProgress = () => {
      root.style.setProperty("--hdrProg", headerProgress.toFixed(4));
    };

    const headerTick = (now: number) => {
      if (disposed) return;
      const dt = Math.min(50, Math.max(0, now - headerLastTime));
      headerLastTime = now;
      const alpha = 1 - Math.exp(-dt / HEADER_TAU_MS);
      headerProgress += (headerTarget - headerProgress) * alpha;

      if (Math.abs(headerTarget - headerProgress) < 0.0005) {
        headerProgress = headerTarget;
      }

      writeHeaderProgress();

      if (headerProgress !== headerTarget) {
        headerRaf = requestAnimationFrame(headerTick);
      } else {
        headerRaf = null;
      }
    };

    const onScroll = () => {
      headerTarget = clamp01(window.scrollY / HEADER_DISTANCE);
      if (headerRaf === null) {
        headerLastTime = performance.now();
        headerRaf = requestAnimationFrame(headerTick);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    writeHeaderProgress();

    const sections = Array.from(document.querySelectorAll<HTMLElement>("section"));
    const revealTargets = sections.slice(1);
    const revealed = new WeakSet<Element>();

    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || revealed.has(entry.target)) continue;
          revealed.add(entry.target);
          revealObserver.unobserve(entry.target);

          const el = entry.target as HTMLElement;
          el.animate(
            [
              { opacity: 0.94, transform: "translate3d(0, 12px, 0)" },
              { opacity: 1, transform: "translate3d(0, 0, 0)" },
            ],
            {
              duration: 620,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              fill: "none",
            }
          );
        }
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -7% 0px",
      }
    );

    revealTargets.forEach((section) => revealObserver.observe(section));

    return () => {
      disposed = true;
      window.scrollTo = originalScrollTo as typeof window.scrollTo;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (scrollRaf !== null) cancelAnimationFrame(scrollRaf);
      if (headerRaf !== null) cancelAnimationFrame(headerRaf);
      revealObserver.disconnect();
    };
  }, []);

  return null;
}
