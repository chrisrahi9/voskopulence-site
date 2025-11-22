// app/contact/page.tsx
"use client";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white pt-[112px] pb-20">
      <section className="mx-auto max-w-screen-md px-6 lg:px-8">
        <h1 className="heading-script text-4xl sm:text-5xl text-[#004642] mb-4">
          Contact
        </h1>
        <p className="text-neutral-700 mb-8">
          Questions about your order, our formulas, or wholesale? We’d love to hear from you.
        </p>

        <div className="space-y-4 text-sm text-neutral-700 mb-10">
          <p>
            <span className="font-semibold">Email:</span>{" "}
            <a
              href="mailto:hello@voskopulence.com"
              className="underline underline-offset-2 hover:text-[#004642]"
            >
              hello@voskopulence.com
            </a>
          </p>
          <p>
            <span className="font-semibold">Instagram:</span>{" "}
            <a
              href="https://instagram.com/voskopulence"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-[#004642]"
            >
              @voskopulence
            </a>
          </p>
        </div>

        {/* Simple form (can be wired later) */}
        <form
          className="space-y-4 rounded-3xl border border-[#8C9A91]/30 bg-[#f6fbf9] p-6 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.25)]"
          action="mailto:hello@voskopulence.com"
          method="post"
          encType="text/plain"
        >
          <div>
            <label className="block text-sm font-medium text-neutral-800 mb-1">
              Name
            </label>
            <input
              type="text"
              name="name"
              className="w-full rounded-xl border border-[#c4d3ca] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#004642]/60"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-800 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              className="w-full rounded-xl border border-[#c4d3ca] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#004642]/60"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-800 mb-1">
              Message
            </label>
            <textarea
              name="message"
              rows={4}
              className="w-full rounded-xl border border-[#c4d3ca] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#004642]/60 resize-none"
              required
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-[#004642] px-6 py-2.5 text-sm font-semibold text-white tracking-[0.08em] hover:bg-[#015b55] transition-all duration-200"
          >
            Send message
          </button>
        </form>
      </section>
    </main>
  );
}
