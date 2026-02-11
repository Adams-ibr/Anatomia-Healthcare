import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.json({
    supabaseUrlSet: !!process.env.SUPABASE_URL,
    supabaseKeySet: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    databaseUrlSet: !!process.env.DATABASE_URL,
    sessionSecretSet: !!process.env.SESSION_SECRET,
    nodeEnv: process.env.NODE_ENV,
  });
}
