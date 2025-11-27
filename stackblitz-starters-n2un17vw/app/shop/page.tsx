// app/shop/page.tsx
"use client";

const ASSETS = "https://cdn.voskopulence.com";
const asset = (p: string) => `${ASSETS}${p}`;

const BARS = [
  {
    id: "rosemary",
    name: "Mediterranean Rosemary Shampoo Bar",
    desc: "Purifying, fresh and invigorating. For normal to oily hair.",
    img: "/bars/rosemary.png", // adjust path to your CDN
    shopifyUrl: "https://yourshopifydomain.com/products/rosemary-bar",
  },
  {
    id: "fig",
    name: "Sunlit Fig & Cedar Shampoo Bar",
    desc: "Softening and comforting, inspired by Mediterranean evenings.",
    img: "/bars/fig.png",
    shopifyUrl: "https://yourshopifydomain.com/products/fig-bar",
  },
  {
    id: "lemon",
    name: "Lemon & Sea Breeze Conditioner Bar",
    desc: "Light, detangling, ideal for everyday use.",
    img: "/bars/lemon.png",
    shopifyUrl: "https://yourshopifydomain.com/products/lemon-bar",
  },
];

export default function ShopPage() {
  return (
    <div className="min-h-screen bg-white pt-28 pb-20 px-6 lg:px-10">
      <h1 className="text-4xl font-semibold text-[#004642] text-center mb-14">
        Our Bars
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
        
        {/* Rosemary / Thyme Bar */}
        <div className="flex flex-col items-center text-center">
          <img
            src={asset("/Thyme_sea.png")}
            alt="Mediterranean Rosemary & Thyme Bar"
            className="rounded-2xl shadow-lg w-64 h-auto"
          />
          <h2 className="mt-4 text-xl font-semibold text-[#004642]">
            Mediterranean Rosemary Bar
          </h2>
          <p className="text-neutral-600 mt-2">
            Herbal, fresh, and uplifting.
          </p>
        </div>

        {/* Fig Bar */}
        <div className="flex flex-col items-center text-center">
          <img
            src={asset("/Fig_sea.png")}
            alt="Fig & Cedar Bar"
            className="rounded-2xl shadow-lg w-64 h-auto"
          />
          <h2 className="mt-4 text-xl font-semibold text-[#004642]">
            Fig & Cedar Bar
          </h2>
          <p className="text-neutral-600 mt-2">
            Warm, fruity, and soothing.
          </p>
        </div>

        {/* Lemon Sea Breeze Bar */}
        <div className="flex flex-col items-center text-center">
          <img
            src={asset("/Lemon_sea.png")}
            alt="Lemon Sea Breeze Bar"
            className="rounded-2xl shadow-lg w-64 h-auto"
          />
          <h2 className="mt-4 text-xl font-semibold text-[#004642]">
            Lemon Sea Breeze Bar
          </h2>
          <p className="text-neutral-600 mt-2">
            Fresh, bright, and ocean-inspired.
          </p>
        </div>

      </div>
    </div>
  );
}

