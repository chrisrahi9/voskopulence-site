"use client";

import { useState } from "react";

const FORMS_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbyY-t0Mwa_LxylYoVhsIFxz1FzkPQo7OWFXDdLz5-7W64NMZIO3hgQFO3MpDFd8TOfY/exec"; // <-- paste your Apps Script URL here

export default function ContactPage() {
  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");
    const message = String(formData.get("message") || "");

    try {
      await fetch(FORMS_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({
          type: "contact",
          name,
          email,
          message,
          page:
            typeof window !== "undefined"
              ? window.location.pathname
              : "/contact",
          userAgent:
            typeof navigator !== "undefined"
              ? navigator.userAgent
              : "",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        // we don't care about the response body, only "fire and forget"
        mode: "no-cors",
      });

      setStatus("sent");
      form.reset();
    } catch (err) {
      setStatus("error");
    }
  };

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
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm text-neutral-600 mb-1">
                Your name
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="John Doe"
                className="w-full border border-[#c4d3ca] px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#004642]/60"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-neutral-600 mb-1">
                Email address
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                className="w-full border border-[#c4d3ca] px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#004642]/60"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm text-neutral-600 mb-1">
                Message
              </label>
              <textarea
                name="message"
                required
                rows={4}
                placeholder="Write your message here..."
                className="w-full border border-[#c4d3ca] px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#004642]/60 resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className="mt-2 inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-[#004642]
                         px-6 py-2.5 text-sm font-semibold tracking-[0.12em] text-white
                         hover:bg-[#015b55] transition-all duration-200 disabled:opacity-60"
            >
              {status === "sending" ? "Sending..." : "Send message"}
            </button>

            {status === "sent" && (
              <p className="mt-3 text-sm text-emerald-700">
                Thank you for contacting us. We&apos;ll get back to you as soon as
                possible.
              </p>
            )}
            {status === "error" && (
              <p className="mt-3 text-sm text-red-600">
                Something went wrong. Please try again in a moment.
              </p>
            )}
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
