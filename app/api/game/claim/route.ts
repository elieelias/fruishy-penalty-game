import { cookies } from "next/headers";
import { callSupabaseRpc } from "../../../lib/supabase-rest";

const COOKIE_NAME = "fruishy_game_session";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const { token, name, phone } = body as Record<string, unknown>;
  if (
    typeof token !== "string" ||
    typeof name !== "string" ||
    typeof phone !== "string"
  ) {
    return Response.json({ error: "Missing registration details." }, { status: 400 });
  }

  try {
    const session = await callSupabaseRpc<string | null>("claim_game_token", {
      p_qr_token: token,
      p_name: name,
      p_phone_number: phone,
    });

    if (!session) {
      return Response.json({ error: "QR code is invalid or used." }, { status: 409 });
    }

    const value = Buffer.from(JSON.stringify({ token, session })).toString("base64url");
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, value, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 4,
      priority: "high",
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Unable to claim QR code." }, { status: 500 });
  }
}
