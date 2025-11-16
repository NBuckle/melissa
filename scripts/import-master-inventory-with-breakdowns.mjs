#!/usr/bin/env node
/**
 * Import Master Inventory with Withdrawal Breakdowns
 *
 * Usage: node --env-file=.env.local scripts/import-master-inventory-with-breakdowns.mjs <subfolder>
 * Example: node --env-file=.env.local scripts/import-master-inventory-with-breakdowns.mjs nov16
 *
 * This script imports:
 * 1. Total Distributed figures for each item
 * 2. Withdrawal breakdowns by giveaway (Packed OUT Nov 4, Expired Goods, etc.)
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Get subfolder from command line argument
const subfolder = process.argv[2]
if (!subfolder) {
  console.error('❌ Please provide a subfolder name')
  console.error('Usage: node --env-file=.env.local scripts/import-master-inventory-with-breakdowns.mjs <subfolder>')
  console.error('Example: node --env-file=.env.local scripts/import-master-inventory-with-breakdowns.mjs nov16')
  process.exit(1)
}

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// File path
const SHEETS_DIR = path.join(__dirname, '../old google sheets', subfolder)
const MASTER_INVENTORY = path.join(SHEETS_DIR, 'Inventory - Melissa Donations - Master Inventory.csv')

console.log(`📁 Looking for data in: ${SHEETS_DIR}`)

/**
 * Get all items from database
 */
async function getItems() {
  const { data, error } = await supabase
    .from('items')
    .select('id, name')

  if (error) throw error
  return data
}

/**
 * Create a map of item names to IDs (case-insensitive)
 */
function createItemNameMap(items) {
  const map = new Map()
  items.forEach(item => {
    const normalizedName = item.name.toLowerCase().trim()
    map.set(normalizedName, item)
  })
  return map
}

/**
 * Import withdrawal breakdowns from Master Inventory CSV
 */
async function importWithdrawalBreakdowns() {
  console.log('\n📥 Importing withdrawal breakdowns from Master Inventory...')

  if (!fs.existsSync(MASTER_INVENTORY)) {
    console.log('⚠️  Master Inventory file not found')
    console.log(`   Expected: ${MASTER_INVENTORY}`)
    return
  }

  const fileContent = fs.readFileSync(MASTER_INVENTORY, 'utf-8')
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    from_line: 3  // Skip first 2 header rows
  })

  const items = await getItems()
  const itemMap = createItemNameMap(items)

  console.log(`Found ${records.length} inventory records in CSV`)

  // Clear existing withdrawal breakdowns
  console.log('🗑️  Clearing existing withdrawal breakdowns...')
  const { error: deleteError } = await supabase
    .from('withdrawal_breakdowns')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

  if (deleteError) {
    console.error('❌ Error clearing existing data:', deleteError.message)
    return
  }

  let imported = 0
  let skipped = 0

  // Identify giveaway columns (skip Group, Item, Total Collected, Total Distributed, Current Stock)
  const skipColumns = ['Group', 'Item', 'Total Collected', 'Total Distributed', 'Current Stock']
  const firstRecord = records[0]
  const giveawayColumns = Object.keys(firstRecord).filter(col => !skipColumns.includes(col) && firstRecord[col] !== undefined)

  console.log(`\n📊 Found ${giveawayColumns.length} giveaway columns:`)
  giveawayColumns.forEach(col => console.log(`   - ${col}`))

  for (const record of records) {
    const itemName = record['Item']
    if (!itemName) {
      skipped++
      continue
    }

    // Find matching item in database
    const normalizedName = itemName.toLowerCase().trim()
    const item = itemMap.get(normalizedName)

    if (!item) {
      console.log(`⚠️  Item not found in database: "${itemName}"`)
      skipped++
      continue
    }

    // Process each giveaway column
    for (const giveawayColumn of giveawayColumns) {
      const quantityStr = record[giveawayColumn]
      if (!quantityStr || quantityStr.trim() === '' || quantityStr === '0') {
        continue
      }

      // Parse quantity
      let quantity = 0
      try {
        const cleanValue = quantityStr.toString().replace(/[^\d.]/g, '')
        quantity = parseFloat(cleanValue)
        if (isNaN(quantity) || quantity <= 0) continue
      } catch (e) {
        console.log(`⚠️  Invalid quantity for ${itemName} / ${giveawayColumn}: "${quantityStr}"`)
        continue
      }

      // Insert withdrawal breakdown
      const { error: insertError } = await supabase
        .from('withdrawal_breakdowns')
        .insert({
          item_id: item.id,
          giveaway_name: giveawayColumn,
          quantity: quantity
        })

      if (insertError) {
        console.error(`❌ Error inserting breakdown for ${itemName}:`, insertError.message)
        continue
      }

      imported++
    }
  }

  console.log(`\n✅ Import Summary:`)
  console.log(`   - Withdrawal breakdowns imported: ${imported}`)
  console.log(`   - Items skipped: ${skipped}`)
}

/**
 * Main import function
 */
async function main() {
  console.log('🚀 Starting Master Inventory Breakdown Import')
  console.log(`📁 Subfolder: ${subfolder}`)
  console.log('=' .repeat(60))

  try {
    // Test connection
    const { error: connectionError } = await supabase.from('items').select('count', { count: 'exact', head: true })
    if (connectionError) throw new Error(`Database connection failed: ${connectionError.message}`)
    console.log(`✅ Connected to Supabase`)

    // Import withdrawal breakdowns
    await importWithdrawalBreakdowns()

    console.log('\n' + '='.repeat(60))
    console.log('✅ Import completed successfully!')
    console.log('\nNext steps:')
    console.log('1. The Total Inventory page will now show withdrawal breakdowns')
    console.log('2. Check the application to verify the data')

  } catch (error) {
    console.error('\n❌ Import failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// Run the import
main()
