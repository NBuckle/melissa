#!/usr/bin/env node
/**
 * Import CBAJ Deliveries to Churches
 *
 * Imports historical church deliveries from Google Sheets CSV
 * as withdrawals with distribution_type = "Church Delivery"
 *
 * Usage: node --env-file=.env.local scripts/import-cbaj-deliveries.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { parse } from 'csv-parse/sync'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Supabase setup (use service role key to bypass RLS)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * Parse date string from CSV (e.g., "Wed- Nov 5th 2025")
 */
function parseDeliveryDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null

  // Extract date parts from "Wed- Nov 5th 2025" format
  const match = dateStr.match(/([A-Za-z]+)\s+(\d+)[a-z]*\s+(\d{4})/)
  if (!match) return null

  const [, month, day, year] = match
  const monthMap = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  }

  const monthNum = monthMap[month]
  if (monthNum === undefined) return null

  const date = new Date(parseInt(year), monthNum, parseInt(day))
  return date.toISOString()
}

/**
 * Main import function
 */
async function importCBAJDeliveries() {
  console.log('\n' + '='.repeat(70))
  console.log('📦 IMPORT CBAJ DELIVERIES TO CHURCHES')
  console.log('='.repeat(70))

  try {
    // 1. Read and parse CSV
    const csvPath = join(__dirname, '..', 'old google sheets', 'Inventory - Melissa Donations - CBAJ DELIVERIES to CHURCHES.csv')
    console.log(`\n📄 Reading CSV: ${csvPath}`)

    const fileContent = readFileSync(csvPath, 'utf-8')
    const records = parse(fileContent, {
      skip_empty_lines: false,
      relax_column_count: true,
    })

    console.log(`✅ Loaded ${records.length} rows from CSV`)

    // 2. Parse headers (row 6, index 5)
    const headerRow = records[5] // Row 6 (0-indexed)
    const churches = []

    // Extract church names from column C onwards (index 2+)
    // Stop at "TOTAL COUNT" or empty cells
    for (let i = 2; i < headerRow.length; i++) {
      const churchName = headerRow[i]?.trim()
      if (!churchName || churchName === 'TOTAL COUNT' || churchName === 'Total Sent' || churchName === 'Balance') {
        break
      }
      churches.push({ name: churchName, columnIndex: i })
    }

    console.log(`\n📍 Found ${churches.length} churches:`)
    churches.forEach(c => console.log(`   - ${c.name}`))

    // 3. Get distribution type for "Church Delivery"
    const { data: distTypes } = await supabase
      .from('distribution_types')
      .select('id, name')

    const churchDeliveryType = distTypes?.find(dt => dt.name === 'Church Delivery')

    if (!churchDeliveryType) {
      console.error('❌ Distribution type "Church Delivery" not found in database')
      process.exit(1)
    }

    console.log(`\n✅ Using distribution type: ${churchDeliveryType.name} (${churchDeliveryType.id})`)

    // 4. Get user ID for attribution
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    const userId = profiles?.[0]?.id

    if (!userId) {
      console.error('❌ No user profiles found in database')
      process.exit(1)
    }

    console.log(`✅ Attributing imports to user: ${userId}`)

    // 5. Get all items for name matching
    const { data: items } = await supabase
      .from('items')
      .select('id, name')

    const itemMap = {}
    items?.forEach(item => {
      itemMap[item.name.toLowerCase().trim()] = item.id
    })

    console.log(`✅ Loaded ${items?.length || 0} items from database`)

    // 6. Parse data rows and group by date
    const deliveriesByDate = {}
    let currentDate = null

    // Start from row 9 (index 8) - first data row
    for (let rowIdx = 8; rowIdx < records.length; rowIdx++) {
      const row = records[rowIdx]

      // Check if this row has a date (column A)
      if (row[0]?.trim()) {
        currentDate = parseDeliveryDate(row[0])
      }

      if (!currentDate) continue

      // Get item name (column B)
      const itemName = row[1]?.trim()
      if (!itemName || itemName === '' || itemName.startsWith('To Do')) break

      // Skip certain rows
      if (itemName === 'Total Count Things' || itemName.includes('Total')) continue

      // Initialize date entry
      if (!deliveriesByDate[currentDate]) {
        deliveriesByDate[currentDate] = {}
      }

      // Process each church column
      churches.forEach(church => {
        const quantity = parseFloat(row[church.columnIndex]) || 0

        if (quantity > 0) {
          // Initialize church entry
          if (!deliveriesByDate[currentDate][church.name]) {
            deliveriesByDate[currentDate][church.name] = []
          }

          // Add item to this church's delivery
          deliveriesByDate[currentDate][church.name].push({
            itemName,
            quantity,
          })
        }
      })
    }

    console.log(`\n📊 Parsed deliveries:`)
    Object.keys(deliveriesByDate).forEach(date => {
      const churchCount = Object.keys(deliveriesByDate[date]).length
      console.log(`   ${new Date(date).toLocaleDateString()}: ${churchCount} churches`)
    })

    // 7. Create withdrawals
    console.log('\n🚀 Creating withdrawal records...\n')

    let totalWithdrawals = 0
    let totalItems = 0
    let skippedItems = []

    for (const [date, churches] of Object.entries(deliveriesByDate)) {
      for (const [churchName, items] of Object.entries(churches)) {
        // Create withdrawal record
        const { data: withdrawal, error: withdrawalError } = await supabase
          .from('withdrawals')
          .insert({
            distribution_type_id: churchDeliveryType.id,
            withdrawal_date: date,
            recipient: churchName,
            reason: 'CBAJ Hurricane Relief Delivery',
            notes: 'Imported from Google Sheets - CBAJ DELIVERIES to CHURCHES',
            withdrawn_by: userId,
          })
          .select('id')
          .single()

        if (withdrawalError) {
          console.error(`❌ Error creating withdrawal for ${churchName}:`, withdrawalError.message)
          continue
        }

        // Create withdrawal items
        const withdrawalItems = []

        for (const { itemName, quantity } of items) {
          // Try to match item name
          let itemId = itemMap[itemName.toLowerCase().trim()]

          // Try variations
          if (!itemId) {
            // Try matching without "- cases (of 24 bottles)" etc.
            const baseName = itemName.split(' - ')[0].toLowerCase().trim()
            itemId = itemMap[baseName]
          }

          // Try "Food Care Bag" for "Food Packages"
          if (!itemId && itemName.toLowerCase().includes('food package')) {
            itemId = itemMap['food care bag']
          }

          // Try "Baby Kit" for "Baby Kits"
          if (!itemId && itemName.toLowerCase().includes('baby kit')) {
            itemId = itemMap['baby kit']
          }

          if (itemId) {
            withdrawalItems.push({
              withdrawal_id: withdrawal.id,
              item_id: itemId,
              quantity,
            })
            totalItems++
          } else {
            if (!skippedItems.includes(itemName)) {
              skippedItems.push(itemName)
            }
          }
        }

        if (withdrawalItems.length > 0) {
          const { error: itemsError } = await supabase
            .from('withdrawal_items')
            .insert(withdrawalItems)

          if (itemsError) {
            console.error(`❌ Error creating items for ${churchName}:`, itemsError.message)
            continue
          }

          totalWithdrawals++
          console.log(`✅ ${churchName}: ${withdrawalItems.length} items (${new Date(date).toLocaleDateString()})`)
        }
      }
    }

    // 8. Refresh materialized view
    console.log('\n🔄 Refreshing master inventory...')
    await supabase.rpc('refresh_master_inventory')
    console.log('✅ Master inventory refreshed')

    // 9. Summary
    console.log('\n' + '='.repeat(70))
    console.log('✅ IMPORT COMPLETE')
    console.log('='.repeat(70))
    console.log(`\n📊 Summary:`)
    console.log(`   Withdrawals created: ${totalWithdrawals}`)
    console.log(`   Withdrawal items: ${totalItems}`)

    if (skippedItems.length > 0) {
      console.log(`\n⚠️  Skipped items (not found in database):`)
      skippedItems.forEach(item => console.log(`   - ${item}`))
      console.log(`\n💡 Tip: Add these items to the database first if needed`)
    }

    console.log('\n')

  } catch (error) {
    console.error('\n❌ Import failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// Run import
importCBAJDeliveries()
