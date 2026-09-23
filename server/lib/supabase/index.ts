export {
  createServerSupabaseClient,
  getServerSupabaseClient,
  resetServerSupabaseClient,
  supabase,
} from "./client";

export {
  createAdminSupabaseClient,
  getAdminSupabaseClient,
  resetAdminSupabaseClient,
  supabaseAdmin,
} from "./admin";

export type { ServerSupabaseConfig } from "./client";