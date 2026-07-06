import GameApp from "../components/GameApp";
import QrScanned from "../components/QrScanned";
import { callSupabaseRpc } from "../lib/supabase-rest";

export const dynamic = "force-dynamic";

export default async function PlayPage({
  searchParams,
}: PageProps<"/play">) {
  const query = await searchParams;
  const tokenValue = query.token;
  const token = typeof tokenValue === "string" ? tokenValue.trim() : "";

  if (!token) {
    return <QrScanned />;
  }

  let isAvailable = false;
  try {
    isAvailable = await callSupabaseRpc<boolean>(
      "is_game_token_available",
      { p_qr_token: token }
    );
  } catch {
    return <QrScanned />;
  }

  return isAvailable ? <GameApp token={token} /> : <QrScanned />;
}
