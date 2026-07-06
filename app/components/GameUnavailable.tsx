export default function GameUnavailable() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#fcf9f8] p-4">
      <div className="w-full max-w-lg rounded-xl border-4 border-on-background bg-surface p-8 text-center hard-shadow">
        <h1 className="font-headline-lg-mobile text-3xl font-black uppercase text-on-background">
          Game temporarily unavailable
        </h1>
        <p className="mt-4 font-body-md text-on-surface-variant">
          Your QR code has not been used. Please try again in a moment.
        </p>
      </div>
    </main>
  );
}
