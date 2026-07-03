'use client'

import React, { useState, useMemo } from "react";
import { getLeaderboard } from "../data/leaderboard";
import { LeaderboardEntry } from "../types";

interface LeaderboardScreenProps {
    userPoints: number;
    userName: string;
    onPlayAgain: () => void;
}

export default function LeaderboardScreen({
    userPoints,
    userName,
    onPlayAgain,
}: LeaderboardScreenProps) {
    const [visibleCount, setVisibleCount] = useState(7);

    // Generate dynamic leaderboard based on current player points
    const leaderboard = useMemo(() => {
        return getLeaderboard(userPoints, userName);
    }, [userPoints, userName]);

    // Find the user's specific ranking from the generated leaderboard
    const userRank = useMemo(() => {
        const found = leaderboard.find((item) => item.isCurrentUser);
        return found ? found.rank : 42;
    }, [leaderboard]);

    const handleLoadMore = () => {
        setVisibleCount((prev) => Math.min(prev + 4, leaderboard.length));
    };

    return (
        <div className="pt-8 pb-32 px-4 max-w-2xl mx-auto space-y-8 w-full relative z-10">
            {/* Current Player Rank Card */}
            <section className="relative">
                <div className="bg-primary-container p-6 rounded-xl border-4 border-on-surface neo-shadow-lg flex flex-col items-center justify-center text-center transform -rotate-1">
                    <h2 className="font-headline-xl text-3xl md:text-5xl text-on-primary-container leading-none uppercase font-black">
                        RANK: #{userRank}
                    </h2>
                    <div className="mt-4 bg-surface px-6 py-2.5 rounded-full border-2 border-on-surface inline-block">
                        <span className="font-headline-lg-mobile text-primary text-lg font-black tracking-wide">
                            {userPoints} PTS
                        </span>
                    </div>
                </div>
            </section>

            {/* Leaderboard List */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="font-headline-lg-mobile text-xl md:text-2xl text-on-surface uppercase italic font-black">
                        Top Goal Scorers
                    </h3>
                    <span className="font-label-bold text-xs text-outline uppercase tracking-wider">
                        Live standings
                    </span>
                </div>

                <div className="space-y-3.5">
                    {leaderboard.slice(0, visibleCount).map((entry, index) => {
                        const isTop3 = entry.rank <= 3 && !entry.isCurrentUser;

                        // Background classes for 1st, 2nd, 3rd, and normal rows
                        let rowBgClass = "bg-surface";
                        let rankBadgeBg = "bg-on-surface text-outline";

                        if (entry.isCurrentUser) {
                            rowBgClass = "bg-secondary-container border-secondary-container";
                            rankBadgeBg = "bg-secondary text-white";
                        } else if (entry.rank === 1) {
                            rowBgClass = "bg-tertiary-fixed";
                            rankBadgeBg = "bg-on-surface text-tertiary-fixed";
                        } else if (entry.rank === 2) {
                            rowBgClass = "bg-surface-container-highest";
                            rankBadgeBg = "bg-on-surface text-surface-variant";
                        } else if (entry.rank === 3) {
                            rowBgClass = "bg-primary-fixed";
                            rankBadgeBg = "bg-on-surface text-primary-fixed";
                        }

                        return (
                            <div
                                key={`${entry.name}-${entry.rank}-${index}`}
                                className={`flex items-center border-4 border-on-surface p-4 rounded-xl neo-shadow transition-all hover:scale-[1.01] ${rowBgClass}`}
                            >
                                {/* Rank Number Circle */}
                                <div
                                    className={`w-11 h-11 font-headline-lg-mobile flex items-center justify-center rounded-lg border-2 border-on-surface mr-4 text-lg font-black select-none ${rankBadgeBg}`}
                                >
                                    {entry.rank}
                                </div>

                                {/* Name & Badge */}
                                <div className="flex-grow">
                                    <p className="font-headline-lg-mobile text-on-surface-variant text-lg md:text-xl uppercase leading-tight font-black">
                                        {entry.name}
                                        {entry.isCurrentUser && (
                                            <span className="text-xs bg-primary text-white font-label-bold px-2 py-0.5 rounded ml-2 align-middle">
                                                YOU
                                            </span>
                                        )}
                                    </p>
                                    {entry.badge && (
                                        <p className="font-label-bold text-[10px] text-primary uppercase mt-0.5 tracking-wider font-bold">
                                            🏆 {entry.badge}
                                        </p>
                                    )}
                                </div>

                                {/* Score */}
                                <div className="text-right">
                                    <p className="font-headline-lg-mobile text-primary text-xl md:text-2xl font-black">
                                        {entry.points.toLocaleString()}
                                    </p>
                                    <p className="font-label-bold text-[9px] uppercase tracking-wider text-on-surface/60">
                                        PTS
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
