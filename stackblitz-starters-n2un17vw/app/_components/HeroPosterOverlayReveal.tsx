"use client";

import { useLayoutEffect } from "react";

export default function HeroPosterOverlayReveal() {
  useLayoutEffect(() => {
    const video = Array.from(document.querySelectorAll("video")).find(
      (el) => (el as HTMLVideoElement).autoplay && (el as HTMLVideoElement).muted
    ) as HTMLVideoElement | undefined;
    if (!video) return;

    const compact =
      window.matchMedia?.("(max-width: 767px)")?.matches ?? window.innerWidth < 768;

    video.style.position = "absolute";
    video.style.inset = "0";
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";
    video.style.objectPosition = compact ? "46% 50%" : "50% 50%";
    video.style.opacity = "1";
    video.style.transition = "none";
    video.style.zIndex = "1";

    const parent = video.parentElement;
    const poster = parent
      ? (Array.from(parent.children).find((el) => {
          if (!(el instanceof HTMLElement)) return false;
          return el.style.backgroundImage.includes("hero_web_v6_3_poster");
        }) as HTMLElement | undefined)
      : undefined;

    if (!poster) return;

    poster.style.zIndex = "2";
    poster.style.opacity = "1";
    poster.style.transition = "opacity 220ms ease";

    const reveal = () => {
      requestAnimationFrame(() => {
        poster.style.opacity = "0";
      });
    };

    video.addEventListener("playing", reveal, { once: true });
    return () => video.removeEventListener("playing", reveal);
  }, []);

  return null;
}
