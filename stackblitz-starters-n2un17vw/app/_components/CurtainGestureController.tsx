"use client";

import { useEffect } from "react";

const CLOSE_DISTANCE = 72;
const CLOSE_RATIO = 0.18;
const CLOSE_VELOCITY = 0.45;
const EXIT_MS = 280;

export default function CurtainGestureController() {
  useEffect(() => {
    let active = false;
    let pointerId: number | null = null;
    let startX = 0;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let panel: HTMLElement | null = null;
    let menuRoot: HTMLElement | null = null;
    let backdrop: HTMLElement | null = null;

    const reset = () => {
      active = false;
      pointerId = null;
      panel = null;
      menuRoot = null;
      backdrop = null;
      velocity = 0;
    };

    const releasePageInteraction = (root: HTMLElement | null) => {
      if (root) root.style.pointerEvents = "none";

      const docEl = document.documentElement;
      const body = document.body;
      body.dataset.curtainGestureReleased = "true";

      const lockedY =
        body.style.position === "fixed"
          ? Math.abs(parseInt(body.style.top || "0", 10)) || window.scrollY
          : window.scrollY;

      docEl.style.overflow = "";
      docEl.style.height = "";
      body.style.overflow = "";
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      window.scrollTo(0, lockedY);
    };

    const stripIds = (root: Element) => {
      root.removeAttribute("id");
      root.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    };

    const makeExitGhost = (
      currentPanel: HTMLElement,
      currentBackdrop: HTMLElement | null,
      direction: number
    ) => {
      // Clone only the moving panel, not the whole React menu tree. Cloning the
      // entire curtain at pointer-up was expensive enough to hitch iOS Safari.
      const ghostRoot = document.createElement("div");
      Object.assign(ghostRoot.style, {
        position: "fixed",
        inset: "0",
        zIndex: "13000",
        pointerEvents: "none",
        overflow: "hidden",
        contain: "strict",
      });
      ghostRoot.setAttribute("aria-hidden", "true");

      const ghostBackdrop = document.createElement("div");
      Object.assign(ghostBackdrop.style, {
        position: "absolute",
        inset: "0",
        background: "rgba(0,70,66,0.70)",
        opacity: currentBackdrop?.style.opacity || "1",
        transition: "none",
      });

      const ghostPanel = currentPanel.cloneNode(true) as HTMLElement;
      stripIds(ghostPanel);
      ghostPanel.style.pointerEvents = "none";
      ghostPanel.style.transform =
        currentPanel.style.transform || "translate3d(0,0,0)";
      ghostPanel.style.transition = "none";
      ghostPanel.style.willChange = "transform";
      ghostPanel.style.backfaceVisibility = "hidden";
      ghostPanel.style.setProperty("-webkit-backface-visibility", "hidden");

      ghostRoot.appendChild(ghostBackdrop);
      ghostRoot.appendChild(ghostPanel);
      document.body.appendChild(ghostRoot);

      requestAnimationFrame(() => {
        ghostPanel.style.transition =
          `transform ${EXIT_MS}ms cubic-bezier(.22,1,.36,1)`;
        ghostBackdrop.style.transition = "opacity 210ms ease";
        ghostPanel.style.transform = `translate3d(${direction * 105}%,0,0)`;
        ghostBackdrop.style.opacity = "0";
      });

      window.setTimeout(() => ghostRoot.remove(), EXIT_MS + 60);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return;
      const target = event.target as Element | null;
      const nextPanel = target?.closest?.("#curtain-panel") as HTMLElement | null;
      if (!nextPanel) return;

      active = true;
      pointerId = event.pointerId;
      panel = nextPanel;
      menuRoot = nextPanel.closest("#mobile-menu") as HTMLElement | null;
      backdrop = menuRoot?.querySelector(":scope > button") as HTMLElement | null;
      startX = event.clientX;
      lastX = event.clientX;
      lastTime = performance.now();
      velocity = 0;

      if (menuRoot) {
        delete menuRoot.dataset.gestureClosing;
        menuRoot.style.pointerEvents = "";
      }

      panel.style.transition = "none";
      panel.style.willChange = "transform";

      if (backdrop) {
        backdrop.style.setProperty("-webkit-backdrop-filter", "none");
        backdrop.style.setProperty("backdrop-filter", "none");
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!active || event.pointerId !== pointerId || !panel) return;

      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      const instantaneous = (event.clientX - lastX) / dt;
      velocity = velocity * 0.75 + instantaneous * 0.25;
      lastX = event.clientX;
      lastTime = now;

      const dx = event.clientX - startX;
      const width = Math.max(1, panel.getBoundingClientRect().width);
      const translated = Math.sign(dx) * Math.min(Math.abs(dx), width);
      const progress = Math.min(1, Math.abs(translated) / width);

      panel.style.transform = `translate3d(${translated}px,0,0)`;
      if (backdrop) backdrop.style.opacity = String(1 - progress * 0.5);
    };

    const finish = (event: PointerEvent, cancelled = false) => {
      if (!active || event.pointerId !== pointerId || !panel) return;

      const currentPanel = panel;
      const currentMenuRoot = menuRoot;
      const currentBackdrop = backdrop;
      const dx = event.clientX - startX;
      const width = Math.max(1, currentPanel.getBoundingClientRect().width);
      const threshold = Math.max(CLOSE_DISTANCE, width * CLOSE_RATIO);
      const shouldClose =
        !cancelled &&
        (Math.abs(dx) >= threshold || Math.abs(velocity) >= CLOSE_VELOCITY);

      if (shouldClose) {
        const direction = dx === 0 ? 1 : Math.sign(dx);

        if (currentMenuRoot) currentMenuRoot.dataset.gestureClosing = "true";

        // The lightweight ghost is created before unlocking so it begins from
        // exactly the finger-release frame, then the live menu is removed.
        makeExitGhost(currentPanel, currentBackdrop, direction);
        releasePageInteraction(currentMenuRoot);

        // The backdrop button is already the route's canonical close action,
        // so this is language-independent and cannot fail on Swedish labels.
        (currentBackdrop as HTMLButtonElement | null)?.click();
      } else {
        currentPanel.style.transition =
          "transform 280ms cubic-bezier(.22,1,.36,1)";
        currentPanel.style.transform = "translate3d(0,0,0)";

        if (currentBackdrop) {
          currentBackdrop.style.transition = "opacity 210ms ease";
          currentBackdrop.style.opacity = "1";
          window.setTimeout(() => {
            currentBackdrop.style.removeProperty("-webkit-backdrop-filter");
            currentBackdrop.style.removeProperty("backdrop-filter");
          }, 300);
        }
      }

      window.setTimeout(() => {
        currentPanel.style.willChange = "auto";
      }, 320);
      reset();
    };

    const onPointerUp = (event: PointerEvent) => finish(event, false);
    const onPointerCancel = (event: PointerEvent) => finish(event, true);

    const suppressLegacyTouch = (event: TouchEvent) => {
      const target = event.target as Element | null;
      if (target?.closest?.("#curtain-panel")) event.stopPropagation();
    };

    const onLanguageClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const link = target?.closest?.('a[lang="sv"], a[lang="en"]') as HTMLAnchorElement | null;
      if (!link) return;
      const next = link.getAttribute("lang");
      if (next === "sv" || next === "en") {
        window.localStorage.setItem("voskopulence-language", next);
      }
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("pointerup", onPointerUp, true);
    document.addEventListener("pointercancel", onPointerCancel, true);
    document.addEventListener("touchstart", suppressLegacyTouch, true);
    document.addEventListener("touchmove", suppressLegacyTouch, true);
    document.addEventListener("touchend", suppressLegacyTouch, true);
    document.addEventListener("touchcancel", suppressLegacyTouch, true);
    document.addEventListener("click", onLanguageClick, true);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointermove", onPointerMove, true);
      document.removeEventListener("pointerup", onPointerUp, true);
      document.removeEventListener("pointercancel", onPointerCancel, true);
      document.removeEventListener("touchstart", suppressLegacyTouch, true);
      document.removeEventListener("touchmove", suppressLegacyTouch, true);
      document.removeEventListener("touchend", suppressLegacyTouch, true);
      document.removeEventListener("touchcancel", suppressLegacyTouch, true);
      document.removeEventListener("click", onLanguageClick, true);
    };
  }, []);

  return null;
}
