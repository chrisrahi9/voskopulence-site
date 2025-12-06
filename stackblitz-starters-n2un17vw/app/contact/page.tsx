"use client";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white pt-28 pb-20 px-6 lg:px-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="heading-script text-4xl sm:text-5xl text-[#004642] text-center mb-4">
          Contact us
        </h1>
        <p className="text-center text-neutral-700 max-w-2xl mx-auto mb-10 text-sm sm:text-base">
          Questions about the bars, ingredients, or wholesale? Send us a message
          and we&apos;ll get back to you as soon as we can.
        </p>

        <div className="rounded-3xl bg-[#f6fbf9] border border-[#8C9A91]/30 p-6 lg:p-8 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.3)]">
         <form
  action="https://formsubmit.co/info@voskopulence.com"
  method="POST"
  className="space-y-4"
>
  <input type="hidden" name="_captcha" value="false" />

  {/* Custom subject so you know this came from the contact form */}
  <input type="hidden" name="_subject" value="New message from Voskopulence contact form" />

  {/* Redirect to a DIFFERENT thank-you page */}
  <input
    type="hidden"
    name="_next"
    value="https://voskopulence-site.vercel.app/contact/thank-you"
  />

  <label className="block text-sm text-neutral-600">Your Email</label>
  <input
    type="email"
    name="email"
    required
    className="w-full border px-3 py-2 rounded-lg"
  />

  <label className="block text-sm text-neutral-600">Message</label>
  <textarea
    name="message"
    required
    rows={4}
    className="w-full border px-3 py-2 rounded-lg"
  ></textarea>

  <button
    type="submit"
    className="inline-flex w-full items-center justify-center rounded-full bg-[#004642]
               px-4 py-2.5 text-sm font-semibold tracking-[0.12em] text-white
               hover:bg-[#015b55] transition-all duration-200"
  >
    Send Message
  </button>
</form>


          <p className="mt-4 text-[0.75rem] text-neutral-500 text-center sm:text-left">
            You can also write to us directly at{" "}
            <a
              href="mailto:info@voskopulence.com"
              className="underline underline-offset-2"
            >
              info@voskopulence.com
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
