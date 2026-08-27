"use client";

import { useEffect } from "react";
import Hls from "hls.js";

const CDN = "https://cdn.voskopulence.com";
const MASTER_HLS = `${CDN}/hero_hls/master.m3u8`;
const PREMIUM_MP4 = `${CDN}/hero_web_v3.mp4`;
const POSTER = `${CDN}/hero_poster.jpg`;

function findHeroVideo() {
  return document.querySelector("section video[aria-hidden='true']") as HTMLVideoElement | null;
}

function makeVideoVisible(video: HTMLVideoElement) {
  video.style.opacity = "1";
  video.classList.add("opacity-100");
}

function setPlaybackFlags(video: HTMLVideoElement) {
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
}

export default function HeroVideoController() {
  useEffect(() => {
    let disposed = false;
    let hls: Hls | null = null;
    let video: HTMLVideoElement | null = null;
    let observer: MutationObserver | null = null;
    let retryTimer: number | null = null;

    const clearRetry = () => {
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
        retryTimer = null;
      }
    };

    const play = () => {
      if (!video || disposed || document.visibilityState === "hidden") return;
      setPlaybackFlags(video);
      const promise = video.play();
      promise?.catch(() => {});
    };

    const usePremiumMp4Fallback = () => {
      if (!video || disposed) return;
      try {
        hls?.destroy();
      } catch {}
      hls = null;
      setPlaybackFlags(video);
      video.src = PREMIUM_MP4;
      try {
        video.load();
      } catch {}
      play();
    };

    const attach = () => {
      if (disposed) return;
      video = findHeroVideo();
      if (!video) {
        retryTimer = window.setTimeout(attach, 50);
        return;
      }

      setPlaybackFlags(video);
      video.poster = POSTER;

      const onReady = () => makeVideoVisible(video!);
      const onPlaying = () => makeVideoVisible(video!);
      const onVisibility = () => {
        if (document.visibilityState === "visible") play();
      };

      video.addEventListener("loadeddata", onReady);
      video.addEventListener("canplay", onReady);
      video.addEventListener("playing", onPlaying);
      document.addEventListener("visibilitychange", onVisibility);

      const nativeHls = video.canPlayType("application/vnd.apple.mpegurl");

      if (nativeHls) {
        // Safari/iOS owns ABR internally. Use the full master playlist directly
        // from the CDN so it can move between renditions according to throughput.
        video.src = MASTER_HLS;
        try {
          video.load();
        } catch {}
        play();
      } else if (Hls.isSupported()) {
        const connection = (navigator as any).connection;
        const saveData = Boolean(connection?.saveData);
        const effectiveType = String(connection?.effectiveType || "");
        const clearlyConstrained =
          saveData || effectiveType === "slow-2g" || effectiveType === "2g";

        hls = new Hls({
          // Bias the first automatic choice strongly toward premium quality.
          // ABR remains fully enabled, so measured throughput/stalls can step down.
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

          // On normal connections, make the initial level premium/high rather
          // than letting the browser begin at the lowest rendition.
          if (!clearlyConstrained && hls.levels.length > 0) {
            const highest = hls.levels.length - 1;
            hls.startLevel = highest;
            hls.nextAutoLevel = highest;
          }
          play();
        });
        hls.on(Hls.Events.LEVEL_SWITCHED, () => makeVideoVisible(video!));
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

          usePremiumMp4Fallback();
        });
      } else {
        usePremiumMp4Fallback();
      }

      // If the older page code tries to replace the source after this controller
      // takes ownership, restore the adaptive source once without flickering.
      observer = new MutationObserver(() => {
        if (!video || disposed || nativeHls || !hls) return;
        const src = video.getAttribute("src") || "";
        if (src.includes("hero_web_v3.mp4")) {
          video.removeAttribute("src");
          try {
            hls.attachMedia(video);
          } catch {}
        }
      });
      observer.observe(video, { attributes: true, attributeFilter: ["src"] });

      // Keep poster visible rather than gray if startup is unusually slow.
      window.setTimeout(() => {
        if (!disposed && video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          makeVideoVisible(video);
        }
      }, 1600);

      return () => {
        video?.removeEventListener("loadeddata", onReady);
        video?.removeEventListener("canplay", onReady);
        video?.removeEventListener("playing", onPlaying);
        document.removeEventListener("visibilitychange", onVisibility);
      };
    };

    const cleanupListeners = attach();

    return () => {
      disposed = true;
      clearRetry();
      observer?.disconnect();
      cleanupListeners?.();
      try {
        hls?.destroy();
      } catch {}
    };
  }, []);

  return null;
}
