import "server-only";

const defaultSupabaseUrl = "https://jgifsdsjsietkkjcuzor.supabase.co";
const defaultSupabasePublishableKey =
  "sb_publishable_W111kAuoLSPRyfGkv2cfAQ_yMqg-ESr";

function cleanEnvValue(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "");
}

const configuredSupabaseUrl = cleanEnvValue(
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
)?.replace(/\/+$/, "");
const configuredSupabaseKey = cleanEnvValue(
  process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

const rpcClients = [
  {
    url: configuredSupabaseUrl,
    key: configuredSupabaseKey,
  },
  {
    url: defaultSupabaseUrl,
    key: defaultSupabasePublishableKey,
  },
].filter(
  (client, index, clients): client is { url: string; key: string } =>
    Boolean(client.url && client.key) &&
    clients.findIndex(
      (candidate) =>
        candidate.url === client.url && candidate.key === client.key
    ) === index
);

export async function callSupabaseRpc<T>(
  functionName: string,
  parameters: Record<string, unknown>
): Promise<T> {
  if (rpcClients.length === 0) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const errors: string[] = [];

  for (const client of rpcClients) {
    try {
      const response = await fetch(
        `${client.url}/rest/v1/rpc/${functionName}`,
        {
          method: "POST",
          headers: {
            apikey: client.key,
            Authorization: `Bearer ${client.key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(parameters),
          cache: "no-store",
        }
      );

      if (response.ok) {
        return (await response.json()) as T;
      }

      const message = await response.text();
      errors.push(`${client.url}: ${response.status} ${message}`);
    } catch (error) {
      errors.push(
        `${client.url}: ${
          error instanceof Error ? error.message : "Unknown Supabase error"
        }`
      );
    }
  }

  throw new Error(
    `Supabase RPC ${functionName} failed for all clients: ${errors.join(
      " | "
    )}`
  );
}
