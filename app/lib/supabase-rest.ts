import "server-only";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://jgifsdsjsietkkjcuzor.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_W111kAuoLSPRyfGkv2cfAQ_yMqg-ESr";

export async function callSupabaseRpc<T>(
  functionName: string,
  parameters: Record<string, unknown>
): Promise<T> {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/rpc/${functionName}`,
    {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parameters),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`Supabase RPC failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}
