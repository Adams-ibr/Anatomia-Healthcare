import { createClient } from "@supabase/supabase-js";

// Helper to convert camelCase object keys to snake_case for Supabase
export function toSnakeCase(obj: any): any {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj) || obj instanceof Date) return obj;
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => "_" + letter.toLowerCase());
    result[snakeKey] = value;
  }
  return result;
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("WARNING: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not set. Database operations will fail.");
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  process.env.SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key"
);
