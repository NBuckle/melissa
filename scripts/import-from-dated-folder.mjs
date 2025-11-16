#!/usr/bin/env node
/**
 * Import Google Sheets Data from Dated Subfolders
 *
 * Usage: node --env-file=.env.local scripts/import-from-dated-folder.mjs <subfolder>
 * Example: node --env-file=.env.local scripts/import-from-dated-folder.mjs nov16
 *
 * This script:
 * 1. Imports collections from Form Responses (checks for duplicates)
 * 2. Can be run multiple times safely (won't duplicate data)
 * 3. Works with dated subfolders in 'old google sheets/'
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
  console.error('Usage: node --env-file=.env.local scripts/import-from-dated-folder.mjs <subfolder>')
  console.error('Example: node --env-file=.env.local scripts/import-from-dated-folder.mjs nov16')
  process.exit(1)
}

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
const SHEETS_DIR = path.join(__dirname, '../old google sheets', subfolder)
const FORM_RESPONSES = path.join(SHEETS_DIR, 'Inventory - Melissa Donations - Form Responses.csv')
const MASTER_INVENTORY = path.join(SHEETS_DIR, 'Inventory - Melissa Donations - Master Inventory.csv')

console.log(`📁 Looking for data in: ${SHEETS_DIR}`)

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
 * Check if a collection already exists by timestamp
 */
async function collectionExists(timestamp) {
  const isoTimestamp = new Date(timestamp).toISOString()

  const { data, error } = await supabase
    .from('collections')
    .select('id')
    .eq('submission_timestamp', isoTimestamp)
    .limit(1)

  if (error) {
    console.error('Error checking collection existence:', error)
    return false
  }

  return data && data.length > 0
}

/**
 * Get existing collection dates for reporting
 */
async function getExistingCollectionDates() {
  const { data, error } = await supabase
    .from('collections')
    .select('submission_date, submission_timestamp')
    .order('submission_date', { ascending: false })

  if (error) {
    console.error('Error fetching existing collections:', error)
    return []
  }

  return data || []
}

/**
 * Import collections from Form Responses CSV
 */
async function importCollections() {
  console.log('\n📥 Importing collections from Form Responses...')

  if (!fs.existsSync(FORM_RESPONSES)) {
    console.log('⚠️  Form Responses file not found, skipping')
    console.log(`   Expected: ${FORM_RESPONSES}`)
    return
  }

  const fileContent = fs.readFileSync(FORM_RESPONSES, 'utf-8')
  const records = parse(fileContent, { columns: true, skip_empty_lines: true })

  const items = await getItems()
  const itemMap = createItemNameMap(items)
  const importUserId = await getImportUserId()

  let imported = 0
  let skipped = 0
  let duplicates = 0

  console.log(`Found ${records.length} form responses in CSV`)

  for (const record of records) {
    const timestamp = record['Timestamp']
    const dateOnly = record['Date Only']

    if (!timestamp || !dateOnly) {
      skipped++
      continue
    }

    // Check if this collection already exists
    const exists = await collectionExists(timestamp)
    if (exists) {
      duplicates++
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
          // console.log(`⚠️  Item not found: "${columnName}"`)
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
        notes: `Imported from Google Sheets (${subfolder})`
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
      console.log(`  Imported ${imported} new collections...`)
    }
  }

  console.log(`\n✅ Import Summary:`)
  console.log(`   - New collections: ${imported}`)
  console.log(`   - Duplicates (skipped): ${duplicates}`)
  console.log(`   - Invalid/Empty (skipped): ${skipped}`)

  if (imported > 0) {
    // Refresh materialized view
    console.log('\n🔄 Refreshing master inventory view...')
    const { error: refreshError } = await supabase.rpc('refresh_master_inventory')
    if (refreshError) {
      console.error('❌ Error refreshing inventory view:', refreshError.message)
    } else {
      console.log('✅ Inventory view refreshed')
    }
  }
}

/**
 * Import withdrawals from Master Inventory CSV (future enhancement)
 */
async function importWithdrawals() {
  console.log('\n📤 Checking for withdrawals in Master Inventory...')

  if (!fs.existsSync(MASTER_INVENTORY)) {
    console.log('⚠️  Master Inventory file not found, skipping')
    console.log(`   Expected: ${MASTER_INVENTORY}`)
    return
  }

  console.log('ℹ️  Master Inventory file found but withdrawal import not yet implemented')
  console.log('ℹ️  This can be added based on your withdrawal tracking needs')
}

/**
 * Show current database status
 */
async function showDatabaseStatus() {
  console.log('\n📊 Current Database Status:')

  // Count collections
  const { count: collectionCount } = await supabase
    .from('collections')
    .select('*', { count: 'exact', head: true })

  console.log(`   - Total collections: ${collectionCount}`)

  // Count collection items
  const { count: itemCount } = await supabase
    .from('collection_items')
    .select('*', { count: 'exact', head: true })

  console.log(`   - Total collection items: ${itemCount}`)

  // Date range
  const { data: dateRange } = await supabase
    .from('collections')
    .select('submission_date')
    .order('submission_date', { ascending: true })
    .limit(1)

  const { data: dateRangeEnd } = await supabase
    .from('collections')
    .select('submission_date')
    .order('submission_date', { ascending: false })
    .limit(1)

  if (dateRange && dateRange.length > 0 && dateRangeEnd && dateRangeEnd.length > 0) {
    console.log(`   - Date range: ${dateRange[0].submission_date} to ${dateRangeEnd[0].submission_date}`)
  }
}

/**
 * Main import function
 */
async function main() {
  console.log('🚀 Starting Google Sheets Data Import')
  console.log(`📁 Subfolder: ${subfolder}`)
  console.log('=' .repeat(60))

  try {
    // Test connection
    const { error: connectionError } = await supabase.from('items').select('count', { count: 'exact', head: true })
    if (connectionError) throw new Error(`Database connection failed: ${connectionError.message}`)
    console.log(`✅ Connected to Supabase`)

    // Show current status before import
    await showDatabaseStatus()

    // Import collections
    await importCollections()

    // Import withdrawals (future)
    await importWithdrawals()

    // Show status after import
    await showDatabaseStatus()

    console.log('\n' + '='.repeat(60))
    console.log('✅ Import completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Review the imported data in your application')
    console.log('2. Check the Total Inventory page to verify stock levels')
    console.log('3. View Reports → Daily Closing Balance for the new data')

  } catch (error) {
    console.error('\n❌ Import failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// Run the import
main()
