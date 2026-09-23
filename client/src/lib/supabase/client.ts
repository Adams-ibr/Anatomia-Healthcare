import { createClient, SupabaseClient, SupabaseClientOptions } from "@supabase/supabase-js";

export interface ClientSupabaseConfig {
  url: string;
  anonKey: string;
  options?: SupabaseClientOptions<"public">;
}

let browserClient: SupabaseClient | null = null;

function getClientConfig(): ClientSupabaseConfig {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing required Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set"
    );
  }

  return {
    url,
    anonKey,
    options: {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: "anatomia-auth",
        flowType: "pkce",
      },
      db: {
        schema: "public",
      },
      global: {
        headers: {
          "X-Client-Info": "anatomia-healthcare-client",
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

export function createBrowserSupabaseClient(config?: Partial<ClientSupabaseConfig>): SupabaseClient {
  const baseConfig = getClientConfig();
  const finalConfig = { ...baseConfig, ...config };

  return createClient(finalConfig.url, finalConfig.anonKey, finalConfig.options);
}

export function getBrowserSupabaseClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createBrowserSupabaseClient();
  }
  return browserClient;
}

export function resetBrowserSupabaseClient(): void {
  browserClient = null;
}

export const supabase = getBrowserSupabaseClient();