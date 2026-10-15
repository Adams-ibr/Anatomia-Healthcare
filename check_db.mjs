import pg from 'pg';

// Supabase connection string format
// postgres://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

console.log('This script needs your Supabase database password.');
console.log('Get it from: https://supabase.com/dashboard/project/evfdnyxrkrkcigkkrhyr/settings/database');
console.log('\nOr, just run these SQL queries in Supabase SQL Editor:\n');

const checkQuery = `
-- Check which tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('course_sections', 'lessons', 'course_objectives', 'course_requirements', 'course_faqs', 'assessments')
ORDER BY table_name;

-- Check courses table ID column type
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'courses' AND column_name = 'id';
`;

console.log(checkQuery);
console.log('\n✅ Copy the SQL above and run it in Supabase SQL Editor');
console.log('   Dashboard → SQL Editor → New query → Paste → Run\n');
