export default function GameUnavailable() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#fcf9f8] p-4">
      <div className="w-full max-w-lg rounded-xl border-4 border-on-background bg-surface p-8 text-center hard-shadow">
        <h1 className="font-headline-lg-mobile text-3xl font-black uppercase text-on-background">
          Game temporarily unavailable
        </h1>
        <p className="mt-4 font-body-md text-on-surface-variant">
          We could not check this QR code right now. Please try again in a moment.
        </p>
        <p className="mt-2 font-body-md font-semibold text-on-surface-variant" dir="rtl" lang="ar">
          تعذّر التحقق من رمز اللعبة الآن. يُرجى المحاولة مجدداً بعد قليل.
        </p>
        <a
          className="mt-6 inline-flex rounded-xl border-2 border-on-background bg-primary-container px-6 py-3 font-black uppercase text-on-primary-container shadow-[3px_3px_0_0_#1c1b1b] active:translate-y-0.5 active:shadow-none"
          href=""
        >
          Try again&nbsp; / &nbsp;<span dir="rtl" lang="ar">حاول مجدداً</span>
        </a>
      </div>
    </main>
  );
}
