"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

const ASSETS = "https://cdn.voskopulence.com";
const asset = (p: string) => `${ASSETS}${p}`;

// ONE endpoint for clicks + waitlist (same as before)
const ANALYTICS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbxu9MZaTjNjJQJ6NrRoow1HMEkFoUwPGe3uB1VR1ltF-YZZSU6WBkkRGq_bOxBCqKaO/exec"; // <-- keep your URL here

type Bar = {
  id: string;
  name: string;
  img: string;
  tagline: string;
  hairType: string;
  benefits: string[];
  heroIngredients: string;
};

const BARS: Bar[] = [
  {
    id: "thyme",
    name: "Mediterranean Thyme & Rosemary Bar",
    img: "/Thyme_sea.png",
    tagline: "A fresh herbal cleanse that keeps roots light and awake.",
    hairType: "Normal to oily hair · Scalps that feel heavy or quickly greasy",
    benefits: [
      "Gently clarifies without stripping",
      "Helps reduce excess sebum at the roots",
      "Leaves hair light and refreshed",
    ],
    heroIngredients:
      "Rosemary, thyme & mint essential oils, coconut & olive oils, castor oil, shea butter, nettle leaf powder",
  },
  {
    id: "fig",
    name: "Fig & Cedar Nourishing Bar",
    img: "/Fig_sea.png",
    tagline: "Creamy comfort for hair that likes extra softness and care.",
    hairType: "Normal to dry hair · Frizz or sensitised ends",
    benefits: [
      "Softens and smooths the hair fibre",
      "Adds light nourishment without heaviness",
      "Leaves a warm, fruity Mediterranean scent",
    ],
    heroIngredients:
      "Fig extract, cedarwood & lavender, coconut & olive oils, castor oil, shea butter.",
  },
  {
    id: "lemon",
    name: "Lemon Sea Breeze Conditioner Bar",
    img: "/Lemon_sea.png",
    tagline: "Detangling solid conditioner with coastal freshness.",
    hairType: "All hair types · ideal after every wash",
    benefits: [
      "Instantly eases tangles after washing",
      "Adds softness and shine",
      "Light, fresh citrus–marine scent",
    ],
    heroIngredients:
      "Lemon peel oil, sea minerals, jojoba oil, coconut & olive oils, conditioning esters.",
  },
];

export default function ShopPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const [selectedBar, setSelectedBar] = useState<Bar | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  const closeModal = () => {
    setSelectedBar(null);
    setWaitlistEmail("");
    setWaitlistStatus("idle");
  };

  // BUY NOW: track click + open modal
  const handleBuyClick = (bar: Bar) => {
    if (typeof window !== "undefined") {
      try {
        const payload = {
          event: "click",
          product: bar.id,
          page: window.location.pathname,
          userAgent: window.navigator.userAgent,
        };

        fetch(ANALYTICS_ENDPOINT, {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
          mode: "no-cors",
          keepalive: true,
        }).catch(() => {});
      } catch {
        // ignore
      }
    }

    setSelectedBar(bar);
    setWaitlistEmail("");
    setWaitlistStatus("idle");
  };

  // Waitlist submit → send to Apps Script, stay on page
  const handleWaitlistSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedBar) return;
    if (!waitlistEmail) return;
    if (waitlistStatus === "sending") return;

    setWaitlistStatus("sending");

    try {
      await fetch(ANALYTICS_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({
          event: "waitlist",
          product: selectedBar.name,
          email: waitlistEmail,
          page:
            typeof window !== "undefined"
              ? window.location.pathname
              : "/shop",
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : "",
        }),
        headers: { "Content-Type": "application/json" },
        mode: "no-cors",
      });

      setWaitlistStatus("sent");
      setWaitlistEmail("");
    } catch {
      setWaitlistStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ---------- Simple global header for this page ---------- */}
      <header className="fixed inset-x-0 top-0 z-[9000] bg-[#004642] text-white/95 shadow-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-[64px] flex items-center justify-between">
          {/* Left: logo */}
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-2"
          >
            <img
              src={asset("/logo_improved.svg")}
              alt="Voskopulence"
              className="h-9 w-auto"
            />
          </button>

          {/* Right: desktop nav + burger */}
          <nav className="hidden lg:flex items-center gap-6 text-sm">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="hover:text-gray-200"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => router.push("/shop")}
              className="hover:text-gray-200"
            >
              Shop
            </button>
            <button
              type="button"
              onClick={() => router.push("/sustainability")}
              className="hover:text-gray-200"
            >
              Sustainability
            </button>
            <button
              type="button"
              onClick={() => router.push("/contact")}
              className="hover:text-gray-200"
            >
              Contact
            </button>
          </nav>

          {/* Mobile burger */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full lg:hidden hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            aria-label="Open menu"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M4 7h16M4 12h16M4 17h16"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* ---------- Mobile curtain menu ---------- */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[9500] lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* backdrop */}
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-[rgba(0,70,66,0.70)] backdrop-blur-md"
            onClick={() => setMenuOpen(false)}
          />

          {/* panel */}
          <div className="absolute inset-y-0 left-0 right-0 z-[9501] flex flex-col text-white bg-[#004642] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between h-[64px] px-5 shrink-0">
              <span className="font-semibold text-white/95">Menu</span>
              <button
                type="button"
                aria-label="Close menu"
                className="p-2 rounded-md hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                onClick={() => setMenuOpen(false)}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <nav className="grow grid place-items-center">
              <ul className="flex flex-col items-center gap-8 text-[1.25rem] font-light tracking-wide">
                <li>
                  <button
                    type="button"
                    className="hover:text-gray-200"
                    onClick={() => {
                      router.push("/");
                      setMenuOpen(false);
                    }}
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="hover:text-gray-200"
                    onClick={() => {
                      router.push("/shop");
                      setMenuOpen(false);
                    }}
                  >
                    Shop
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="hover:text-gray-200"
                    onClick={() => {
                      router.push("/sustainability");
                      setMenuOpen(false);
                    }}
                  >
                    Sustainability
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="hover:text-gray-200"
                    onClick={() => {
                      router.push("/contact");
                      setMenuOpen(false);
                    }}
                  >
                    Contact
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* ---------- Main shop content ---------- */}
      <main className="flex-1 pt-28 pb-20 px-6 lg:px-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="heading-script text-4xl sm:text-5xl text-[#004642] text-center mb-4">
            Our Bars
          </h1>
          <p className="text-center text-neutral-700 max-w-2xl mx-auto mb-12">
            Solid shampoo and conditioner bars crafted to COSMOS standards,
            designed for different hair needs but all with the same Mediterranean,
            eco-conscious spirit.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {BARS.map((bar) => (
              <article
                key={bar.id}
                className="flex flex-col rounded-3xl bg-[#f6fbf9] border border-[#8C9A91]/30 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.3)] overflow-hidden"
              >
                <div className="bg-[#e6f2ee]">
                  <img
                    src={asset(bar.img)}
                    alt={bar.name}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                <div className="p-5 flex flex-col gap-3 flex-1">
                  <h2 className="text-lg font-semibold text-[#004642]">
                    {bar.name}
                  </h2>
                  <p className="text-sm text-neutral-700">{bar.tagline}</p>

                  <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                    {bar.hairType}
                  </p>

                  <ul className="mt-1 text-sm text-neutral-700 list-disc list-inside space-y-1">
                    {bar.benefits.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>

                  <p className="mt-2 text-xs text-neutral-600">
                    <span className="font-semibold">Key ingredients: </span>
                    {bar.heroIngredients}
                  </p>

                  <div className="mt-auto pt-4">
                    <button
                      type="button"
                      onClick={() => handleBuyClick(bar)}
                      className="inline-flex w-full items-center justify-center rounded-full bg-[#004642]
                                 px-4 py-2.5 text-sm font-semibold tracking-[0.12em] text-white
                                 hover:bg-[#015b55] transition-all duration-200 hover:-translate-y-[1px]
                                 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C9A91]/70"
                    >
                      BUY NOW
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* WAITLIST MODAL */}
        {selectedBar && (
          <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white shadow-xl border border-[#8C9A91]/30 p-6 relative mx-4">
              <button
                type="button"
                onClick={closeModal}
                className="absolute right-3 top-3 p-1 rounded-full hover:bg-neutral-100 text-neutral-500"
                aria-label="Close"
              >
                ✕
              </button>

              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                Pre-launch · Out of stock
              </p>
              <h2 className="mt-2 text-base font-semibold text-[#004642]">
                {selectedBar.name}
              </h2>
              <p className="mt-2 text-sm text-neutral-700">
                We&apos;re preparing our first small batch of Voskopulence bars.
                This product is not available to purchase yet, but you can leave
                your email below and we&apos;ll let you know as soon as it&apos;s in stock.
              </p>

              <form className="mt-4 space-y-3" onSubmit={handleWaitlistSubmit}>
                <label className="block text-sm font-medium text-neutral-800">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@example.com"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#c4d3ca] px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#004642]/60"
                />

                <p className="text-[0.7rem] text-neutral-500">
                  You won&apos;t be charged now. This only subscribes you to a one-time
                  notification when this bar becomes available.
                </p>

                <button
                  type="submit"
                  disabled={waitlistStatus === "sending"}
                  className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-[#004642]
                             px-4 py-2.5 text-sm font-semibold tracking-[0.12em] text-white
                             hover:bg-[#015b55] transition-all duration-200 disabled:opacity-60"
                >
                  {waitlistStatus === "sending"
                    ? "Sending..."
                    : waitlistStatus === "sent"
                    ? "You’re on the list ✓"
                    : "Notify me at launch"}
                </button>

                {waitlistStatus === "error" && (
                  <p className="mt-2 text-sm text-red-600">
                    Something went wrong. Please try again in a moment.
                  </p>
                )}
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
