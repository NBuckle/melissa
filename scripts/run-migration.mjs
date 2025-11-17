#!/usr/bin/env node

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'
import postgres from 'postgres'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env.local') })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local')
  process.exit(1)
}

async function runMigration() {
  console.log('🚀 Running Migration 008...\n')
  const sql = postgres(DATABASE_URL)

  try {
    const migrationPath = join(__dirname, '../supabase/migrations/008_restructure_withdrawals.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Executing migration...\n')
    await sql.unsafe(migrationSQL)
    
    console.log('✅ Migration completed!\n')
    await sql.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    await sql.end()
    process.exit(1)
  }
}

runMigration()
