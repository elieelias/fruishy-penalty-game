export default function LoadingGameToken() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fcf9f8] px-6 text-center">
      <div className="w-full max-w-sm rounded-2xl border-4 border-on-background bg-white p-7 shadow-[6px_6px_0_0_#1c1b1b]">
        <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-outline-variant border-t-primary" />
        <h1 className="font-headline-lg-mobile text-2xl font-black uppercase text-on-surface">
          Checking your game code
        </h1>
        <p className="mt-2 font-body-md text-sm font-semibold text-on-surface-variant">
          This should only take a few seconds.
        </p>
        <div className="my-4 border-t-2 border-dashed border-outline-variant" />
        <div dir="rtl" lang="ar">
          <h2 className="text-xl font-black text-on-surface">جارٍ التحقق من رمز اللعبة</h2>
          <p className="mt-1 text-sm font-semibold text-on-surface-variant">
            يجب ألا يستغرق ذلك سوى بضع ثوانٍ.
          </p>
        </div>
      </div>
    </main>
  );
}
