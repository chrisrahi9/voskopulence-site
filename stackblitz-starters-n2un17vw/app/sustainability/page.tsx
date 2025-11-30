"use client";

const ASSETS = "https://cdn.voskopulence.com";
const asset = (p: string) => `${ASSETS}${p}`;

export default function SustainabilityPage() {
  return (
    <main className="min-h-screen bg-white pt-28 pb-20">
      <section className="mx-auto max-w-5xl px-6 lg:px-10">
        {/* HERO */}
        <header className="mb-10">
          <p className="uppercase tracking-[0.22em] text-xs text-neutral-500">
            Sustainability & Formulation
          </p>
          <h1 className="heading-script text-4xl sm:text-5xl text-[#004642] mt-3">
            How our bars are crafted
          </h1>
          <p className="mt-4 text-sm sm:text-base text-neutral-700 max-w-3xl">
            Voskopulence was created around one idea: hair care that feels
            indulgent, but respects your scalp, the people who make it, and the
            places that inspired it. Here is how we think about COSMOS standards,
            ingredients and sustainability – in simple, transparent terms.
          </p>
        </header>

        {/* COSMOS EXPLAINER */}
        <section className="mt-10 rounded-3xl bg-[#f6fbf9] border border-[#8C9A91]/30 p-6 lg:p-7 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)]">
          <h2 className="text-base font-semibold tracking-[0.14em] uppercase text-[#004642]">
            What does “COSMOS” mean?
          </h2>
          <p className="mt-3 text-sm text-neutral-700">
            COSMOS is an independent European standard that defines how
            natural and organic cosmetics should be made. It covers:
          </p>
          <ul className="mt-3 text-sm text-neutral-700 list-disc list-inside space-y-1">
            <li>Which ingredients are allowed and in what form</li>
            <li>Minimum levels of natural / organic content</li>
            <li>Rules on animal testing, biodegradable ingredients &amp; GMOs</li>
            <li>Packaging, traceability and how formulas are checked by auditors</li>
          </ul>
          <p className="mt-3 text-xs text-neutral-600">
            In short: COSMOS is about safe, well-documented formulas with a lower
            impact on people and the environment – not just marketing words like
            “green” or “clean”.
          </p>
        </section>

        {/* HOW VOSKOPULENCE FITS */}
        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-[#004642] text-white p-6 lg:p-7 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.38)]">
            <h2 className="text-sm font-semibold tracking-[0.18em] uppercase">
              Our formulation philosophy
            </h2>
            <p className="mt-3 text-sm text-white/90">
              Our bars are developed with a European lab that works with
              COSMOS-compliant formulations. For Voskopulence, we focus on:
            </p>
            <ul className="mt-3 text-sm text-white/90 list-disc list-inside space-y-1">
              <li>High share of naturally-derived ingredients</li>
              <li>Vegan &amp; cruelty-free formulations</li>
              <li>No deliberately added palm oil in the bar base</li>
              <li>Botanical scents inspired by the Mediterranean</li>
            </ul>
            <p className="mt-3 text-xs text-white/80">
              As we finalise each bar, we work with the lab to ensure it fits the
              requirements for COSMOS-style formulations and good scalp tolerance.
            </p>
          </div>

          <div className="rounded-3xl bg-[#f6fbf9] border border-[#8C9A91]/30 p-6 lg:p-7">
            <h2 className="text-sm font-semibold tracking-[0.18em] uppercase text-[#004642]">
              Solid bars, less waste
            </h2>
            <p className="mt-3 text-sm text-neutral-700">
              A solid bar means:
            </p>
            <ul className="mt-3 text-sm text-neutral-700 list-disc list-inside space-y-1">
              <li>No plastic bottle for the product itself</li>
              <li>Much less water shipped compared with liquid shampoo</li>
              <li>Compact format that’s easier to ship and store</li>
            </ul>
            <p className="mt-3 text-xs text-neutral-600">
              Packaging for Voskopulence bars is designed to be simple,
              protective and fully recyclable, with a focus on paper and
              cardboard rather than mixed materials.
            </p>
          </div>
        </section>

        {/* HONESTY / TRANSPARENCY BLOCK */}
        <section className="mt-10 rounded-3xl bg-[#fffaf3] border border-[#e8d7b8] p-6 lg:p-7">
          <h2 className="text-sm font-semibold tracking-[0.18em] uppercase text-[#7a5a2f]">
            A note on certifications &amp; honesty
          </h2>
          <p className="mt-3 text-sm text-[#55412a]">
            We believe sustainability also means being honest about where we are
            today:
          </p>
          <ul className="mt-3 text-sm text-[#55412a] list-disc list-inside space-y-1">
            <li>
              Our goal is to launch bars that are compatible with COSMOS-style
              requirements, using ingredients and bases that can be certified.
            </li>
            <li>
              Official third-party certification (logos on pack, audited
              documents, etc.) is a separate step and will be clearly indicated
              when obtained.
            </li>
            <li>
              Until then, we do not claim to be “certified COSMOS”; we simply
              share how and why the formulas are designed in that direction.
            </li>
          </ul>
          <p className="mt-3 text-xs text-[#6c5434]">
            If you ever have questions about ingredients, allergens or how to
            recycle our packaging in your country, you can always reach us at{" "}
            <a
              href="mailto:hello@voskopulence.com"
              className="underline underline-offset-2"
            >
              hello@voskopulence.com
            </a>
            .
          </p>
        </section>

        {/* FAQ STYLE BOTTOM BLOCK */}
        <section className="mt-10 space-y-5 text-sm text-neutral-800">
          <div>
            <h3 className="font-semibold">
              Are Voskopulence bars officially COSMOS certified?
            </h3>
            <p className="mt-1">
              Not yet. Our current focus is on working with a lab that develops
              COSMOS-style formulas and on choosing ingredients that fit that
              philosophy. Once official certification is in place, it will be
              clearly visible on our packaging and on this page.
            </p>
          </div>

          <div>
            <h3 className="font-semibold">
              Are the bars suitable for vegans and cruelty-free?
            </h3>
            <p className="mt-1">
              Our intention for Voskopulence is to keep all bars vegan and not
              tested on animals. We confirm this with our manufacturing partner
              for each batch and will never knowingly work with animal testing.
            </p>
          </div>

          <div>
            <h3 className="font-semibold">
              Do the formulas contain sulfates or harsh detergents?
            </h3>
            <p className="mt-1">
              The bars are formulated with gentler, modern surfactants that are
              compatible with COSMOS-style guidelines, rather than traditional
              SLS/SLES. They are designed to cleanse effectively while remaining
              respectful of the scalp when used as directed.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
