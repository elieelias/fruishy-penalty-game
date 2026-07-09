'use client'

import React from "react";
import Image from "next/image";
import type { LeaderboardEntry } from "../types";

interface CoachTipsScreenProps {
    onPlay: () => void;
    playerName: string;
    topPlayer: LeaderboardEntry | null;
}

export default function CoachTipsScreen({ onPlay, playerName, topPlayer }: CoachTipsScreenProps) {
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

            {topPlayer && (
                <section className="relative overflow-hidden rounded-xl sticker-border bg-inverse-surface px-5 py-4 hard-shadow-lg text-white">
                    <div className="absolute -right-5 -top-7 rotate-12 text-[88px] text-white/5">
                        <span className="material-symbols-outlined text-[88px]">emoji_events</span>
                    </div>
                    <div className="relative flex items-center gap-4">
                        <div className="flex h-14 w-14 flex-shrink-0 -rotate-3 items-center justify-center rounded-lg border-3 border-white bg-tertiary-fixed font-headline-lg-mobile text-2xl font-black text-on-tertiary-fixed">
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

            {/* Instructions read as one guide rather than three buttons */}
            <section className="flex flex-col gap-3">
                <div className="flex items-end justify-between px-1">
                    <h2 className="font-headline-lg-mobile text-2xl font-black uppercase italic text-on-surface">
                        How to cross
                    </h2>
                    <span className="font-label-bold text-[10px] uppercase tracking-[0.16em] text-outline">
                        3 quick rules
                    </span>
                </div>

                <div className="overflow-hidden rounded-xl sticker-border bg-white hard-shadow-lg">
                    <div className="grid grid-cols-[42px_48px_1fr] items-center gap-3 px-4 py-4">
                        <span className="font-headline-lg-mobile text-3xl font-black text-secondary">
                            01
                        </span>
                        <span className="material-symbols-outlined text-3xl text-secondary select-none">
                            touch_app
                        </span>
                        <div>
                            <h3 className="font-headline-lg-mobile text-lg font-black uppercase leading-tight text-on-surface">
                                Tap to hop forward
                            </h3>
                            <p className="mt-0.5 font-body-md text-xs font-semibold text-on-surface-variant">
                                Keep moving and build your combo.
                            </p>
                        </div>
                    </div>

                    <div className="mx-4 border-t-2 border-dashed border-outline-variant" />

                    <div className="grid grid-cols-[42px_48px_1fr] items-center gap-3 px-4 py-4">
                        <span className="font-headline-lg-mobile text-3xl font-black text-tertiary">
                            02
                        </span>
                        <span className="material-symbols-outlined text-3xl text-tertiary select-none">
                            swipe
                        </span>
                        <div>
                            <h3 className="font-headline-lg-mobile text-lg font-black uppercase leading-tight text-on-surface">
                                Swipe to change lanes
                            </h3>
                            <p className="mt-0.5 font-body-md text-xs font-semibold text-on-surface-variant">
                                Move left or right to find a safe path.
                            </p>
                        </div>
                    </div>

                    <div className="mx-4 border-t-2 border-dashed border-outline-variant" />

                    <div className="grid grid-cols-[42px_48px_1fr] items-center gap-3 px-4 py-4">
                        <span className="font-headline-lg-mobile text-3xl font-black text-primary">
                            03
                        </span>
                        <span className="material-symbols-outlined text-3xl text-primary select-none">
                            traffic
                        </span>
                        <div>
                            <h3 className="font-headline-lg-mobile text-lg font-black uppercase leading-tight text-on-surface">
                                Read every hazard
                            </h3>
                            <p className="mt-0.5 font-body-md text-xs font-semibold text-on-surface-variant">
                                Dodge traffic, trains, and water.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="flex flex-col gap-3">
                <div className="flex items-end justify-between px-1">
                    <h2 className="font-headline-lg-mobile text-2xl font-black uppercase italic text-on-surface">
                        Power-ups
                    </h2>
                    <span className="font-label-bold text-[10px] uppercase tracking-[0.16em] text-outline">
                        Collect on the pitch
                    </span>
                </div>

                <div className="grid grid-cols-3 overflow-hidden rounded-xl sticker-border bg-inverse-surface text-white hard-shadow">
                    <div className="flex flex-col items-center gap-1.5 px-2 py-4 text-center">
                        <div className="relative h-8 w-10 text-yellow-300">
                            <span className="material-symbols-outlined absolute left-0 top-1 text-2xl">
                                sports_soccer
                            </span>
                            <span className="material-symbols-outlined absolute right-0 top-0 text-2xl">
                                sports_soccer
                            </span>
                        </div>
                        <p className="font-headline-lg-mobile text-xs font-black uppercase">
                            Double score
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-1.5 border-x-2 border-white/15 px-2 py-4 text-center">
                        <span className="material-symbols-outlined text-3xl text-purple-300">
                            shield
                        </span>
                        <p className="font-headline-lg-mobile text-xs font-black uppercase">
                            Safe shield
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-1.5 px-2 py-4 text-center">
                        <span className="material-symbols-outlined text-3xl text-cyan-300">
                            timer
                        </span>
                        <p className="font-headline-lg-mobile text-xs font-black uppercase">
                            Slow traffic
                        </p>
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
