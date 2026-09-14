"use client";

import { useLayoutEffect } from "react";

export default function HeroStartupCropLock() {
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
  }, []);

  return null;
}
