import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getServerSupabaseClient } from "./client";

let adminClient: SupabaseClient | null = null;

export function createAdminSupabaseClient(): SupabaseClient {
  const baseClient = getServerSupabaseClient();
  return baseClient;
}

export function getAdminSupabaseClient(): SupabaseClient {
  if (!adminClient) {
    adminClient = createAdminSupabaseClient();
  }
  return adminClient;
}

export function resetAdminSupabaseClient(): void {
  adminClient = null;
}

export const supabaseAdmin = getAdminSupabaseClient();