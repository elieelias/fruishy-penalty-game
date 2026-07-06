import Image from "next/image";

export default function QrScanned() {
  return (
    <main className="fixed inset-0 z-50 flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-tertiary-fixed px-6 py-10 text-center">
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#1c1b1b 2px, transparent 2px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center">
        <Image
          alt="A crying chicken"
          className="h-auto w-[min(72vw,340px)] object-contain drop-shadow-xl"
          height={1536}
          priority
          src="/game-assets/crying-chicken.png"
          width={1024}
        />

        <h1 className="mt-2 font-headline-lg-mobile text-4xl font-black uppercase leading-none text-on-background md:text-5xl">
          Uh-oh! This code is used
        </h1>
        <p className="mt-4 max-w-sm font-body-md text-base leading-relaxed text-on-tertiary-fixed-variant">
          It looks like this QR code has already been scanned. Grab a fresh
          juice to get a new code and play again!
        </p>
      </div>
    </main>
  );
}
