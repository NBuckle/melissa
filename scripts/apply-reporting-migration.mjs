#!/usr/bin/env node
/**
 * Apply Reporting Migration
 *
 * Applies the Phase 5 reporting functions migration to the database.
 * Usage: node --env-file=.env.local scripts/apply-reporting-migration.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

// Use service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function applyMigration() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 MELISSA INVENTORY - APPLY REPORTING MIGRATION')
  console.log('='.repeat(60))
  console.log(`\n🔗 Supabase URL: ${SUPABASE_URL}`)
  console.log(`📅 Time: ${new Date().toLocaleString()}\n`)

  try {
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '005_reporting_functions.sql')
    console.log(`📄 Reading migration file: ${migrationPath}`)

    const sql = readFileSync(migrationPath, 'utf8')

    console.log(`📝 Migration file loaded (${sql.length} characters)`)
    console.log('🚀 Executing migration...\n')

    // Execute the migration
    // Note: Supabase JS client doesn't support raw SQL execution well,
    // so we need to split and execute function creations separately

    // For now, let's try to execute it as a single query
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      console.error('❌ Migration failed:', error.message)
      console.error('\nDetails:', error)
      console.log('\n⚠️  Note: You may need to apply this migration manually via the Supabase dashboard.')
      console.log('   Go to: SQL Editor > New Query > Paste the migration file contents')
      process.exit(1)
    }

    console.log('✅ Migration applied successfully!')

    // Test the functions
    console.log('\n🧪 Testing reporting functions...')

    const testDate = new Date().toISOString().split('T')[0]
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const startDate = thirtyDaysAgo.toISOString().split('T')[0]

    const { data: testData, error: testError } = await supabase.rpc('get_daily_closing_balance', {
      start_date: startDate,
      end_date: testDate,
      p_item_id: null,
    })

    if (testError) {
      console.log('⚠️  Function test failed:', testError.message)
    } else {
      console.log(`✅ Function test passed! Returned ${testData?.length || 0} records`)
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ MIGRATION COMPLETE')
    console.log('='.repeat(60))
    console.log('\nYou can now use the reports features at /reports\n')

  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
    console.log('\n⚠️  Please apply the migration manually:')
    console.log('   1. Go to Supabase dashboard > SQL Editor')
    console.log('   2. Open supabase/migrations/005_reporting_functions.sql')
    console.log('   3. Copy the contents and execute in SQL Editor')
    process.exit(1)
  }
}

applyMigration()
