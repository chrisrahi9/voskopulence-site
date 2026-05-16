"use client";

import { useEffect } from "react";

const SCROLL_EASE = 0.16;
const MIN_DELTA = 0.5;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const isTouchLikeDevice = () =>
  window.matchMedia?.("(hover: none), (pointer: coarse)")?.matches ?? false;

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return false;

  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [data-native-scroll]'
    )
  );
};

const hasScrollableAncestor = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return false;

  let node: Element | null = target;
  while (node && node !== document.documentElement && node !== document.body) {
    const style = window.getComputedStyle(node);
    const canScrollY = /(auto|scroll|overlay)/.test(style.overflowY);

    if (canScrollY && node.scrollHeight > node.clientHeight + 1) {
      return true;
    }

    node = node.parentElement;
  }

  return false;
};

const normalizeWheelDelta = (event: WheelEvent) => {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 36;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * window.innerHeight;
  return event.deltaY;
};

export default function SmoothWheelScroll() {
  useEffect(() => {
    if (isTouchLikeDevice()) return;

    let targetY = window.scrollY;
    let currentY = window.scrollY;
    let raf: number | null = null;

    const getMaxScroll = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    const stop = () => {
      if (raf != null) cancelAnimationFrame(raf);
      raf = null;
      targetY = window.scrollY;
      currentY = window.scrollY;
    };

    const tick = () => {
      currentY += (targetY - currentY) * SCROLL_EASE;

      if (Math.abs(targetY - currentY) < MIN_DELTA) {
        currentY = targetY;
        window.scrollTo(0, currentY);
        raf = null;
        return;
      }

      window.scrollTo(0, currentY);
      raf = requestAnimationFrame(tick);
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey || event.defaultPrevented) return;
      if (isEditableTarget(event.target) || hasScrollableAncestor(event.target)) return;

      const bodyStyle = window.getComputedStyle(document.body);
      const htmlStyle = window.getComputedStyle(document.documentElement);
      if (bodyStyle.overflowY === "hidden" || htmlStyle.overflowY === "hidden") {
        stop();
        return;
      }

      const maxScroll = getMaxScroll();
      if (maxScroll <= 0) return;

      const deltaY = normalizeWheelDelta(event);
      if (Math.abs(deltaY) < 1) return;

      event.preventDefault();

      const liveY = window.scrollY;
      if (Math.abs(liveY - currentY) > 120) currentY = liveY;

      targetY = clamp(targetY + deltaY, 0, maxScroll);
      if (raf == null) raf = requestAnimationFrame(tick);
    };

    const onResize = () => {
      targetY = clamp(targetY, 0, getMaxScroll());
      currentY = window.scrollY;
    };

    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("keydown", stop);
    window.addEventListener("mousedown", stop);

    return () => {
      window.removeEventListener("wheel", onWheel, { capture: true } as any);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", stop);
      window.removeEventListener("mousedown", stop);
      stop();
    };
  }, []);

  return null;
}
