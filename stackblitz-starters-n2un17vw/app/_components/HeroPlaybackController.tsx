"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const HERO_PLAYBACK_RATE = 0.75;

export default function HeroPlaybackController() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/" && pathname !== "/sv") return;

    let disposed = false;
    let video: HTMLVideoElement | null = null;
    let retryTimer: number | null = null;

    const applyRate = () => {
      if (!video || disposed) return;
      video.defaultPlaybackRate = HERO_PLAYBACK_RATE;
      video.playbackRate = HERO_PLAYBACK_RATE;
    };

    const attach = () => {
      if (disposed) return;
      const nextVideo = document.querySelector("video") as HTMLVideoElement | null;
      if (!nextVideo) {
        retryTimer = window.setTimeout(attach, 80);
        return;
      }

      video = nextVideo;
      applyRate();
      video.addEventListener("loadedmetadata", applyRate);
      video.addEventListener("playing", applyRate);
      video.addEventListener("durationchange", applyRate);
    };

    attach();

    return () => {
      disposed = true;
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      if (video) {
        video.removeEventListener("loadedmetadata", applyRate);
        video.removeEventListener("playing", applyRate);
        video.removeEventListener("durationchange", applyRate);
      }
    };
  }, [pathname]);

  return null;
}
