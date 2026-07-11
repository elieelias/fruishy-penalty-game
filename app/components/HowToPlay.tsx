'use client'

import React from "react";
import type { LeaderboardEntry } from "../types";

interface CoachTipsScreenProps {
    onPlay: () => void;
    topPlayer: LeaderboardEntry | null;
}

export default function CoachTipsScreen({
    onPlay,
    topPlayer,
}: CoachTipsScreenProps) {
    return (
        <div className="flex-grow pt-8 pb-32 px-4 flex flex-col gap-8 max-w-[600px] mx-auto w-full relative z-10">
            {topPlayer && (
                <section className="relative overflow-hidden rounded-xl sticker-border bg-inverse-surface px-5 py-4 hard-shadow-lg text-white">
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
                        <span aria-hidden="true" className="select-none text-3xl text-secondary">
                            ↕
                        </span>
                        <div>
                            <h3 className="font-headline-lg-mobile text-lg font-black uppercase leading-tight text-on-surface">
                                Tap &amp; swipe to move
                            </h3>
                            <p className="mt-1 font-body-md text-xs font-semibold leading-snug text-on-surface-variant">
                                Tap or swipe up to go forward. Swipe left or right to move sideways, and down to go backward.
                            </p>
                            <p className="mt-1 text-right font-body-md text-sm font-bold leading-snug text-on-surface" dir="rtl" lang="ar">
                                انقر أو اسحب للأعلى للتقدّم، اسحب يميناً أو يساراً للتحرّك جانبياً، واسحب للأسفل للرجوع.
                            </p>
                        </div>
                    </div>

                    <div className="mx-4 border-t-2 border-dashed border-outline-variant" />

                    <div className="grid grid-cols-[34px_42px_1fr] items-start gap-3 px-4 py-4">
                        <span className="font-headline-lg-mobile text-3xl font-black text-tertiary">
                            02
                        </span>
                        <span aria-hidden="true" className="select-none text-2xl">
                            🚗
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
                        <span aria-hidden="true" className="select-none text-3xl text-primary">
                            ≋
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
                        <span aria-hidden="true" className="select-none text-2xl">
                            🚆
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
                            <span aria-hidden="true" className="absolute left-0 top-1 text-xl">
                                ⚽
                            </span>
                            <span aria-hidden="true" className="absolute right-0 top-0 text-xl">
                                ⚽
                            </span>
                        </div>
                        <p className="font-headline-lg-mobile text-xs font-black uppercase">
                            Double score<br /><span lang="ar" dir="rtl">نقاط مضاعفة</span>
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-1.5 border-x-2 border-white/15 px-2 py-4 text-center">
                        <span aria-hidden="true" className="text-2xl text-purple-300">
                            🛡
                        </span>
                        <p className="font-headline-lg-mobile text-xs font-black uppercase">
                            Safe shield<br /><span lang="ar" dir="rtl">درع حماية</span>
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-1.5 px-2 py-4 text-center">
                        <span aria-hidden="true" className="text-2xl text-cyan-300">
                            ⏱
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
                <span aria-hidden="true" className="select-none text-2xl">➜</span>
            </button>
        </div>
    );
}
