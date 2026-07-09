/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CountryId } from "./data/countries";

export enum AppScreen {
    REGISTRATION = "REGISTRATION",
    COACH_TIPS = "COACH_TIPS",
    GAMEPLAY = "GAMEPLAY",
    LEADERBOARD = "LEADERBOARD",
    CODE_USED = "CODE_USED",
}

export interface Player {
    name: string;
    phone: string;
    points: number;
    rank: number;
    credits: number;
    country: CountryId;
}

export interface LeaderboardEntry {
    rank: number;
    name: string;
    points: number;
    badge?: string;
    isCurrentUser?: boolean;
}

export interface DailyLeaderboard {
    entries: LeaderboardEntry[];
    userRank: number | null;
}

export interface ShotResult {
    target: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    keeperAction: 'dive-left' | 'dive-right' | 'stay-center' | 'jump-top-left' | 'jump-top-right';
    isGoal: boolean;
    pointsEarned: number;
    message: string;
}
