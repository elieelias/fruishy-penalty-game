import { cookies } from "next/headers";
import { callSupabaseRpc } from "../../../lib/supabase-rest";
import { COUNTRY_THEMES } from "../../../data/countries";

const COOKIE_NAME = "fruishy_game_session";
const MAX_NAME_LENGTH = 40;
const MAX_PHONE_LENGTH = 24;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const { token, name, phone, country } = body as Record<string, unknown>;
  if (
    typeof token !== "string" ||
    typeof name !== "string" ||
    typeof phone !== "string"
  ) {
    return Response.json({ error: "Missing registration details." }, { status: 400 });
  }

  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();
  const hasValidCountry =
    typeof country !== "string" ||
    COUNTRY_THEMES.some((team) => team.id === country);

  if (
    token.trim().length === 0 ||
    trimmedName.length === 0 ||
    trimmedName.length > MAX_NAME_LENGTH ||
    trimmedPhone.length === 0 ||
    trimmedPhone.length > MAX_PHONE_LENGTH ||
    !hasValidCountry
  ) {
    return Response.json({ error: "Invalid registration details." }, { status: 400 });
  }

  try {
    const session = await callSupabaseRpc<string | null>("claim_game_token", {
      p_qr_token: token.trim(),
      p_name: trimmedName,
      p_phone_number: trimmedPhone,
    });

    if (!session) {
      return Response.json({ error: "QR code is invalid or used." }, { status: 409 });
    }

    const value = Buffer.from(
      JSON.stringify({ token: token.trim(), session })
    ).toString("base64url");
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
