#!/usr/bin/env node

/**
 * Clean Re-Import of Collections from Nov16 Data
 *
 * This script:
 * 1. Backs up current collection data
 * 2. Clears all collections and collection_items
 * 3. Re-imports from nov16 Form Responses CSV with deduplication
 * 4. Refreshes master_inventory
 * 5. Verifies totals (should be 731 diapers, 70 formula)
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'
import csv from 'csv-parser'

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

const CSV_PATH = join(__dirname, '../old google sheets/nov16/Inventory - Melissa Donations - Form Responses.csv')
const BACKUP_PATH = join(__dirname, `../backups/collections-backup-${Date.now()}.json`)

// Create backups directory if it doesn't exist
const backupsDir = join(__dirname, '../backups')
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true })
}

async function backupCurrentData() {
  console.log('💾 Backing up current collection data...\n')

  const { data: collections, error } = await supabase
    .from('collections')
    .select(`
      *,
      collection_items (
        id,
        item_id,
        quantity,
        items (name)
      )
    `)
    .order('submission_timestamp', { ascending: true })

  if (error) {
    console.error('❌ Error fetching collections:', error)
    throw error
  }

  fs.writeFileSync(BACKUP_PATH, JSON.stringify(collections, null, 2))
  console.log(`✅ Backed up ${collections.length} collections to:`)
  console.log(`   ${BACKUP_PATH}\n`)

  return collections
}

async function clearCollections() {
  console.log('🗑️  Clearing all collection data...\n')

  // Delete collection_items first (foreign key constraint)
  const { error: itemsError } = await supabase
    .from('collection_items')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

  if (itemsError) {
    console.error('❌ Error deleting collection_items:', itemsError)
    throw itemsError
  }

  // Delete collections
  const { error: collectionsError } = await supabase
    .from('collections')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

  if (collectionsError) {
    console.error('❌ Error deleting collections:', collectionsError)
    throw collectionsError
  }

  console.log('✅ All collection data cleared\n')
}

async function getItemsMap() {
  const { data: items, error } = await supabase
    .from('items')
    .select('id, name')

  if (error) {
    console.error('❌ Error fetching items:', error)
    throw error
  }

  const itemsMap = new Map()
  items.forEach(item => {
    const normalizedName = item.name.toLowerCase().trim()
    itemsMap.set(normalizedName, item.id)

    // Also add without parentheses for flexible matching
    const nameWithoutParens = normalizedName.replace(/\s*\([^)]*\)/g, '').trim()
    if (nameWithoutParens !== normalizedName) {
      itemsMap.set(nameWithoutParens, item.id)
    }
  })

  console.log(`📋 Loaded ${items.length} items from database\n`)
  return itemsMap
}

async function getDefaultUser() {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
    .single()

  return profiles?.id || null
}

async function importFromCSV() {
  console.log('📥 Importing from Form Responses CSV...\n')

  const itemsMap = await getItemsMap()
  const defaultUserId = await getDefaultUser()

  const results = {
    processed: 0,
    imported: 0,
    skipped: 0,
    duplicates: 0,
    errors: []
  }

  const existingTimestamps = new Set()

  return new Promise((resolve, reject) => {
    const rows = []

    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', (row) => {
        rows.push(row)
      })
      .on('end', async () => {
        console.log(`📊 Found ${rows.length} rows in CSV\n`)

        for (const row of rows) {
          results.processed++

          // Skip rows without timestamp
          if (!row.Timestamp || !row['Date Only']) {
            results.skipped++
            continue
          }

          // Parse timestamp
          const timestamp = row.Timestamp.trim()
          let isoTimestamp, isoDate

          try {
            const date = new Date(timestamp)
            if (isNaN(date.getTime())) {
              throw new Error('Invalid date')
            }
            isoTimestamp = date.toISOString()
            isoDate = date.toISOString().split('T')[0]
          } catch (err) {
            results.skipped++
            continue
          }

          // Check for duplicates (in this import session)
          if (existingTimestamps.has(isoTimestamp)) {
            results.duplicates++
            continue
          }
          existingTimestamps.add(isoTimestamp)

          // Process items
          const collectionItems = []

          for (const [columnName, value] of Object.entries(row)) {
            // Skip metadata columns and special columns
            if (columnName === 'Timestamp' ||
                columnName === 'Date Only' ||
                columnName.includes('Make new item')) {
              continue
            }

            // Skip empty values
            if (!value || value.trim() === '') {
              continue
            }

            // Find item in database
            const normalizedColumnName = columnName.toLowerCase().trim()
            const itemId = itemsMap.get(normalizedColumnName)

            if (!itemId) {
              // Item not found - skip silently (many columns won't match)
              continue
            }

            // Parse quantity
            const cleanValue = value.toString().replace(/[^\d.]/g, '').trim()
            const quantity = parseFloat(cleanValue)

            if (isNaN(quantity) || quantity <= 0) {
              continue
            }

            collectionItems.push({
              item_id: itemId,
              quantity: quantity
            })
          }

          // Skip if no items
          if (collectionItems.length === 0) {
            results.skipped++
            continue
          }

          // Insert collection
          try {
            const { data: collection, error: collectionError } = await supabase
              .from('collections')
              .insert([{
                submitted_by: defaultUserId,
                submission_date: isoDate,
                submission_timestamp: isoTimestamp,
                notes: 'Imported from Google Sheets (nov16)'
              }])
              .select()
              .single()

            if (collectionError) {
              throw collectionError
            }

            // Insert collection items
            const itemsToInsert = collectionItems.map(item => ({
              collection_id: collection.id,
              ...item
            }))

            const { error: itemsError } = await supabase
              .from('collection_items')
              .insert(itemsToInsert)

            if (itemsError) {
              // Rollback: delete the collection
              await supabase.from('collections').delete().eq('id', collection.id)
              throw itemsError
            }

            results.imported++

            if (results.imported % 10 === 0) {
              console.log(`  ✓ Imported ${results.imported} collections...`)
            }

          } catch (error) {
            results.errors.push({
              timestamp: isoTimestamp,
              error: error.message
            })
          }
        }

        resolve(results)
      })
      .on('error', (error) => {
        reject(error)
      })
  })
}

async function refreshInventory() {
  console.log('\n🔄 Refreshing master inventory...')

  const { error } = await supabase.rpc('refresh_master_inventory')

  if (error) {
    console.error('❌ Error refreshing inventory:', error)
    throw error
  }

  console.log('✅ Master inventory refreshed\n')
}

async function verifyTotals() {
  console.log('🔍 Verifying totals...\n')

  // Get Baby Diapers
  const { data: diapers } = await supabase
    .from('master_inventory')
    .select('item_name, total_collected, current_stock')
    .ilike('item_name', '%baby diaper%')
    .single()

  // Get Baby Formula
  const { data: formula } = await supabase
    .from('master_inventory')
    .select('item_name, total_collected, current_stock')
    .ilike('item_name', '%baby formula%')
    .single()

  console.log('📊 Final Totals:')
  console.log(`  Baby Diapers: ${diapers?.total_collected || 0} (expected: 731) ${diapers?.total_collected === 731 ? '✅' : '❌'}`)
  console.log(`  Baby Formula: ${formula?.total_collected || 0} (expected: 70) ${formula?.total_collected === 70 ? '✅' : '❌'}`)
  console.log()

  return {
    diapers: diapers?.total_collected || 0,
    formula: formula?.total_collected || 0,
    diapersCorrect: diapers?.total_collected === 731,
    formulaCorrect: formula?.total_collected === 70
  }
}

// Main execution
async function main() {
  console.log('🚀 Clean Collection Data Re-Import\n')
  console.log('=' .repeat(50))
  console.log()

  try {
    // Step 1: Backup
    await backupCurrentData()

    // Step 2: Clear
    await clearCollections()

    // Step 3: Import
    const results = await importFromCSV()

    console.log('\n' + '='.repeat(50))
    console.log('\n📈 Import Summary:')
    console.log(`  Total Rows Processed: ${results.processed}`)
    console.log(`  Successfully Imported: ${results.imported}`)
    console.log(`  Skipped (invalid/empty): ${results.skipped}`)
    console.log(`  Duplicates: ${results.duplicates}`)
    console.log(`  Errors: ${results.errors.length}`)

    if (results.errors.length > 0) {
      console.log('\n⚠️  Errors:')
      results.errors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err.timestamp}: ${err.error}`)
      })
    }

    // Step 4: Refresh inventory
    await refreshInventory()

    // Step 5: Verify
    const verification = await verifyTotals()

    console.log('=' .repeat(50))
    console.log()

    if (verification.diapersCorrect && verification.formulaCorrect) {
      console.log('✅ SUCCESS! All totals are correct!')
    } else {
      console.log('⚠️  WARNING: Totals do not match expected values')
      console.log('   This may indicate missing or extra data in the CSV')
    }

    console.log('\n✅ Import complete!')
    process.exit(0)

  } catch (error) {
    console.error('\n❌ Fatal error:', error)
    console.log('\n💾 Your data has been backed up to:', BACKUP_PATH)
    process.exit(1)
  }
}

main()
