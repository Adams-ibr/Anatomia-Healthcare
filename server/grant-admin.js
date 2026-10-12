// Quick script to grant admin access
// Usage: node grant-admin.js your-email@example.com

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const email = process.argv[2];

if (!email) {
  console.error('Usage: node grant-admin.js your-email@example.com');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function grantAdmin() {
  console.log(`Granting admin access to: ${email}`);
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('email', email)
    .select();

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  console.log('✅ Admin access granted!');
  console.log('User:', data[0].name);
  console.log('Email:', data[0].email);
  console.log('Role:', data[0].role);
  
  process.exit(0);
}

grantAdmin();
