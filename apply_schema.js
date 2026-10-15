#!/usr/bin/env node

/**
 * Apply the complete schema.sql to Supabase database
 * This checks if tables exist and applies the missing ones
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://evfdnyxrkrkcigkkrhyr.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2ZmRueXhya3JrY2lna2tyaHlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NjczMTYsImV4cCI6MjA4NjI0MzMxNn0.UMRNMCIknyU1ZduAltxWDNqQAAmS1xjAP_ltEVkftbI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTables() {
  console.log('🔍 Checking which tables exist in your database...\n');
  
  const requiredTables = [
    'courses',
    'course_sections',
    'lessons',
    'course_objectives',
    'course_requirements',
    'course_faqs',
    'assessments'
  ];

  const results = {};
  
  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error) {
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          results[table] = '❌ MISSING';
        } else {
          results[table] = `⚠️  ERROR: ${error.message}`;
        }
      } else {
        results[table] = '✅ EXISTS';
      }
    } catch (err) {
      results[table] = `⚠️  ERROR: ${err.message}`;
    }
  }

  console.log('Table Status:');
  console.log('─'.repeat(50));
  for (const [table, status] of Object.entries(results)) {
    console.log(`${table.padEnd(25)} ${status}`);
  }
  console.log('─'.repeat(50));
  console.log('');

  const missing = Object.entries(results)
    .filter(([_, status]) => status.includes('MISSING'))
    .map(([table]) => table);

  if (missing.length === 0) {
    console.log('✅ All required tables exist!');
    console.log('\nℹ️  If content creation still fails, the issue is elsewhere.');
    console.log('   Check:');
    console.log('   1. User permissions (are you admin/instructor?)');
    console.log('   2. Browser console for specific errors');
    console.log('   3. Network tab to see API response');
    return true;
  } else {
    console.log(`❌ Missing ${missing.length} table(s):`);
    missing.forEach(t => console.log(`   - ${t}`));
    console.log('\n📋 SOLUTION:');
    console.log('   You need to run schema.sql in Supabase SQL Editor.');
    console.log('   This cannot be done via the Supabase client API.');
    console.log('\n   Steps:');
    console.log('   1. Go to: https://supabase.com/dashboard');
    console.log('   2. Select project: evfdnyxrkrkcigkkrhyr');
    console.log('   3. Click "SQL Editor" in left sidebar');
    console.log('   4. Copy contents of schema.sql');
    console.log('   5. Paste and click "Run"');
    console.log('\n   OR if you have Supabase CLI:');
    console.log('   npx supabase db push');
    return false;
  }
}

async function checkCourseIdType() {
  console.log('\n🔍 Checking courses table ID column type...\n');
  
  try {
    // Try to query courses
    const { data, error } = await supabase
      .from('courses')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('❌ courses table does not exist');
        console.log('   Run schema.sql to create it');
        return;
      }
      console.log('⚠️  Error querying courses:', error.message);
      return;
    }

    if (data && data.length > 0) {
      const id = data[0].id;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      
      if (isUUID) {
        console.log('✅ courses.id is UUID format (correct!)');
      } else {
        console.log('❌ courses.id is NOT UUID format');
        console.log(`   Sample ID: ${id}`);
        console.log('   This will cause foreign key errors!');
      }
    } else {
      console.log('ℹ️  No courses in database yet (table is empty)');
      console.log('   Cannot verify ID type, but table structure should be UUID');
    }
  } catch (err) {
    console.log('⚠️  Error:', err.message);
  }
}

// Run checks
(async () => {
  try {
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║  Anatomia LMS - Database Schema Checker       ║');
    console.log('╚════════════════════════════════════════════════╝\n');
    
    await checkTables();
    await checkCourseIdType();
    
    console.log('\n' + '═'.repeat(50));
    console.log('Check complete!');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
})();
