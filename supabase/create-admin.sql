-- Promote an existing (or create + promote) admin@hamaacademy.com user.
-- NOTE: Creating GoTrue auth users via raw SQL inserts causes GoTrue login to
-- fail ("Database error querying schema"). Create the account through the app's
-- register endpoint instead, then promote the role with SQL below.

-- 1) Create the account (run once) - use the app's own register endpoint:
--    POST /api/auth/register  { "name": "Hama Admin", "email": "admin@hamaacademy.com", "password": "Admin@Hama2026", "role": "student" }

-- 2) Promote to admin - run in the Supabase SQL editor:
update public.profiles
set role = 'admin', name = 'Hama Admin',
    title = 'Platform Administrator', bio = 'Platform operations and content review.'
where email = 'admin@hamaacademy.com'
returning id, email, role, name;
