"use client";

import { useEffect } from "react";
import Hls from "hls.js";

const CDN = "https://cdn.voskopulence.com";
const MASTER_HLS = `${CDN}/hero_hls/master.m3u8`;
const PREMIUM_MP4 = `${CDN}/hero_web_v3.mp4`;
const POSTER = `${CDN}/hero_poster.jpg`;

type NetworkInformationLike = {
  effectiveType?: string;
  saveData?: boolean;
};

export default function HeroVideoController() {
  useEffect(() => {
    let disposed = false;
    let hls: Hls | null = null;
    let adaptiveVideo: HTMLVideoElement | null = null;
    let originalVideo: HTMLVideoElement | null = null;
    let retryTimer: number | null = null;

    const reveal = () => {
      if (!adaptiveVideo) return;
      adaptiveVideo.style.opacity = "1";
    };

    const setFlags = (video: HTMLVideoElement) => {
      video.muted = true;
      video.defaultMuted = true;
      video.autoplay = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = "auto";
      video.poster = POSTER;
      video.setAttribute("muted", "");
      video.setAttribute("autoplay", "");
      video.setAttribute("loop", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
    };

    const play = () => {
      if (!adaptiveVideo || disposed || document.visibilityState === "hidden") return;
      setFlags(adaptiveVideo);
      adaptiveVideo.play().catch(() => {});
    };

    const usePremiumMp4 = () => {
      if (!adaptiveVideo || disposed) return;
      try {
        hls?.destroy();
      } catch {}
      hls = null;
      setFlags(adaptiveVideo);
      adaptiveVideo.src = PREMIUM_MP4;
      adaptiveVideo.load();
      play();
    };

    const mount = () => {
      if (disposed) return;

      originalVideo = document.querySelector(
        "section video[aria-hidden='true']"
      ) as HTMLVideoElement | null;

      if (!originalVideo || !originalVideo.parentElement) {
        retryTimer = window.setTimeout(mount, 60);
        return;
      }

      // Keep the old React-managed player in place but invisible. That prevents
      // its legacy recovery handlers from fighting the new adaptive player.
      originalVideo.style.opacity = "0";
      originalVideo.style.visibility = "hidden";

      const video = document.createElement("video");
      adaptiveVideo = video;
      video.dataset.adaptiveHero = "true";
      video.className =
        "absolute inset-0 w-full h-full object-cover pointer-events-none";
      video.style.opacity = "0";
      video.style.transition = "opacity 650ms ease";
      video.style.willChange = "opacity";
      video.style.backfaceVisibility = "hidden";
      video.style.transform = "translateZ(0)";
      video.setAttribute("aria-hidden", "true");
      video.disablePictureInPicture = true;
      video.disableRemotePlayback = true;
      setFlags(video);

      originalVideo.insertAdjacentElement("afterend", video);

      const onReady = () => reveal();
      const onPlaying = () => reveal();
      const onVisibility = () => {
        if (document.visibilityState === "visible") play();
      };
      video.addEventListener("loadeddata", onReady);
      video.addEventListener("canplay", onReady);
      video.addEventListener("playing", onPlaying);
      document.addEventListener("visibilitychange", onVisibility);

      const nativeHls = video.canPlayType("application/vnd.apple.mpegurl");

      if (nativeHls) {
        // iPhone/iPad/macOS Safari use Apple's native adaptive HLS engine.
        // Direct CDN access avoids the failing Vercel /media proxy entirely.
        video.src = MASTER_HLS;
        video.load();
        play();
      } else if (Hls.isSupported()) {
        const connection = (navigator as any)
          .connection as NetworkInformationLike | undefined;
        const effectiveType = connection?.effectiveType ?? "";
        const clearlyConstrained =
          Boolean(connection?.saveData) ||
          effectiveType === "slow-2g" ||
          effectiveType === "2g";

        hls = new Hls({
          // Start with an intentionally optimistic bandwidth estimate so a good
          // connection does not begin at a soft low rendition. ABR stays active
          // and can immediately step down when measured throughput requires it.
          abrEwmaDefaultEstimate: clearlyConstrained ? 2_500_000 : 25_000_000,
          abrBandWidthFactor: 0.95,
          abrBandWidthUpFactor: 0.85,
          capLevelToPlayerSize: false,
          testBandwidth: false,
          maxBufferLength: clearlyConstrained ? 10 : 30,
          maxMaxBufferLength: clearlyConstrained ? 20 : 60,
          maxStarvationDelay: 3,
          maxLoadingDelay: 3,
          enableWorker: true,
        });

        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          if (!disposed) hls?.loadSource(MASTER_HLS);
        });
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!hls || disposed) return;

          if (!clearlyConstrained && hls.levels.length > 0) {
            const highest = hls.levels.length - 1;
            hls.startLevel = highest;
            hls.nextAutoLevel = highest;
          }

          play();
        });
        hls.on(Hls.Events.LEVEL_SWITCHED, () => reveal());
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!hls || disposed || !data.fatal) return;

          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            try {
              hls.startLoad();
              return;
            } catch {}
          }

          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            try {
              hls.recoverMediaError();
              return;
            } catch {}
          }

          usePremiumMp4();
        });
      } else {
        usePremiumMp4();
      }

      // Never expose a blank/gray hero while the video is negotiating startup.
      // The existing direct-CDN poster remains visible underneath this element.
      const startupGuard = window.setTimeout(() => {
        if (!disposed && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          reveal();
        }
      }, 1600);

      return () => {
        window.clearTimeout(startupGuard);
        video.removeEventListener("loadeddata", onReady);
        video.removeEventListener("canplay", onReady);
        video.removeEventListener("playing", onPlaying);
        document.removeEventListener("visibilitychange", onVisibility);
      };
    };

    const cleanupListeners = mount();

    return () => {
      disposed = true;
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      cleanupListeners?.();
      try {
        hls?.destroy();
      } catch {}
      adaptiveVideo?.remove();
      if (originalVideo) {
        originalVideo.style.visibility = "";
      }
    };
  }, []);

  return null;
}
