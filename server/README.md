# HamaAcademy Auth API

Express + TypeScript server that backs the frontend auth flows with Supabase Auth.
It implements the contract in [`AUTH_API.md`](../AUTH_API.md): `/api/auth/register`,
`login`, `logout`, `me`, `profile`, `change-password`, `account`, `forgot-password`,
`reset-password`, `verify-email`.

> **Prefer the Supabase Edge Function.** For the current stack (frontend on Vercel,
> backend on Supabase), deploy [`supabase/functions/auth`](../supabase/functions/auth)
> and rewrite `/api/auth/*` on Vercel. This folder is the Express equivalent if you'd
> rather run a standalone Node service.

The Supabase **access token** is returned as the JWT the frontend stores and sends as
`Authorization: Bearer <token>`.

## Setup

1. Install deps

   ```bash
   npm install
   ```

2. Create `server/.env` from the example:

   ```bash
   cp .env.example .env
   ```

3. Fill in the secrets:

   | Var | Value |
   | --- | --- |
   | `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | Dashboard → Project Settings → API → `service_role` (server-side only, never expose in the browser) |
   | `FRONTEND_URL` | The SPA origin, e.g. `https://www.hamaacademy.com` |
   | `ALLOWED_ORIGINS` | Comma-separated browser origins allowed by CORS |
   | `PORT` | Server port (default `8787`) |

4. Apply the database schema (`../schema.sql`) in the Supabase SQL editor first — it
   creates the `profiles` table and the signup trigger that auto-creates a profile row.

## Run

```bash
npm run dev     # tsx watch (development)
npm run build   # compile to dist/
npm start       # node dist/index.js (production)
```

## Deploy

Make `/api/*` reachable on the domain the frontend points `VITE_API_URL` at
(`https://www.hamaacademy.com`), either by:

- **Reverse proxy** on the existing host: route `/api` to this server
  (`nginx`/`caddy`/`traefik`), or
- **Hosting service** (Render/Railway/Fly): deploy this folder, set the env vars, and
  set `VITE_API_URL` to `https://<server-host>` (keep the `/api` prefix in the routes).

If the API is served from a different origin than the SPA, add the SPA origin to
`ALLOWED_ORIGINS`.

## Notes

- Registration auto-confirms the email (`email_confirm: true`) so signup → login works
  immediately. To require confirmation, remove that flag; the `verify-email` and
  reset-password flows already handle Supabase's `token_hash` links.
- The reset-password email link uses `{{ .SiteURL }}/auth/v1/verify?...&redirect_to=<FRONTEND_URL>/reset-password`
  (or the email template's `{{ .ConfirmationURL }}`). The frontend reads both `?token=`
  and `?token_hash=` on `/reset-password`.
- The service role key bypasses RLS. Protect this server (host access control, no CORS
  exposure of the key).