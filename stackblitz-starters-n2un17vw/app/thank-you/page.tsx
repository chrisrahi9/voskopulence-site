export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-white pt-28 pb-20 px-6 lg:px-10">
      <div className="max-w-xl mx-auto text-center">
        <h1 className="heading-script text-4xl sm:text-5xl text-[#004642] mb-4">
          You&apos;re on the list
        </h1>
        <p className="text-neutral-700 text-sm sm:text-base">
          Thank you for your interest in Voskopulence. We&apos;ll email you as soon
          as this bar is ready for its first batch.
        </p>
        <p className="mt-3 text-xs text-neutral-500">
          If you think you made a typo in your email address, you can simply go
          back and submit the form again.
        </p>

        <a
          href="/shop"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-[#004642]
                     px-6 py-2.5 text-sm font-semibold tracking-[0.12em] text-white
                     hover:bg-[#015b55] transition-all duration-200"
        >
          Back to the collection
        </a>
      </div>
    </main>
  );
}
