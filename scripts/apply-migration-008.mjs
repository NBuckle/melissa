#!/usr/bin/env node

/**
 * Apply Migration 008: Restructure Withdrawals
 *
 * This script applies the database migration to:
 * - Update master_inventory (exclude CBAJ distributions)
 * - Rename withdrawals → distributions
 * - Create actual_withdrawals tables
 * - Add receipt_date to collections
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('🚀 Applying Migration 008: Restructure Withdrawals\n')
  console.log('=' .repeat(60))
  console.log()

  // Read the migration file
  const migrationPath = join(__dirname, '../supabase/migrations/008_restructure_withdrawals.sql')
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

  console.log('📄 Loaded migration file')
  console.log(`   ${migrationPath}\n`)

  // Split into individual statements (rough split by semicolon + newline)
  const statements = migrationSQL
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && !s.startsWith('/*'))

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`)

  let successCount = 0
  let failCount = 0
  const errors = []

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]

    // Skip comments and empty statements
    if (!statement || statement.startsWith('--') || statement.length < 10) {
      continue
    }

    // Skip verification queries at the end
    if (statement.includes('VERIFICATION QUERIES')) {
      break
    }

    console.log(`  ${i + 1}/${statements.length} Executing...`)

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })

      if (error) {
        throw error
      }

      successCount++
      console.log(`     ✅ Success`)
    } catch (error) {
      failCount++
      const errorMsg = error.message || String(error)

      // Some errors are expected (like "already exists") - don't treat as fatal
      if (errorMsg.includes('already exists') ||
          errorMsg.includes('does not exist') ||
          errorMsg.includes('exec_sql')) {
        console.log(`     ⚠️  Skipped: ${errorMsg.split('\n')[0]}`)
      } else {
        console.log(`     ❌ Error: ${errorMsg.split('\n')[0]}`)
        errors.push({ statement: statement.substring(0, 100), error: errorMsg })
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`\n📊 Migration Results:`)
  console.log(`   Successful: ${successCount}`)
  console.log(`   Failed: ${failCount}`)

  if (errors.length > 0) {
    console.log(`\n⚠️  Errors encountered:`)
    errors.forEach((err, idx) => {
      console.log(`\n   ${idx + 1}. ${err.statement}...`)
      console.log(`      ${err.error}`)
    })
  }

  // Try to refresh master_inventory using the RPC function
  console.log(`\n🔄 Refreshing master inventory...`)
  try {
    const { error } = await supabase.rpc('refresh_master_inventory')
    if (error) throw error
    console.log(`✅ Master inventory refreshed successfully`)
  } catch (error) {
    console.log(`⚠️  Could not refresh: ${error.message}`)
  }

  console.log(`\n✅ Migration process complete!`)
  console.log(`\nNOTE: Some errors are expected if tables already exist or RPC isn't available.`)
  console.log(`You may need to apply the migration manually in Supabase Dashboard → SQL Editor.`)
}

applyMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
