#!/usr/bin/env node
/**
 * Run Migration Script
 *
 * Simple script to provide instructions for running the Phase 5 migration.
 * The Supabase JS SDK doesn't support raw SQL execution, so this must be done
 * via the Supabase dashboard.
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('\n' + '='.repeat(70))
console.log('📊 MELISSA INVENTORY - PHASE 5 REPORTING MIGRATION')
console.log('='.repeat(70))

const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '005_reporting_functions.sql')

console.log(`\n📄 Migration file: ${migrationPath}`)

try {
  const sql = readFileSync(migrationPath, 'utf8')
  console.log(`📝 Migration size: ${sql.length} characters`)

  console.log('\n' + '='.repeat(70))
  console.log('TO APPLY THIS MIGRATION:')
  console.log('='.repeat(70))
  console.log('\n1. Go to: https://supabase.com/dashboard/project/karwhqspyarzebiwpnrh/sql/new')
  console.log('\n2. Copy the contents of: supabase/migrations/005_reporting_functions.sql')
  console.log('\n3. Paste into the SQL Editor and click "Run"')
  console.log('\n4. Verify success - you should see "Success. No rows returned"')
  console.log('\n' + '='.repeat(70))
  console.log('\nOr, copy the SQL below and execute it:\n')
  console.log('='.repeat(70))
  console.log(sql)
  console.log('='.repeat(70))

} catch (err) {
  console.error('❌ Error reading migration file:', err.message)
  process.exit(1)
}
