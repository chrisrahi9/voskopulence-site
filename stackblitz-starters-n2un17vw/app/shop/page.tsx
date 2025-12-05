"use client";

import { useState } from "react";

const ASSETS = "https://cdn.voskopulence.com";
const asset = (p: string) => `${ASSETS}${p}`;

type Bar = {
  id: string;
  name: string;
  img: string;
  tagline: string;
  hairType: string;
  benefits: string[];
  heroIngredients: string;
  // shopifyUrl: string; // not used in pre-launch phase
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
  const [selectedBar, setSelectedBar] = useState<Bar | null>(null);
const CLICK_ENDPOINT = "https://script.google.com/macros/s/AKfycbxt5TLSf6uppEu-TiocLpq0Ya999Zsn3a-vwNy79Hn_sTLHG8SitVMKXwWRNOHb_BtWig/exec"; // your Apps Script URL

  const closeModal = () => setSelectedBar(null);
const handleBuyClick = (bar: Bar) => {
  // 1) Fire-and-forget click logging to Google Sheets
  if (typeof window !== "undefined") {
    try {
      const payload = {
        product: bar.id,
        page: window.location.pathname,
        userAgent: window.navigator.userAgent,
      };

      // simple, no await needed
      fetch(CLICK_ENDPOINT, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
        keepalive: true, // best effort even on navigation
      }).catch(() => {});
    } catch {
      // ignore analytics errors
    }
  }

  // 2) Open the existing modal
  setSelectedBar(bar);
};

  return (
    <main className="min-h-screen bg-white pt-28 pb-20 px-6 lg:px-10">
      <div className="max-w-6xl mx-auto">
        {/* Title + intro (fixed in place, like you wanted) */}
        <h1 className="heading-script text-4xl sm:text-5xl text-[#004642] text-center mb-4">
          Our Bars
        </h1>
        <p className="text-center text-neutral-700 max-w-2xl mx-auto mb-12">
          Solid shampoo and conditioner bars crafted to COSMOS standards, designed for
          different hair needs but all with the same Mediterranean, eco-conscious spirit.
        </p>

        {/* Grid of bars */}
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

                <div className="mt-4">
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

            {/* Simple email form (using formsubmit) */}
           <form
  className="mt-4 space-y-3"
  action="https://formsubmit.co/christrahi16@gmail.com"
  method="POST"
>
  {/* So you know which bar they wanted */}
  <input type="hidden" name="product" value={selectedBar.name} />

  {/* Prevent captcha + set email style + redirect */}
  <input type="hidden" name="_captcha" value="false" />
  <input type="hidden" name="_template" value="table" />
  <input
    type="hidden"
    name="_subject"
    value="New Voskopulence waitlist signup"
  />
  <input
    type="hidden"
    name="_next"
    value="https://voskopulence.com/thank-you"
  />

              {/* So you know which bar they wanted */}
              <input
                type="hidden"
                name="product"
                value={selectedBar.name}
              />

              {/* Prevent formsubmit from showing its own page too much */}
              <input type="hidden" name="_captcha" value="false" />
              <input type="hidden" name="_template" value="table" />

              <label className="block text-sm font-medium text-neutral-800">
                Email address
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[#c4d3ca] px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#004642]/60"
              />

              <p className="text-[0.7rem] text-neutral-500">
                You won&apos;t be charged now. This only subscribes you to a one-time
                notification when this bar becomes available.
              </p>

              <button
                type="submit"
                className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-[#004642]
                           px-4 py-2.5 text-sm font-semibold tracking-[0.12em] text-white
                           hover:bg-[#015b55] transition-all duration-200"
              >
                Notify me at launch
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
