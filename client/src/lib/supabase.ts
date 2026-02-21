import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables. Please check your .env file or Vercel dashboard.");
}

export const supabase = createClient(
    supabaseUrl || "https://evfdnyxrkrkcigkkrhyr.supabase.co",
    supabaseAnonKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2ZmRueXhya3JrY2lna2tyaHlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NjczMTYsImV4cCI6MjA4NjI0MzMxNn0.UMRNMCIknyU1ZduAltxWDNqQAAmS1xjAP_ltEVkftbI"
);
