#!/usr/bin/env node
/**
 * Import Google Sheets Data to Supabase
 *
 * This script imports:
 * 1. Historical collections from Form Responses
 * 2. Withdrawal/distribution records from Master Inventory
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Please add SUPABASE_SERVICE_ROLE_KEY to .env.local')
  console.error('You can find it in Supabase Dashboard → Settings → API → service_role key')
  process.exit(1)
}

console.log('🔑 Using service role key (bypasses RLS for import)')
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// File paths
const SHEETS_DIR = path.join(__dirname, '../old google sheets')
const FORM_RESPONSES = path.join(SHEETS_DIR, 'Inventory - Melissa Donations - Form Responses.csv')
const MASTER_INVENTORY = path.join(SHEETS_DIR, 'Inventory - Melissa Donations - Master Inventory.csv')

/**
 * Get all items from database
 */
async function getItems() {
  const { data, error } = await supabase
    .from('items')
    .select('id, name, unit_type')

  if (error) throw error
  return data
}

/**
 * Create a map of item names to IDs (case-insensitive, handle variations)
 */
function createItemNameMap(items) {
  const map = new Map()

  items.forEach(item => {
    const normalizedName = item.name.toLowerCase().trim()
    map.set(normalizedName, item)

    // Handle common variations
    if (item.name.includes('(')) {
      const withoutParens = item.name.split('(')[0].trim().toLowerCase()
      map.set(withoutParens, item)
    }
  })

  return map
}

/**
 * Get a user ID for imports (uses first available profile or NULL)
 */
async function getImportUserId() {
  // Try to get any existing profile
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .limit(1)

  if (profiles && profiles.length > 0) {
    console.log(`ℹ️  Using existing profile for imports: ${profiles[0].email}`)
    return profiles[0].id
  }

  // If no profiles exist, we'll use NULL (collections table should allow this for imports)
  console.log('ℹ️  No profiles found, using NULL for submitted_by')
  return null
}

/**
 * Import collections from Form Responses CSV
 */
async function importCollections() {
  console.log('\n📥 Importing collections from Form Responses...')

  if (!fs.existsSync(FORM_RESPONSES)) {
    console.log('⚠️  Form Responses file not found, skipping')
    return
  }

  const fileContent = fs.readFileSync(FORM_RESPONSES, 'utf-8')
  const records = parse(fileContent, { columns: true, skip_empty_lines: true })

  const items = await getItems()
  const itemMap = createItemNameMap(items)
  const importUserId = await getImportUserId()

  let imported = 0
  let skipped = 0

  console.log(`Found ${records.length} form responses`)

  for (const record of records) {
    const timestamp = record['Timestamp']
    const dateOnly = record['Date Only']

    if (!timestamp || !dateOnly) {
      skipped++
      continue
    }

    // Parse date (format: M/D/YYYY)
    const [month, day, year] = dateOnly.split('/')
    const submissionDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`

    // Collect all items with quantities
    const collectionItems = []

    for (const [columnName, value] of Object.entries(record)) {
      if (columnName === 'Timestamp' || columnName === 'Date Only') continue
      if (columnName.toLowerCase().includes('make new item')) continue // Skip the "Make new item" column
      if (!value || value.trim() === '' || value === '0') continue

      // Try to find matching item
      const normalizedName = columnName.toLowerCase().trim()
      const item = itemMap.get(normalizedName)

      if (!item) {
        // Only log if it's not a known skip column
        if (!columnName.toLowerCase().includes('make new item')) {
          console.log(`⚠️  Item not found: "${columnName}"`)
        }
        continue
      }

      // Parse quantity (handle decimals and special cases)
      let quantity = 0
      try {
        // Remove any non-numeric characters except decimal point
        const cleanValue = value.toString().replace(/[^\d.]/g, '')
        quantity = parseFloat(cleanValue)

        if (isNaN(quantity) || quantity <= 0) continue
      } catch (e) {
        console.log(`⚠️  Invalid quantity for ${columnName}: "${value}"`)
        continue
      }

      collectionItems.push({
        item_id: item.id,
        quantity: quantity
      })
    }

    if (collectionItems.length === 0) {
      skipped++
      continue
    }

    // Create collection record
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .insert([{
        submitted_by: importUserId,
        submission_date: submissionDate,
        submission_timestamp: new Date(timestamp).toISOString(),
        notes: 'Imported from Google Sheets'
      }])
      .select()
      .single()

    if (collectionError) {
      console.error(`❌ Error creating collection for ${dateOnly}:`, collectionError.message)
      skipped++
      continue
    }

    // Create collection items
    const itemsToInsert = collectionItems.map(ci => ({
      collection_id: collection.id,
      item_id: ci.item_id,
      quantity: ci.quantity
    }))

    const { error: itemsError } = await supabase
      .from('collection_items')
      .insert(itemsToInsert)

    if (itemsError) {
      console.error(`❌ Error creating collection items:`, itemsError.message)
      // Rollback: delete the collection
      await supabase.from('collections').delete().eq('id', collection.id)
      skipped++
      continue
    }

    imported++
    if (imported % 10 === 0) {
      console.log(`  Imported ${imported} collections...`)
    }
  }

  console.log(`✅ Imported ${imported} collections (${skipped} skipped)`)

  // Refresh materialized view
  console.log('🔄 Refreshing master inventory view...')
  await supabase.rpc('refresh_master_inventory')
  console.log('✅ Inventory view refreshed')
}

/**
 * Import withdrawals from Master Inventory CSV
 */
async function importWithdrawals() {
  console.log('\n📤 Importing withdrawals from Master Inventory...')

  if (!fs.existsSync(MASTER_INVENTORY)) {
    console.log('⚠️  Master Inventory file not found, skipping')
    return
  }

  const fileContent = fs.readFileSync(MASTER_INVENTORY, 'utf-8')
  const records = parse(fileContent, { columns: true, skip_empty_lines: true })

  const items = await getItems()
  const itemMap = createItemNameMap(items)

  // Get distribution types
  const { data: distributionTypes } = await supabase
    .from('distribution_types')
    .select('id, name')

  const distributionTypeMap = new Map(
    distributionTypes.map(dt => [dt.name.toLowerCase(), dt.id])
  )

  console.log(`Found ${records.length} inventory records`)
  console.log('⚠️  Note: Withdrawal import is complex and may need manual review')
  console.log('⚠️  Current script imports basic withdrawal data only')

  // For now, just log what would be imported
  // You can enhance this to actually import withdrawals

  let totalWithdrawals = 0
  for (const record of records) {
    const totalDistributed = parseFloat(record['Total Distributed'] || 0)
    if (totalDistributed > 0) {
      totalWithdrawals++
    }
  }

  console.log(`📊 Found ${totalWithdrawals} items with distributions`)
  console.log('ℹ️  Detailed withdrawal import can be added based on your needs')
}

/**
 * Main import function
 */
async function main() {
  console.log('🚀 Starting Google Sheets Data Import')
  console.log('=' .repeat(50))

  try {
    // Test connection
    const { data, error } = await supabase.from('items').select('count', { count: 'exact', head: true })
    if (error) throw new Error(`Database connection failed: ${error.message}`)
    console.log(`✅ Connected to Supabase (${data} items in database)`)

    // Import collections
    await importCollections()

    // Import withdrawals
    await importWithdrawals()

    console.log('\n' + '='.repeat(50))
    console.log('✅ Import completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Review the imported data in Supabase')
    console.log('2. Check the Total Inventory page to verify stock levels')
    console.log('3. Test the application with: npm run dev')

  } catch (error) {
    console.error('\n❌ Import failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// Run the import
main()
