'use client'

import React from "react";
import Image from "next/image";
import type { LeaderboardEntry } from "../types";

interface CoachTipsScreenProps {
    onPlay: () => void;
    playerName: string;
    topPlayer: LeaderboardEntry | null;
    showRoadGuide?: boolean;
}

export default function CoachTipsScreen({
    onPlay,
    playerName,
    topPlayer,
    showRoadGuide = true,
}: CoachTipsScreenProps) {
    return (
        <div className="flex-grow pt-8 pb-32 px-4 flex flex-col gap-8 max-w-[600px] mx-auto w-full relative z-10">
            {showRoadGuide && (
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
                            <div className="absolute -left-2 bottom-4 w-4 h-4 bg-white border-l-4 border-b-4 border-on-background rotate-45"></div>
                        </div>
                    </div>
                </section>
            )}

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

            <section className="flex flex-col gap-3">
                <div className="flex items-end justify-between px-1">
                    <h2 className="font-headline-lg-mobile text-2xl font-black uppercase italic text-on-surface">
                        How to play <span className="text-primary">/ طريقة اللعب</span>
                    </h2>
                    <span className="font-label-bold text-[10px] uppercase tracking-[0.16em] text-outline">
                        4 quick rules<br /><span lang="ar" dir="rtl">٤ قواعد سريعة</span>
                    </span>
                </div>

                <div className="overflow-hidden rounded-xl sticker-border bg-white hard-shadow-lg">
                    <div className="grid grid-cols-[34px_42px_1fr] items-start gap-3 px-4 py-4">
                        <span className="font-headline-lg-mobile text-3xl font-black text-secondary">
                            01
                        </span>
                        <span className="material-symbols-outlined text-3xl text-secondary select-none">
                            gamepad
                        </span>
                        <div>
                            <h3 className="font-headline-lg-mobile text-lg font-black uppercase leading-tight text-on-surface">
                                Move in all 4 directions
                            </h3>
                            <p className="mt-1 font-body-md text-xs font-semibold leading-snug text-on-surface-variant">
                                Use ↑ ↓ ← → to move forward, backward, left, and right.
                            </p>
                            <p className="mt-1 text-right font-body-md text-sm font-bold leading-snug text-on-surface" dir="rtl" lang="ar">
                                استخدم أزرار ↑ ↓ ← → للتحرّك إلى الأمام والخلف واليمين واليسار.
                            </p>
                        </div>
                    </div>

                    <div className="mx-4 border-t-2 border-dashed border-outline-variant" />

                    <div className="grid grid-cols-[34px_42px_1fr] items-start gap-3 px-4 py-4">
                        <span className="font-headline-lg-mobile text-3xl font-black text-tertiary">
                            02
                        </span>
                        <span className="material-symbols-outlined text-3xl text-tertiary select-none">
                            directions_car
                        </span>
                        <div>
                            <h3 className="font-headline-lg-mobile text-lg font-black uppercase leading-tight text-on-surface">
                                Watch the traffic
                            </h3>
                            <p className="mt-1 font-body-md text-xs font-semibold leading-snug text-on-surface-variant">
                                Check both directions and cross when there is a safe gap.
                            </p>
                            <p className="mt-1 text-right font-body-md text-sm font-bold leading-snug text-on-surface" dir="rtl" lang="ar">
                                راقب الاتجاهين واعبر عندما تجد فجوة آمنة بين السيارات.
                            </p>
                        </div>
                    </div>

                    <div className="mx-4 border-t-2 border-dashed border-outline-variant" />

                    <div className="grid grid-cols-[34px_42px_1fr] items-start gap-3 px-4 py-4">
                        <span className="font-headline-lg-mobile text-3xl font-black text-primary">
                            03
                        </span>
                        <span className="material-symbols-outlined text-3xl text-primary select-none">
                            water
                        </span>
                        <div>
                            <h3 className="font-headline-lg-mobile text-lg font-black uppercase leading-tight text-on-surface">
                                Wait for the raft
                            </h3>
                            <p className="mt-1 font-body-md text-xs font-semibold leading-snug text-on-surface-variant">
                                You cannot jump over water. Wait, then hop onto the raft.
                            </p>
                            <p className="mt-1 text-right font-body-md text-sm font-bold leading-snug text-on-surface" dir="rtl" lang="ar">
                                لا يمكنك القفز فوق الماء. انتظر الطوف ثم اقفز عليه.
                            </p>
                        </div>
                    </div>

                    <div className="mx-4 border-t-2 border-dashed border-outline-variant" />

                    <div className="grid grid-cols-[34px_42px_1fr] items-start gap-3 px-4 py-4">
                        <span className="font-headline-lg-mobile text-3xl font-black text-red-500">
                            04
                        </span>
                        <span className="material-symbols-outlined select-none text-3xl text-red-500">
                            train
                        </span>
                        <div>
                            <h3 className="font-headline-lg-mobile text-lg font-black uppercase leading-tight text-on-surface">
                                Stop for the train
                            </h3>
                            <p className="mt-1 font-body-md text-xs font-semibold leading-snug text-on-surface-variant">
                                Stop at the tracks and wait until the train has passed.
                            </p>
                            <p className="mt-1 text-right font-body-md text-sm font-bold leading-snug text-on-surface" dir="rtl" lang="ar">
                                توقّف عند السكة وانتظر مرور القطار قبل العبور.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="flex flex-col gap-3">
                <div className="flex items-end justify-between px-1">
                    <h2 className="font-headline-lg-mobile text-2xl font-black uppercase italic text-on-surface">
                        Power-ups <span className="text-primary">/ التعزيزات</span>
                    </h2>
                    <span className="font-label-bold text-[10px] uppercase tracking-[0.16em] text-outline">
                        Collect while playing<br /><span lang="ar" dir="rtl">اجمعها أثناء اللعب</span>
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
                            Double score<br /><span lang="ar" dir="rtl">نقاط مضاعفة</span>
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-1.5 border-x-2 border-white/15 px-2 py-4 text-center">
                        <span className="material-symbols-outlined text-3xl text-purple-300">
                            shield
                        </span>
                        <p className="font-headline-lg-mobile text-xs font-black uppercase">
                            Safe shield<br /><span lang="ar" dir="rtl">درع حماية</span>
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-1.5 px-2 py-4 text-center">
                        <span className="material-symbols-outlined text-3xl text-cyan-300">
                            timer
                        </span>
                        <p className="font-headline-lg-mobile text-xs font-black uppercase">
                            Slow traffic<br /><span lang="ar" dir="rtl">إبطاء السيارات</span>
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA Button */}
            <button
                onClick={onPlay}
                className="bg-primary-container hover:bg-orange-500 text-white py-5 rounded-xl sticker-border hard-shadow-lg font-headline-lg-mobile text-2xl uppercase italic hover:scale-[1.02] active:translate-y-1 active:shadow-none transition-all mt-4 cursor-pointer text-center flex items-center justify-center gap-2 shadow-[4px_4px_0_0_#1c1b1b]"
            >
                <span>GOT IT! LET&apos;S PLAY <span className="block text-base not-italic" lang="ar" dir="rtl">فهمت، لنبدأ اللعب!</span></span>
                <span className="material-symbols-outlined select-none text-2xl">directions_run</span>
            </button>
        </div>
    );
}
