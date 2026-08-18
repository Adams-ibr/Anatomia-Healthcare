# Supabase Edge Function: `auth`

Implements the HamaAcademy auth API contract (`AUTH_API.md`) as a Supabase Edge
Function (Deno). The Vercel frontend proxies `/api/auth/*` to it via `vercel.json`
rewrites, so `VITE_API_URL` stays `https://www.hamaacademy.com`.

## Why not the Express server?

The frontend (Vercel) calls `/api/auth/*`. Rewriting that path on Vercel to this
Edge Function keeps everything on Supabase (Auth + Postgres) with no extra host.
The Express server in `server/` remains as an alternative if you prefer a separate
Node host.

## Deploy

```bash
# 1. One-time: log in + init/link the project
supabase login
supabase init
supabase link --project-ref jfnhvzwksemvorxlzwwv

# 2. Set the frontend origin (used in reset-password email links)
supabase secrets set FRONTEND_URL=https://www.hamaacademy.com

# 3. Deploy the function
supabase functions deploy auth
```

`supabase/config.toml` sets `verify_jwt = false` for this function so the public
`register`/`login` routes work without a JWT. After deploying, confirm in the
dashboard (Functions → auth) that "Verify JWT" is off.

## Frontend

`vercel.json` rewrites `/api/auth/:path*` to the function. Redeploy the Vercel app
after adding it. No `VITE_API_URL` change needed.

## Verify

```bash
curl -X POST https://jfnhvzwksemvorxlzwwv.supabase.co/functions/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"test@example.com","password":"password123","role":"student"}'
```

Expected: `201` with `{ "user": ..., "token": ... }`.

## Notes

- Registration auto-confirms the email (`email_confirm: true`).
- Requires `schema.sql` to be applied (profiles table + signup trigger).
- Requires the **service role** key, which Supabase injects automatically as
  `SUPABASE_SERVICE_ROLE_KEY` in edge function env.