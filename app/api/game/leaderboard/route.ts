import { callSupabaseRpc } from "../../../lib/supabase-rest";
import type { LeaderboardEntry } from "../../../types";

type DailyLeaderboardRow = {
  rank: number;
  name: string;
  points: number;
  is_current_user?: boolean;
};

function normalizeLeaderboard(rows: DailyLeaderboardRow[]): LeaderboardEntry[] {
  return rows.map((row) => ({
    rank: row.rank,
    name: row.name,
    points: row.points,
    isCurrentUser: Boolean(row.is_current_user),
  }));
}

export async function GET() {
  try {
    const rows = await callSupabaseRpc<DailyLeaderboardRow[]>(
      "get_daily_leaderboard",
      { p_limit: 1 }
    );

    return Response.json({ leaderboard: normalizeLeaderboard(rows) });
  } catch {
    return Response.json({ leaderboard: [] }, { status: 200 });
  }
}
