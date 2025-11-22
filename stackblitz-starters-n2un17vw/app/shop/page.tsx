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
    <main className="min-h-screen bg-[#f6fbf9] pt-[112px] pb-16">
      <section className="mx-auto max-w-screen-xl px-6 lg:px-10">
        <h1 className="heading-script text-4xl sm:text-5xl text-[#004642] mb-4">
          Our Bars
        </h1>
        <p className="text-neutral-700 mb-10 max-w-2xl">
          Three solid bars crafted to COSMOS standards, inspired by Mediterranean botanicals.
        </p>

        <div className="grid gap-8 md:grid-cols-3">
          {BARS.map((bar) => (
            <article
              key={bar.id}
              className="rounded-3xl bg-white shadow-[0_18px_40px_-22px_rgba(0,0,0,0.35)] border border-[#8C9A91]/20 flex flex-col overflow-hidden"
            >
              <div className="relative aspect-[4/5] bg-[#e6f2ee]">
                <img
                  src={asset(bar.img)}
                  alt={bar.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              <div className="p-5 flex flex-col gap-3 flex-1">
                <h2 className="text-lg font-semibold text-[#004642]">
                  {bar.name}
                </h2>
                <p className="text-sm text-neutral-700 flex-1">{bar.desc}</p>

                <a
                  href={bar.shopifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center justify-center rounded-full border-2 border-[#004642]
                             px-5 py-2.5 text-[#004642] text-sm font-semibold tracking-[0.06em]
                             hover:bg-[#004642] hover:text-white transition-all duration-250
                             hover:-translate-y-[1px]"
                >
                  Buy on Shopify
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
