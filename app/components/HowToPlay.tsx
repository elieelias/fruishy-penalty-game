'use client'

import React from "react";
import Image from "next/image";

interface CoachTipsScreenProps {
    onPlay: () => void;
    playerName: string;
}

export default function CoachTipsScreen({ onPlay, playerName }: CoachTipsScreenProps) {
    return (
        <div className="flex-grow pt-8 pb-32 px-4 flex flex-col gap-8 max-w-[600px] mx-auto w-full relative z-10">
            {/* Section 1: ROAD GUIDE */}
            <section className="flex flex-col gap-4">
                <h2 className="font-headline-lg-mobile text-3xl uppercase italic text-primary select-none drop-shadow-sm">
                    Road Guide
                </h2>
                <div className="flex items-end gap-2">
                    <div className="w-28 h-36 md:w-32 md:h-40 flex-shrink-0 sticker-border rounded-xl bg-primary-container overflow-hidden hard-shadow">
                        <Image
                            alt="Road guide chicken"
                            className="w-full h-full object-cover"
                            src="/game-assets/road-guide.webp"
                            width={128}
                            height={160}
                        />
                    </div>
                    <div className="relative bg-white sticker-border rounded-2xl p-4 hard-shadow mb-4 flex-grow">
                        <p className="font-label-bold text-[13px] md:text-sm uppercase text-on-surface leading-tight select-none">
                            &ldquo;READY, {playerName || "CROSSER"}? KEEP MOVING, WATCH EVERY LANE, AND USE SAFE GRASS TO PLAN YOUR NEXT HOP!&rdquo;
                        </p>
                        {/* Speech Bubble Tail */}
                        <div className="absolute -left-2 bottom-4 w-4 h-4 bg-white border-l-4 border-b-4 border-on-background rotate-45"></div>
                    </div>
                </div>
            </section>

            {/* Section 2: Instructions Bento Grid */}
            <section className="flex flex-col gap-5">
                {/* Step 1 */}
                <div className="bg-secondary-container sticker-border p-5 rounded-xl hard-shadow-lg flex items-center gap-5 animate-float">
                    <div className="bg-white rounded-full p-3.5 sticker-border flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-4xl text-on-secondary-container select-none">
                            touch_app
                        </span>
                    </div>
                    <div>
                        <h3 className="font-headline-lg-mobile text-xl text-on-secondary-container uppercase font-black leading-tight">
                            1. TAP TO HOP FORWARD
                        </h3>
                    </div>
                </div>

                {/* Step 2 */}
                <div className="bg-tertiary-fixed sticker-border p-5 rounded-xl hard-shadow-lg flex items-center gap-5 animate-float-delayed">
                    <div className="bg-white rounded-full p-3.5 sticker-border flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-4xl text-tertiary select-none">
                            swipe
                        </span>
                    </div>
                    <div>
                        <h3 className="font-headline-lg-mobile text-l text-tertiary uppercase font-black leading-tight">
                            2. SWIPE TO CHANGE LANES
                        </h3>
                    </div>
                </div>

                {/* Step 3 */}
                <div className="bg-primary-container sticker-border p-5 rounded-xl hard-shadow-lg flex items-center gap-5 animate-float-more">
                    <div className="bg-white rounded-full p-3.5 sticker-border flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-4xl text-primary select-none">
                            redeem
                        </span>
                    </div>
                    <div>
                        <h3 className="font-headline-lg-mobile text-xl text-on-primary-container uppercase font-black leading-tight">
                            3. DODGE TRAFFIC, TRAINS & WATER
                        </h3>
                    </div>
                </div>
            </section>

            {/* CTA Button */}
            <button
                onClick={onPlay}
                className="bg-primary-container hover:bg-orange-500 text-white py-5 rounded-xl sticker-border hard-shadow-lg font-headline-lg-mobile text-2xl uppercase italic hover:scale-[1.02] active:translate-y-1 active:shadow-none transition-all mt-4 cursor-pointer text-center flex items-center justify-center gap-2 shadow-[4px_4px_0_0_#1c1b1b]"
            >
                <span>GOT IT! LET&apos;S PLAY</span>
                <span className="material-symbols-outlined select-none text-2xl">directions_run</span>
            </button>
        </div>
    );
}
