"use client";

const ASSETS = "https://cdn.voskopulence.com";
const asset = (p: string) => `${ASSETS}${p}`;

type Bar = {
  id: string;
  name: string;
  img: string;
  tagline: string;
  hairType: string;
  mood: string;
  ritual: string;
  keyIngredients: string;
  shopifyUrl: string;
};

const BARS: Bar[] = [
  {
    id: "thyme",
    name: "Mediterranean Thyme & Rosemary Shampoo Bar",
    img: "/Thyme_sea.png", // ← adjust to .jpg if needed
    tagline: "A fresh herbal cleanse that keeps roots light and awake.",
    hairType: "Normal to oily hair · scalps that feel heavy or quickly greasy",
    mood: "Think cool morning air over coastal gardens – green, aromatic and quietly energising.",
    ritual:
      "Glide the bar over wet hair or lather between your hands, then massage into the scalp for a slow, circular cleanse. Rinse well and let the herbal steam do the rest.",
    keyIngredients:
      "Rosemary, thyme & mint essential oils, coconut & olive oils, castor oil, shea butter, nettle leaf powder.",
    shopifyUrl: "#", // TODO: replace with real Shopify checkout/product link
  },
  {
    id: "fig",
    name: "Fig & Cedar Nourishing Shampoo Bar",
    img: "/Fig_sea.png",
    tagline: "Creamy comfort for hair that likes extra softness and care.",
    hairType: "Normal to dry hair · sensitised or slightly frizzy lengths",
    mood: "Warm, sun-drenched fig with a hint of cedarwood – like evenings by the sea when the stones are still warm.",
    ritual:
      "Work the bar into a gentle lather and smooth it from roots to lengths, focusing on areas that feel rough or dry. Rinse slowly to keep that supple, velvety finish.",
    keyIngredients:
      "Fig extract, cedarwood & lavender, coconut & olive oils, castor oil, shea butter.",
    shopifyUrl: "#",
  },
  {
    id: "lemon",
    name: "Lemon Sea Breeze Conditioner Bar",
    img: "/Lemon_sea.png",
    tagline: "A light, detangling veil that leaves hair soft but never heavy.",
    hairType: "All hair types · ideal after every wash",
    mood: "Bright lemon peel with a soft, salty breeze – clean, airy and quietly uplifting.",
    ritual:
      "Warm the bar between your hands under the water, then slide it along the mid-lengths and ends. Comb through with fingers, leave for a few breaths, then rinse for easy detangling and shine.",
    keyIngredients:
      "Lemon peel oil, sea minerals, jojoba oil, coconut & olive oils, conditioning esters.",
    shopifyUrl: "#",
  },
];

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-white pt-28 pb-20">
      <section className="mx-auto max-w-6xl px-6 lg:px-10">
      <header className="text-center mb-10 px-4">
  <p className="uppercase tracking-[0.22em] text-xs text-neutral-500">
    Collection
  </p>
  <h1 className="text-2xl sm:text-3xl font-semibold tracking-[0.18em] uppercase text-[#004642] mt-4">
    The Voskopulence Bars
  </h1>
  <p className="mt-3 text-sm sm:text-base text-neutral-700 max-w-2xl mx-auto">
    Three solid bars crafted to COSMOS standards, each with its own
    mood, ritual and hair story – all sharing the same Mediterranean,
    eco-conscious heart.
  </p>
</header>


        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {BARS.map((bar) => (
            <article
              key={bar.id}
              className="flex flex-col rounded-3xl bg-[#f6fbf9] border border-[#8C9A91]/30 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.3)] overflow-hidden"
            >
              {/* Image */}
              <div className="bg-[#e6f2ee]">
                <img
                  src={asset(bar.img)}
                  alt={bar.name}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              {/* Content */}
              <div className="flex flex-col gap-3 p-5 flex-1">
                <h2 className="text-base font-semibold tracking-[0.08em] uppercase text-[#004642]">
                  {bar.name}
                </h2>
                <p className="text-sm text-neutral-800">{bar.tagline}</p>

                <p className="text-[0.7rem] font-medium tracking-[0.18em] uppercase text-neutral-500 mt-1">
                  Suitable for · {bar.hairType}
                </p>

                <p className="text-sm text-neutral-700 mt-1">{bar.mood}</p>

                <p className="text-xs text-neutral-700 mt-1 leading-relaxed">
                  <span className="font-semibold">Ritual · </span>
                  {bar.ritual}
                </p>

                <p className="text-xs text-neutral-600 mt-2">
                  <span className="font-semibold">Key ingredients · </span>
                  {bar.keyIngredients}
                </p>

                <div className="mt-4">
                  <a
                    href={bar.shopifyUrl}
                    className="inline-flex w-full items-center justify-center rounded-full bg-[#004642]
                               px-5 py-2.5 text-[0.78rem] font-semibold tracking-[0.18em] text-white
                               hover:bg-[#015b55] transition-all duration-200 hover:-translate-y-[1px]
                               focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C9A91]/70"
                  >
                    BUY THIS BAR
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-10 text-[0.7rem] text-neutral-500 text-center max-w-3xl mx-auto">
          All Voskopulence bars are vegan, cruelty-free and formulated without palm oil.
          For full INCI lists and detailed usage advice, please refer to the product
          packaging or the information leaflet included with your order.
        </p>
      </section>
    </main>
  );
}
