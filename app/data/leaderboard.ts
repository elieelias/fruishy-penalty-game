import { LeaderboardEntry } from "@/app/types";

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
    {
        rank: 1,
        name: "Juice King",
        points: 2450,
        badge: "SIPPING CHAMPION"
    },
    {
        rank: 2,
        name: "Popcorn Pro",
        points: 2100,
    },
    {
        rank: 3,
        name: "Zesty Striker",
        points: 1980,
    },
    {
        rank: 4,
        name: "Lime Legend",
        points: 1750,
    },
    {
        rank: 5,
        name: "Mango Master",
        points: 1620,
    },
    {
        rank: 6,
        name: "Tropical Ace",
        points: 1540,
    },
    {
        rank: 7,
        name: "Fruit Ninja",
        points: 1400,
    },
    {
        rank: 8,
        name: "Citrus Crusher",
        points: 1250,
    },
    {
        rank: 9,
        name: "Nectar Knight",
        points: 1120,
    },
    {
        rank: 10,
        name: "Popcorn Popper",
        points: 1010,
    },
    {
        rank: 11,
        name: "Guava Goalie",
        points: 920,
    }
];

export function getLeaderboard(userScore: number = 850, userName: string = ""): LeaderboardEntry[] {
    // If user has a name, inject them, sort, and assign dynamic ranks!
    const list = [...INITIAL_LEADERBOARD];

    const userEntry: LeaderboardEntry = {
        rank: 42, // default fallback
        name: userName || "You (Champion)",
        points: userScore,
        isCurrentUser: true,
    };

    list.push(userEntry);

    // Sort descending
    list.sort((a, b) => b.points - a.points);

    // Recalculate ranks based on sorting
    return list.map((item, index) => {
        // If it is the user, and they are below index 11, we want to maintain an offset or calculate actual rank.
        // Let's calculate actual rank:
        const calculatedRank = index + 1;
        return {
            ...item,
            rank: item.isCurrentUser && calculatedRank > 10 ? Math.max(12, 42 - Math.floor((userScore - 850) / 40)) : calculatedRank
        };
    });
}
