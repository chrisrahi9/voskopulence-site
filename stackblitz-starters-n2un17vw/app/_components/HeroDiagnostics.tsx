"use client";

import { useEffect } from "react";

export default function HeroDiagnostics() {
  useEffect(() => {
    const enabled = new URLSearchParams(window.location.search).get("heroDiag") === "1";
    if (!enabled) return;

    const panel = document.createElement("div");
    panel.setAttribute("data-hero-diagnostics", "true");
    panel.style.cssText =
      "position:fixed;left:8px;bottom:8px;z-index:2147483647;max-width:calc(100vw - 16px);padding:8px 10px;border-radius:8px;background:rgba(0,0,0,.82);color:#fff;font:11px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre;pointer-events:none;text-align:left";
    document.body.appendChild(panel);

    const findHeroVideo = () =>
      Array.from(document.querySelectorAll("video")).find((video) => video.autoplay && video.muted) ||
      document.querySelector("video");

    const update = () => {
      const video = findHeroVideo() as HTMLVideoElement | null;
      if (!video) {
        panel.textContent = "HERO DIAGNOSTICS\nvideo: waiting";
        return;
      }

      const width = video.videoWidth || 0;
      const height = video.videoHeight || 0;
      const approx =
        height >= 1900
          ? "2160p / 4K"
          : height >= 1000
            ? "1080p"
            : height >= 840
              ? "900p"
              : height >= 650
                ? "720p"
                : height >= 500
                  ? "540p"
                  : height
                    ? `${height}p`
                    : "waiting";

      let bufferedAhead = 0;
      try {
        for (let i = 0; i < video.buffered.length; i += 1) {
          if (
            video.buffered.start(i) <= video.currentTime &&
            video.buffered.end(i) >= video.currentTime
          ) {
            bufferedAhead = Math.max(0, video.buffered.end(i) - video.currentTime);
            break;
          }
        }
      } catch {}

      const connection = (navigator as Navigator & {
        connection?: { effectiveType?: string; downlink?: number; saveData?: boolean };
      }).connection;
      const network = connection
        ? [
            connection.effectiveType || "?",
            connection.downlink ? `${connection.downlink} Mbps` : "",
            connection.saveData ? "Save-Data" : "",
          ]
            .filter(Boolean)
            .join(" / ")
        : "not exposed";

      panel.textContent =
        `HERO DIAGNOSTICS\n` +
        `decoded: ${width && height ? `${width}×${height}` : "waiting"}  ≈ ${approx}\n` +
        `state: ${video.paused ? "paused" : "playing"} / readyState ${video.readyState}\n` +
        `buffer: ${bufferedAhead.toFixed(1)}s ahead\n` +
        `network API: ${network}`;
    };

    update();
    const timer = window.setInterval(update, 500);
    return () => {
      window.clearInterval(timer);
      panel.remove();
    };
  }, []);

  return null;
}
