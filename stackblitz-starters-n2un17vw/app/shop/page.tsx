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
  shopifyUrl: string; // put checkout or product link here later
};

const BARS: Bar[] = [
  {
    id: "thyme",
    name: "Mediterranean Thyme & Rosemary Bar",
    img: "/Thyme_sea.png",
    tagline: "Purifying solid shampoo for balanced roots.",
    hairType: "Normal to oily hair · Prone to build-up",
    benefits: [
      "Gently clarifies without stripping",
      "Helps reduce excess sebum at the roots",
      "Leaves hair light and refreshed",
    ],
    heroIngredients: "Rosemary, Thyme, Olive oil, Gentle coconut-based surfactants",
    shopifyUrl: "#", // TODO: replace with Shopify checkout/product URL
  },
  {
    id: "fig",
    name: "Fig & Cedar Nourishing Bar",
    img: "/Fig_sea.png",
    tagline: "Creamy care for dry, sensitised lengths.",
    hairType: "Normal to dry hair · Frizz or sensitised ends",
    benefits: [
      "Softens and smooths the hair fibre",
      "Adds light nourishment without heaviness",
      "Leaves a warm, fruity Mediterranean scent",
    ],
    heroIngredients: "Fig extract, Cedarwood, Shea butter, Plant oils",
    shopifyUrl: "#",
  },
  {
    id: "lemon",
    name: "Lemon Sea Breeze Conditioner Bar",
    img: "/Lemon_sea.png",
    tagline: "Detangling solid conditioner with coastal freshness.",
    hairType: "All hair types · Daily use",
    benefits: [
      "Instantly eases tangles after washing",
      "Adds softness and shine",
      "Light, fresh citrus–marine scent",
    ],
    heroIngredients: "Lemon peel, Sea minerals, Jojoba oil, Conditioning esters",
    shopifyUrl: "#",
  },
];

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-white pt-28 pb-20 px-6 lg:px-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="heading-script text-4xl sm:text-5xl text-[#004642] text-center mb-4">
          Our Bars
        </h1>
        <p className="text-center text-neutral-700 max-w-2xl mx-auto mb-12">
          Solid shampoo and conditioner bars crafted to COSMOS standards, designed for
          different hair needs but all with the same Mediterranean, eco-conscious spirit.
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

                <div className="mt-4">
                  <a
                    href={bar.shopifyUrl}
                    className="inline-flex w-full items-center justify-center rounded-full bg-[#004642]
                               px-4 py-2.5 text-sm font-semibold tracking-[0.12em] text-white
                               hover:bg-[#015b55] transition-all duration-200 hover:-translate-y-[1px]"
                  >
                    BUY NOW
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
