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
    let backdrop: HTMLElement | null = null;

    const reset = () => {
      active = false;
      pointerId = null;
      panel = null;
      backdrop = null;
      velocity = 0;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return;
      const target = event.target as Element | null;
      const nextPanel = target?.closest?.("#curtain-panel") as HTMLElement | null;
      if (!nextPanel) return;

      active = true;
      pointerId = event.pointerId;
      panel = nextPanel;
      backdrop = document.querySelector("#mobile-menu > button") as HTMLElement | null;
      startX = event.clientX;
      lastX = event.clientX;
      lastTime = performance.now();
      velocity = 0;
      panel.style.transition = "none";
      panel.style.willChange = "transform";
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!active || event.pointerId !== pointerId || !panel) return;

      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      const instantaneous = (event.clientX - lastX) / dt;
      velocity = velocity * 0.72 + instantaneous * 0.28;
      lastX = event.clientX;
      lastTime = now;

      const dx = event.clientX - startX;
      const width = Math.max(1, panel.getBoundingClientRect().width);
      const resisted = Math.sign(dx) * Math.min(Math.abs(dx), width) * 0.92;
      const progress = Math.min(1, Math.abs(resisted) / width);

      panel.style.transform = `translate3d(${resisted}px,0,0)`;
      if (backdrop) backdrop.style.opacity = String(1 - progress * 0.55);
    };

    const finish = (event: PointerEvent, cancelled = false) => {
      if (!active || event.pointerId !== pointerId || !panel) return;

      const currentPanel = panel;
      const currentBackdrop = backdrop;
      const dx = event.clientX - startX;
      const width = Math.max(1, currentPanel.getBoundingClientRect().width);
      const threshold = Math.max(CLOSE_DISTANCE, width * CLOSE_RATIO);
      const shouldClose =
        !cancelled &&
        (Math.abs(dx) >= threshold || Math.abs(velocity) >= CLOSE_VELOCITY);

      currentPanel.style.transition =
        "transform 360ms cubic-bezier(.22,1,.36,1)";

      // React's existing touch-end handler can write transform after pointerup.
      // Apply the final state on the next paint so this controller wins cleanly.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (shouldClose) {
            const direction = dx === 0 ? 1 : Math.sign(dx);
            currentPanel.style.transform = `translate3d(${direction * 105}%,0,0)`;
            if (currentBackdrop) {
              currentBackdrop.style.transition = "opacity 260ms ease";
              currentBackdrop.style.opacity = "0";
            }

            window.setTimeout(() => {
              const closeButton = currentPanel.querySelector(
                'button[aria-label="Close menu"]'
              ) as HTMLButtonElement | null;
              closeButton?.click();
            }, 250);
          } else {
            currentPanel.style.transform = "translate3d(0,0,0)";
            if (currentBackdrop) {
              currentBackdrop.style.transition = "opacity 260ms ease";
              currentBackdrop.style.opacity = "1";
            }
          }
        });
      });

      window.setTimeout(() => {
        currentPanel.style.willChange = "auto";
      }, 420);
      reset();
    };

    const onPointerUp = (event: PointerEvent) => finish(event, false);
    const onPointerCancel = (event: PointerEvent) => finish(event, true);

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("pointerup", onPointerUp, true);
    document.addEventListener("pointercancel", onPointerCancel, true);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointermove", onPointerMove, true);
      document.removeEventListener("pointerup", onPointerUp, true);
      document.removeEventListener("pointercancel", onPointerCancel, true);
    };
  }, []);

  return null;
}
