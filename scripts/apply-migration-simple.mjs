#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🚀 Applying migration through Supabase Dashboard is recommended')
console.log('📄 Migration file: supabase/migrations/008_restructure_withdrawals.sql\n')
console.log('Please:')
console.log('1. Go to Supabase Dashboard → SQL Editor')  
console.log('2. Copy/paste the migration file')
console.log('3. Click Run\n')
console.log('This ensures all changes are applied correctly with proper permissions.')
