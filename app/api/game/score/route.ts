import { cookies } from "next/headers";
import { callSupabaseRpc } from "../../../lib/supabase-rest";

const COOKIE_NAME = "fruishy_game_session";

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
    (score as number) > 2_147_483_647
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

    cookieStore.delete(COOKIE_NAME);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Unable to save score." }, { status: 500 });
  }
}
