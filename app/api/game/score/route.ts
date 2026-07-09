import { cookies } from "next/headers";
import { callSupabaseRpc } from "../../../lib/supabase-rest";
import type { DailyLeaderboard, LeaderboardEntry } from "../../../types";

const COOKIE_NAME = "fruishy_game_session";
const MAX_GAME_SCORE = 250_000;

type DailyLeaderboardRow = {
  rank: number;
  name: string;
  points: number;
  is_current_user?: boolean;
};

function normalizeDailyLeaderboard(rows: DailyLeaderboardRow[]): DailyLeaderboard {
  const entries: LeaderboardEntry[] = rows
    .filter((row) => row.rank <= 7)
    .map((row) => ({
      rank: row.rank,
      name: row.name,
      points: row.points,
      isCurrentUser: Boolean(row.is_current_user),
    }));

  const currentUser = rows.find((row) => row.is_current_user);

  return {
    entries,
    userRank: currentUser?.rank ?? null,
  };
}

export async function POST(request: Request) {
  let score: unknown;
  try {
    ({ score } = (await request.json()) as { score?: unknown });
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (
    !Number.isSafeInteger(score) ||
    (score as number) < 0 ||
    (score as number) > MAX_GAME_SCORE
  ) {
    return Response.json({ error: "Invalid score." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const encodedSession = cookieStore.get(COOKIE_NAME)?.value;
  if (!encodedSession) {
    return Response.json({ error: "Game session not found." }, { status: 401 });
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encodedSession, "base64url").toString("utf8")
    ) as { token?: unknown; session?: unknown };

    if (typeof parsed.token !== "string" || typeof parsed.session !== "string") {
      throw new Error("Invalid session.");
    }

    const saved = await callSupabaseRpc<boolean>("save_game_score", {
      p_qr_token: parsed.token,
      p_play_session: parsed.session,
      p_score: score,
    });

    if (!saved) {
      return Response.json({ error: "Score was not accepted." }, { status: 409 });
    }

    let leaderboard: DailyLeaderboard = { entries: [], userRank: null };
    try {
      const rows = await callSupabaseRpc<DailyLeaderboardRow[]>(
        "get_daily_leaderboard",
        {
          p_play_session: parsed.session,
          p_limit: 7,
        }
      );
      leaderboard = normalizeDailyLeaderboard(rows);
    } catch {
      // The score is already saved; keep the game result available if standings fail.
    }

    cookieStore.delete(COOKIE_NAME);
    return Response.json({ ok: true, leaderboard });
  } catch {
    return Response.json({ error: "Unable to save score." }, { status: 500 });
  }
}
