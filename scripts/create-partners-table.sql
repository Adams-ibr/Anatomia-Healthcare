-- Run this in your Supabase SQL editor to create the partners table
CREATE TABLE IF NOT EXISTS partners (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  website_url TEXT,
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- Allow public read access for active partners
CREATE POLICY "Public can read active partners"
  ON partners FOR SELECT
  USING (is_active = true);

-- Allow service role full access (used by your backend)
CREATE POLICY "Service role has full access"
  ON partners FOR ALL
  USING (true)
  WITH CHECK (true);
