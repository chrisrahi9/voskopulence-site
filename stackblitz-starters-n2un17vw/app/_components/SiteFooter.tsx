export default function SiteFooter() {
  return (
    <footer className="bg-[#003f3b] text-[#f7f1e7]">
      <div className="mx-auto max-w-screen-2xl px-6 lg:px-10 py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_0.8fr_0.8fr] lg:gap-16">
          <div className="max-w-xl">
            <p className="luxury-kicker text-[#d8c8ad]">Mediterranean haircare · Pre-launch</p>
            <h2 className="mt-5 heading-editorial text-4xl sm:text-5xl leading-[0.95] text-white">
              Rituals inspired by the coast, concentrated into solid form.
            </h2>
            <p className="mt-6 max-w-lg text-sm sm:text-base leading-relaxed text-white/72">
              Botanical shampoo and conditioner bars developed with naturally derived ingredients,
              considered formulation principles and a lower-waste format.
            </p>
            <a
              href="/shop"
              className="mt-8 inline-flex items-center gap-3 border-b border-[#d8c8ad]/70 pb-1 text-sm tracking-[0.14em] uppercase text-[#f7f1e7] transition-opacity hover:opacity-70"
            >
              Explore the collection
              <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#d8c8ad]">Discover</p>
            <nav className="mt-5 flex flex-col gap-3 text-sm text-white/78" aria-label="Footer navigation">
              <a className="footer-link" href="/shop">Shop</a>
              <a className="footer-link" href="/#about">About</a>
              <a className="footer-link" href="/sustainability">Sustainability</a>
              <a className="footer-link" href="/contact">Contact</a>
            </nav>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#d8c8ad]">Contact</p>
            <div className="mt-5 space-y-3 text-sm text-white/78">
              <a className="footer-link block" href="mailto:hello@voskopulence.com">
                hello@voskopulence.com
              </a>
              <p className="leading-relaxed text-white/56">
                Product questions, ingredients and wholesale enquiries are welcome.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-white/14 pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-[0.7rem] uppercase tracking-[0.16em] text-white/46">
          <span>© 2026 Voskopulence</span>
          <span>Designed around Mediterranean botanicals</span>
        </div>
      </div>
    </footer>
  );
}
