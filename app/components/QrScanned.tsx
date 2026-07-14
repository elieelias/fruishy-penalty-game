"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { LeaderboardEntry } from "../types";

export default function QrScanned({
  initialTopPlayer = null,
}: {
  initialTopPlayer?: LeaderboardEntry | null;
}) {
  const [topPlayer, setTopPlayer] = useState(initialTopPlayer);

  useEffect(() => {
    if (initialTopPlayer) return;

    const controller = new AbortController();

    void fetch("/api/game/leaderboard", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) return null;
        return response.json() as Promise<{ leaderboard?: LeaderboardEntry[] }>;
      })
      .then((body) => {
        if (body?.leaderboard) {
          setTopPlayer(body.leaderboard[0] ?? null);
        }
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Unable to load today's top player.", error);
        }
      });

    return () => controller.abort();
  }, [initialTopPlayer]);

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

        {topPlayer && (
          <section className="mt-7 w-full max-w-md -rotate-1 rounded-xl sticker-border bg-inverse-surface px-5 py-4 text-left text-white hard-shadow-lg">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg border-3 border-white bg-tertiary-fixed font-headline-lg-mobile text-2xl font-black text-on-tertiary-fixed">
                #1
              </div>
              <div className="min-w-0 flex-grow">
                <p className="font-label-bold text-[10px] uppercase tracking-[0.18em] text-white/55">
                  Player to beat today
                </p>
                <p className="truncate font-headline-lg-mobile text-xl font-black uppercase leading-tight text-white">
                  {topPlayer.name}
                </p>
              </div>
              <div className="text-right">
                <p className="font-headline-lg-mobile text-xl font-black text-secondary-fixed">
                  {topPlayer.points.toLocaleString()}
                </p>
                <p className="font-label-bold text-[9px] uppercase tracking-wider text-white/50">
                  points
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
