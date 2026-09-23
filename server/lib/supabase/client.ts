import { createClient, SupabaseClient, SupabaseClientOptions } from "@supabase/supabase-js";

export interface ServerSupabaseConfig {
  url: string;
  serviceRoleKey: string;
  options?: SupabaseClientOptions<"public">;
}

let serverClient: SupabaseClient | null = null;

function getServerConfig(): ServerSupabaseConfig {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing required Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
    );
  }

  return {
    url,
    serviceRoleKey,
    options: {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      db: {
        schema: "public",
      },
      global: {
        headers: {
          "X-Client-Info": "anatomia-healthcare-server",
        },
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    },
  };
}

export function createServerSupabaseClient(config?: Partial<ServerSupabaseConfig>): SupabaseClient {
  const baseConfig = getServerConfig();
  const finalConfig = { ...baseConfig, ...config };

  return createClient(finalConfig.url, finalConfig.serviceRoleKey, finalConfig.options);
}

export function getServerSupabaseClient(): SupabaseClient {
  if (!serverClient) {
    serverClient = createServerSupabaseClient();
  }
  return serverClient;
}

export function resetServerSupabaseClient(): void {
  serverClient = null;
}

export const supabase = getServerSupabaseClient();