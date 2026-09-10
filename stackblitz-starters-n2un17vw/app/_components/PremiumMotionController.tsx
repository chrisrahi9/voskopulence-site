"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

export default function PremiumMotionController() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;

    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    )?.matches;

    let disposed = false;
    let scrollRaf: number | null = null;
    let settleRaf: number | null = null;
    let settleTimer: number | null = null;

    const originalScrollTo = window.scrollTo.bind(window);

    const premiumScrollTo = (
      xOrOptions?: number | ScrollToOptions,
      y?: number
    ) => {
      if (
        reduceMotion ||
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

      const duration = Math.min(720, Math.max(500, 500 + Math.abs(delta) * 0.07));
      const startTime = performance.now();

      const step = (now: number) => {
        if (disposed) return;
        const t = clamp01((now - startTime) / duration);
        const eased = easeOutQuart(t);
        originalScrollTo({
          top: startY + delta * eased,
          left: xOrOptions.left ?? 0,
        });

        if (t < 1) {
          scrollRaf = requestAnimationFrame(step);
        } else {
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

    const syncRoutePosition = () => {
      if (disposed) return;
      if (window.location.hash === "#about") {
        const target = document.getElementById("about");
        target?.scrollIntoView({ behavior: "auto", block: "start" });
      }
    };

    window.addEventListener("hashchange", syncRoutePosition, { passive: true });
    window.addEventListener("popstate", syncRoutePosition, { passive: true });

    settleRaf = requestAnimationFrame(() => {
      settleRaf = null;
      syncRoutePosition();
    });
    settleTimer = window.setTimeout(() => {
      settleTimer = null;
      syncRoutePosition();
    }, 140);

    const sections = Array.from(document.querySelectorAll<HTMLElement>("section"));
    const revealTargets = sections.slice(1);
    const revealed = new WeakSet<Element>();

    const revealObserver = reduceMotion
      ? null
      : new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting || revealed.has(entry.target)) continue;
              revealed.add(entry.target);
              revealObserver?.unobserve(entry.target);

              (entry.target as HTMLElement).animate(
                [
                  { opacity: 0.96, transform: "translate3d(0, 10px, 0)" },
                  { opacity: 1, transform: "translate3d(0, 0, 0)" },
                ],
                {
                  duration: 540,
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

    revealTargets.forEach((section) => revealObserver?.observe(section));

    return () => {
      disposed = true;
      window.scrollTo = originalScrollTo as typeof window.scrollTo;
      window.removeEventListener("hashchange", syncRoutePosition);
      window.removeEventListener("popstate", syncRoutePosition);
      if (scrollRaf !== null) cancelAnimationFrame(scrollRaf);
      if (settleRaf !== null) cancelAnimationFrame(settleRaf);
      if (settleTimer !== null) window.clearTimeout(settleTimer);
      revealObserver?.disconnect();
    };
  }, [pathname]);

  return null;
}
