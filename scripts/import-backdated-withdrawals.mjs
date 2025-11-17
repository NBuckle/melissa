#!/usr/bin/env node

/**
 * Import Backdated Withdrawals from Master Inventory CSV
 *
 * Parses withdrawal columns from Google Sheets Master Inventory and creates
 * actual_withdrawals records with items.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import { parse } from 'csv-parse/sync'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Mapping of column headers to withdrawal dates and reasons
const WITHDRAWAL_COLUMNS = {
  'Expired Goods removed': { date: '2024-11-01', reason: 'Expired goods removal' },
  'Stk Count correction 3/11/25': { date: '2024-11-03', reason: 'Stock count correction' },
  'Packed OUT Tues Nov 4': { date: '2024-11-04', reason: 'Packed out Tuesday Nov 4' },
  'Expired Goods removed 5/11/25': { date: '2024-11-05', reason: 'Expired goods removal' },
  'Donated to Love March Mvmt- Nov 7': { date: '2024-11-07', reason: 'Donated to Love March Movement' },
  'Packed OUT FRI Nov 8': { date: '2024-11-08', reason: 'Packed out Friday Nov 8' },
  'Packed OUT Tues Nov 11': { date: '2024-11-11', reason: 'Packed out Tuesday Nov 11' },
  'Giveaway 8': { date: '2024-11-12', reason: 'Giveaway 8' },
  'Giveaway 9': { date: '2024-11-13', reason: 'Giveaway 9' },
  'giveaway 10': { date: '2024-11-14', reason: 'Giveaway 10' },
}

async function importBackdatedWithdrawals() {
  console.log('📦 Importing backdated withdrawals from Master Inventory CSV...\n')
  console.log('=' .repeat(70))
  console.log()

  // Read CSV file
  const csvPath = join(__dirname, '../old google sheets/nov16/Inventory - Melissa Donations - Master Inventory.csv')
  const csvContent = fs.readFileSync(csvPath, 'utf-8')

  // Parse CSV (skip first 2 header rows)
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    from_line: 3, // Start from row 3 (actual data)
  })

  console.log(`📄 Loaded ${records.length} items from CSV\n`)

  // Get all items from database to map names to IDs
  const { data: dbItems, error: itemsError } = await supabase
    .from('items')
    .select('id, name')

  if (itemsError) {
    console.error('❌ Error fetching items:', itemsError)
    process.exit(1)
  }

  // Create name -> ID mapping
  const itemNameToId = {}
  dbItems.forEach(item => {
    itemNameToId[item.name.toLowerCase().trim()] = item.id
  })

  console.log(`🔗 Mapped ${Object.keys(itemNameToId).length} items\n`)

  // Get default user (first admin or first user)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, role')
    .order('created_at')
    .limit(1)

  const defaultUserId = profiles?.[0]?.id

  if (!defaultUserId) {
    console.error('❌ No users found in database')
    process.exit(1)
  }

  console.log(`👤 Using user ID: ${defaultUserId}\n`)
  console.log('=' .repeat(70))
  console.log()

  // Group withdrawals by date
  const withdrawalsByDate = {}

  // Process each CSV row
  records.forEach((row, idx) => {
    const itemName = row['Item']?.trim()
    if (!itemName) return

    const itemId = itemNameToId[itemName.toLowerCase()]
    if (!itemId) {
      console.log(`⚠️  Skipping unknown item: "${itemName}"`)
      return
    }

    // Check each withdrawal column
    Object.entries(WITHDRAWAL_COLUMNS).forEach(([columnName, { date, reason }]) => {
      const quantity = parseFloat(row[columnName] || 0)

      if (quantity > 0) {
        if (!withdrawalsByDate[date]) {
          withdrawalsByDate[date] = {
            date,
            reason,
            items: []
          }
        }

        withdrawalsByDate[date].items.push({
          item_id: itemId,
          item_name: itemName,
          quantity
        })
      }
    })
  })

  console.log(`📊 Found withdrawals on ${Object.keys(withdrawalsByDate).length} dates:\n`)

  // Create withdrawal records for each date
  let totalWithdrawals = 0
  let totalItems = 0

  for (const [date, withdrawal] of Object.entries(withdrawalsByDate)) {
    console.log(`\n📅 ${date} - ${withdrawal.reason}`)
    console.log(`   Items: ${withdrawal.items.length}`)

    // Create withdrawal record
    const { data: withdrawalRecord, error: withdrawalError } = await supabase
      .from('actual_withdrawals')
      .insert([{
        withdrawn_by: defaultUserId,
        withdrawal_date: date,
        withdrawal_timestamp: new Date(date + 'T12:00:00Z').toISOString(),
        reason: withdrawal.reason,
        notes: 'Imported from Master Inventory CSV (backdated)'
      }])
      .select()
      .single()

    if (withdrawalError) {
      console.error(`   ❌ Error creating withdrawal: ${withdrawalError.message}`)
      continue
    }

    // Create withdrawal items
    const withdrawalItems = withdrawal.items.map(item => ({
      withdrawal_id: withdrawalRecord.id,
      item_id: item.item_id,
      quantity: item.quantity
    }))

    const { error: itemsError } = await supabase
      .from('actual_withdrawal_items')
      .insert(withdrawalItems)

    if (itemsError) {
      console.error(`   ❌ Error creating items: ${itemsError.message}`)
      // Rollback: delete the withdrawal
      await supabase.from('actual_withdrawals').delete().eq('id', withdrawalRecord.id)
      continue
    }

    console.log(`   ✅ Created withdrawal with ${withdrawal.items.length} items`)

    // Show top 5 items
    const topItems = withdrawal.items
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    topItems.forEach(item => {
      console.log(`      • ${item.item_name}: ${item.quantity}`)
    })

    if (withdrawal.items.length > 5) {
      console.log(`      ... and ${withdrawal.items.length - 5} more`)
    }

    totalWithdrawals++
    totalItems += withdrawal.items.length
  }

  console.log('\n' + '='.repeat(70))
  console.log(`\n✅ Import Complete!`)
  console.log(`   ${totalWithdrawals} withdrawal records created`)
  console.log(`   ${totalItems} withdrawal items created`)

  // Refresh master inventory
  console.log(`\n🔄 Refreshing master inventory...`)
  try {
    const { error } = await supabase.rpc('refresh_master_inventory')
    if (error) throw error
    console.log(`✅ Master inventory refreshed`)
  } catch (error) {
    console.log(`⚠️  Could not refresh: ${error.message}`)
  }

  console.log('\n🎉 All done!\n')
}

importBackdatedWithdrawals()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
