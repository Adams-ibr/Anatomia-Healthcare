# Database schema maintenance

The old manual diagnostic and repair instructions in this file were retired. Their one-off SQL scripts are no longer in the repository and should not be run against production.

Use the versioned migrations in [`supabase/migrations`](supabase/migrations/) as the source of truth for database changes. Apply new changes through the project's normal Supabase migration workflow. For a fresh local/reference schema, see [`schema.sql`](schema.sql); do not use old repair scripts or incomplete schema snapshots.
