"use client";

import { useEffect } from "react";

const CLOSE_DISTANCE = 72;
const CLOSE_RATIO = 0.18;
const CLOSE_VELOCITY = 0.45;

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
      // The curtain can keep finishing its visual exit, but it must stop
      // intercepting the next finger gesture immediately.
      if (root) root.style.pointerEvents = "none";

      // Mirror the page's iOS/non-iOS scroll unlock now instead of waiting for
      // React state to update at the end of the curtain animation.
      const body = document.body;
      if (body.style.position === "fixed") {
        const y = Math.abs(parseInt(body.style.top || "0", 10)) || 0;
        body.style.position = "";
        body.style.top = "";
        body.style.left = "";
        body.style.right = "";
        body.style.width = "";
        window.scrollTo(0, y);
      }
      body.style.overflow = "";
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

      // Backdrop-filter + a moving transformed text layer can produce a thin
      // compositor/tile seam on iOS. Keep the same green backdrop while the
      // finger is moving, but temporarily remove only the blur operation.
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

      currentPanel.style.transition =
        "transform 320ms cubic-bezier(.22,1,.36,1)";

      if (shouldClose) {
        const direction = dx === 0 ? 1 : Math.sign(dx);
        if (currentMenuRoot) currentMenuRoot.dataset.gestureClosing = "true";

        // Give interaction back to the document immediately. The curtain can
        // continue its 320ms visual exit without creating a dead touch window.
        releasePageInteraction(currentMenuRoot);

        currentPanel.style.transform = `translate3d(${direction * 105}%,0,0)`;
        if (currentBackdrop) {
          currentBackdrop.style.transition = "opacity 240ms ease";
          currentBackdrop.style.opacity = "0";
        }

        window.setTimeout(() => {
          // Swedish generation localises this aria-label, so support both
          // language variants. The data flag tells closeMenu that the swipe
          // has already animated the panel away and it should unmount directly.
          const closeButton = currentPanel.querySelector(
            'button[aria-label="Close menu"], button[aria-label="Stäng meny"]'
          ) as HTMLButtonElement | null;
          closeButton?.click();
        }, 300);
      } else {
        currentPanel.style.transform = "translate3d(0,0,0)";
        if (currentBackdrop) {
          currentBackdrop.style.transition = "opacity 240ms ease";
          currentBackdrop.style.opacity = "1";

          // Restore the normal blurred curtain only after the panel has settled,
          // keeping the blur out of the transformed swipe frames on iOS.
          window.setTimeout(() => {
            currentBackdrop.style.removeProperty("-webkit-backdrop-filter");
            currentBackdrop.style.removeProperty("backdrop-filter");
          }, 340);
        }
      }

      window.setTimeout(() => {
        currentPanel.style.willChange = "auto";
      }, 360);
      reset();
    };

    const onPointerUp = (event: PointerEvent) => finish(event, false);
    const onPointerCancel = (event: PointerEvent) => finish(event, true);

    // The original pages still contain legacy React touch handlers for the
    // curtain. Stop those touch events before they bubble into React so this
    // controller is the single owner of the panel transform during a swipe.
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
