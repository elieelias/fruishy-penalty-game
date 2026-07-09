import "server-only";

const defaultSupabaseUrl = "https://jgifsdsjsietkkjcuzor.supabase.co";
const defaultSupabasePublishableKey =
  "sb_publishable_W111kAuoLSPRyfGkv2cfAQ_yMqg-ESr";

const supabaseUrl =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  defaultSupabaseUrl;
const supabaseKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  defaultSupabasePublishableKey;

export async function callSupabaseRpc<T>(
  functionName: string,
  parameters: Record<string, unknown>
): Promise<T> {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

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
