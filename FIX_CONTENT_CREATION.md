# Course content schema

The former manual content-creation repair guide is retired. It referred to one-off SQL scripts that are not safe or current for production.

Course and content schema changes are maintained as versioned Supabase migrations in [`supabase/migrations`](supabase/migrations/). Apply migrations through the project's normal Supabase workflow; do not copy old repair SQL into the production SQL editor. [`schema.sql`](schema.sql) remains the canonical reference schema for a fresh setup.
