"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

const ASSETS = "https://cdn.voskopulence.com";
const asset = (p: string) => `${ASSETS}${p}`;

export default function Home() {
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* =========================
     SAFE SCROLL LOCK
  ========================== */

  function isIOSDevice() {
    if (typeof window === "undefined") return false;

    const ua = navigator.userAgent || "";

    return (
      /iP(hone|od|ad)/.test(ua) ||
      (/\bMac\b/.test(ua) && "ontouchend" in window)
    );
  }

  const scrollYRef = useRef(0);

  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;

    if (menuOpen) {
      if (isIOSDevice()) {
        scrollYRef.current = window.scrollY;

        html.style.overflow = "hidden";
        body.style.position = "fixed";
        body.style.top = `-${scrollYRef.current}px`;
        body.style.left = "0";
        body.style.right = "0";
        body.style.width = "100%";
      } else {
        body.style.overflow = "hidden";
      }
    } else {
      html.style.overflow = "";
      body.style.overflow = "";
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";

      if (isIOSDevice()) {
        window.scrollTo(0, scrollYRef.current);
      }
    }

    return () => {
      html.style.overflow = "";
      body.style.overflow = "";
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
    };
  }, [menuOpen]);

  /* =========================
     VIDEO AUTOPLAY
  ========================== */

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    v.muted = true;

    const playVideo = async () => {
      try {
        await v.play();
      } catch {}
    };

    playVideo();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        playVideo();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);

    if (!el) return;

    window.scrollTo({
      top: el.offsetTop - 80,
      behavior: "smooth",
    });
  };

  return (
    <main className="bg-white text-neutral-900 overflow-x-hidden">
      {/* =========================
          HEADER
      ========================== */}

      <header className="fixed top-0 left-0 right-0 z-[9999] bg-[#004642]/80 backdrop-blur-md text-white">
        <div className="max-w-screen-2xl mx-auto px-6 h-[80px] flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            className="lg:hidden"
            onClick={() => setMenuOpen(true)}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M4 7h16M4 12h16M4 17h16"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* Logo */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <img
              src={asset("/logo_improved.svg")}
              alt="Voskopulence"
              className="h-[110px] w-auto"
            />
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8 text-sm">
            <a href="/shop">Shop</a>

            <button onClick={() => scrollToSection("about")}>
              About
            </button>

            <a href="/sustainability">Sustainability</a>

            <a href="/contact">Contact</a>
          </nav>
        </div>
      </header>

      {/* =========================
          MOBILE MENU
      ========================== */}

      {mounted &&
        menuOpen &&
        createPortal(
          <div className="fixed inset-0 z-[12000] lg:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setMenuOpen(false)}
            />

            {/* Panel */}
            <div className="absolute inset-y-0 left-0 w-full bg-[#004642] text-white flex flex-col">
              <div className="h-[80px] flex items-center justify-between px-6">
                <span className="text-lg font-medium">Menu</span>

                <button onClick={() => setMenuOpen(false)}>
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <nav className="flex-1 flex items-center justify-center">
                <ul className="flex flex-col gap-8 text-2xl font-light">
                  <li>
                    <a
                      href="/"
                      onClick={() => setMenuOpen(false)}
                    >
                      Home
                    </a>
                  </li>

                  <li>
                    <a
                      href="/shop"
                      onClick={() => setMenuOpen(false)}
                    >
                      Shop
                    </a>
                  </li>

                  <li>
                    <button
                      onClick={() => {
                        setMenuOpen(false);

                        setTimeout(() => {
                          scrollToSection("about");
                        }, 250);
                      }}
                    >
                      About
                    </button>
                  </li>

                  <li>
                    <a
                      href="/sustainability"
                      onClick={() => setMenuOpen(false)}
                    >
                      Sustainability
                    </a>
                  </li>

                  <li>
                    <a
                      href="/contact"
                      onClick={() => setMenuOpen(false)}
                    >
                      Contact
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>,
          document.body
        )}

      {/* =========================
          HERO
      ========================== */}

      <section className="relative h-screen overflow-hidden">
        {/* Background Poster */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${asset("/hero_poster.jpg")})`,
          }}
        />

        {/* Video */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={asset("/hero_poster.jpg")}
        >
          <source
            src={asset("/hero_web.webm")}
            type="video/webm"
          />

          <source
            src={asset("/hero_web.mp4")}
            type="video/mp4"
          />
        </video>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/35" />

        {/* Content */}
        <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
          <div className="max-w-3xl">
            <h1
              className="text-white leading-tight"
              style={{
                fontSize: "clamp(2.8rem, 6vw, 5rem)",
                fontFamily: "var(--font-heading)",
              }}
            >
              Welcome to Voskopulence
            </h1>

            <p className="mt-6 text-white/90 text-lg leading-relaxed">
              Solid shampoo & conditioner bars crafted to COSMOS
              standards with botanicals inspired by the
              Mediterranean.
            </p>

            <button
              onClick={() => scrollToSection("spotlight")}
              className="mt-10 h-14 w-14 rounded-full border border-white/40 text-white flex items-center justify-center backdrop-blur-sm hover:scale-110 transition"
            >
              ↓
            </button>
          </div>
        </div>
      </section>

      {/* =========================
          SPOTLIGHT
      ========================== */}

      <section
        id="spotlight"
        className="bg-[#f6fbf9] py-24 px-6"
      >
        <div className="max-w-screen-xl mx-auto grid md:grid-cols-2 gap-14 items-center">
          <div className="flex justify-center">
            <img
              src={asset("/Spotlight_pic.png")}
              alt="Rosemary Bar"
              className="w-[380px] max-w-full rounded-3xl shadow-2xl"
            />
          </div>

          <div>
            <p className="uppercase tracking-[0.25em] text-sm text-neutral-500">
              Spotlight
            </p>

            <h2
              className="mt-4 text-[#004642]"
              style={{
                fontSize: "clamp(2.2rem,4vw,4rem)",
                fontFamily: "var(--font-heading)",
              }}
            >
              Mediterranean Rosemary Bar
            </h2>

            <p className="mt-6 text-neutral-700 leading-relaxed">
              Solid shampoo crafted to COSMOS standards with
              rosemary and mint. Clean, concentrated,
              travel-ready.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="/shop"
                className="px-7 py-3 rounded-full bg-[#004642] text-white hover:opacity-90 transition"
              >
                Discover the bar
              </a>

              <a
                href="/sustainability"
                className="px-7 py-3 rounded-full border border-[#004642] text-[#004642]"
              >
                Learn more
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          ABOUT
      ========================== */}

      <section
        id="about"
        className="relative min-h-[85vh]"
      >
        <img
          src={asset("/about-visual.jpg")}
          alt="Mediterranean terrace"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-black/45" />

        <div className="relative z-10 max-w-screen-xl mx-auto px-6 py-32">
          <h2
            className="text-white"
            style={{
              fontSize: "clamp(2.5rem,5vw,5rem)",
              fontFamily: "var(--font-heading)",
            }}
          >
            About us
          </h2>

          <p className="mt-8 max-w-3xl text-white/95 text-lg leading-relaxed">
            Founded in 2024, Voskopulence emerged from a deep
            passion for creating organic, eco-conscious, and
            luxurious hair care inspired by the Mediterranean.
          </p>
        </div>
      </section>
    </main>
  );
}
