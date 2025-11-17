#!/usr/bin/env node

/**
 * Fix Withdrawal Dates - Update from 2024 to 2025
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixWithdrawalDates() {
  console.log('🔧 Fixing withdrawal dates: 2024 → 2025\n')

  // Get all withdrawals with 2024 dates
  const { data: withdrawals, error } = await supabase
    .from('actual_withdrawals')
    .select('id, withdrawal_date, withdrawal_timestamp, reason')
    .gte('withdrawal_date', '2024-11-01')
    .lte('withdrawal_date', '2024-11-30')

  if (error) {
    console.error('❌ Error fetching withdrawals:', error)
    process.exit(1)
  }

  console.log(`Found ${withdrawals.length} withdrawals to update:\n`)

  for (const withdrawal of withdrawals) {
    const oldDate = withdrawal.withdrawal_date
    const newDate = oldDate.replace('2024', '2025')
    const oldTimestamp = withdrawal.withdrawal_timestamp
    const newTimestamp = oldTimestamp.replace('2024', '2025')

    console.log(`  ${withdrawal.reason}`)
    console.log(`    ${oldDate} → ${newDate}`)

    const { error: updateError } = await supabase
      .from('actual_withdrawals')
      .update({
        withdrawal_date: newDate,
        withdrawal_timestamp: newTimestamp
      })
      .eq('id', withdrawal.id)

    if (updateError) {
      console.error(`    ❌ Error: ${updateError.message}`)
    } else {
      console.log(`    ✅ Updated`)
    }
  }

  console.log('\n✅ All dates updated!')
  console.log('\n🔄 Refreshing master inventory...')

  try {
    await supabase.rpc('refresh_master_inventory')
    console.log('✅ Master inventory refreshed')
  } catch (error) {
    console.log('⚠️  Could not refresh:', error.message)
  }
}

fixWithdrawalDates()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
