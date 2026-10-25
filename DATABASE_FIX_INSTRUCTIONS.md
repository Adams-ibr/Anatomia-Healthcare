# Database schema updates

The former manual database-fix steps are retired. They referenced one-off scripts and an incomplete schema snapshot that could conflict with the deployed database.

Use versioned migrations in [`supabase/migrations`](supabase/migrations/) for database changes and apply them through the project's normal Supabase migration workflow. [`schema.sql`](schema.sql) is retained as the canonical schema reference for fresh setups. `supabase/create-admin.sql` and `supabase/seed-categories.sql` are retained as standalone setup utilities.
