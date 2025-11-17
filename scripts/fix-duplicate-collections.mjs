#!/usr/bin/env node

/**
 * Fix Duplicate Collection Data
 *
 * Identifies and removes duplicate collection entries causing:
 * - Baby Diapers: 743 (current) should be 731 (correct) - remove 12
 * - Baby Formula: 73 (current) should be 70 (correct) - remove 3
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

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

async function analyzeDuplicates() {
  console.log('🔍 Analyzing collection data for duplicates...\n')

  // Get Baby Diapers item
  const { data: diapers } = await supabase
    .from('items')
    .select('id, name')
    .ilike('name', '%baby diaper%')
    .single()

  // Get Baby Formula item
  const { data: formula } = await supabase
    .from('items')
    .select('id, name')
    .ilike('name', '%baby formula%')
    .single()

  if (!diapers || !formula) {
    console.error('❌ Could not find Baby Diapers or Baby Formula items')
    process.exit(1)
  }

  console.log(`Found items:`)
  console.log(`  - ${diapers.name} (${diapers.id})`)
  console.log(`  - ${formula.name} (${formula.id})\n`)

  // Get all collection items for these items
  const { data: diaperCollections } = await supabase
    .from('collection_items')
    .select(`
      id,
      quantity,
      created_at,
      collection:collections(
        id,
        submission_date,
        submission_timestamp,
        submitted_by,
        notes
      )
    `)
    .eq('item_id', diapers.id)
    .order('created_at', { ascending: true })

  const { data: formulaCollections } = await supabase
    .from('collection_items')
    .select(`
      id,
      quantity,
      created_at,
      collection:collections(
        id,
        submission_date,
        submission_timestamp,
        submitted_by,
        notes
      )
    `)
    .eq('item_id', formula.id)
    .order('created_at', { ascending: true })

  // Calculate totals
  const diaperTotal = diaperCollections?.reduce((sum, item) => sum + Number(item.quantity), 0) || 0
  const formulaTotal = formulaCollections?.reduce((sum, item) => sum + Number(item.quantity), 0) || 0

  console.log(`📊 Current Totals:`)
  console.log(`  - Baby Diapers: ${diaperTotal} (expected: 731, extra: ${diaperTotal - 731})`)
  console.log(`  - Baby Formula: ${formulaTotal} (expected: 70, extra: ${formulaTotal - 70})\n`)

  // Show all collection items
  console.log(`📋 Baby Diapers Collections (${diaperCollections?.length} entries):`)
  diaperCollections?.forEach((item, idx) => {
    console.log(`  ${idx + 1}. ${item.quantity} units - ${item.collection?.submission_date} (${item.collection?.submission_timestamp})`)
  })

  console.log(`\n📋 Baby Formula Collections (${formulaCollections?.length} entries):`)
  formulaCollections?.forEach((item, idx) => {
    console.log(`  ${idx + 1}. ${item.quantity} units - ${item.collection?.submission_date} (${item.collection?.submission_timestamp})`)
  })

  return {
    diapers: { items: diaperCollections, total: diaperTotal, itemId: diapers.id },
    formula: { items: formulaCollections, total: formulaTotal, itemId: formula.id }
  }
}

async function removeDuplicates(dryRun = true) {
  const data = await analyzeDuplicates()

  console.log(`\n🔧 ${dryRun ? 'DRY RUN - ' : ''}Identifying duplicates to remove...\n`)

  // Strategy: Look for collections with identical timestamps or very close together
  // that might indicate duplicate imports

  const diaperDuplicates = []
  const formulaDuplicates = []

  // Group by submission timestamp to find potential duplicates
  const groupByTimestamp = (collections) => {
    const groups = {}
    collections?.forEach(item => {
      const timestamp = item.collection?.submission_timestamp
      if (!groups[timestamp]) {
        groups[timestamp] = []
      }
      groups[timestamp].push(item)
    })
    return groups
  }

  const diaperGroups = groupByTimestamp(data.diapers.items)
  const formulaGroups = groupByTimestamp(data.formula.items)

  // Find groups with duplicates (same timestamp, multiple entries)
  Object.entries(diaperGroups).forEach(([timestamp, items]) => {
    if (items.length > 1) {
      console.log(`⚠️  Found ${items.length} diaper entries with same timestamp: ${timestamp}`)
      items.forEach((item, idx) => {
        console.log(`    ${idx + 1}. ID: ${item.id}, Quantity: ${item.quantity}`)
      })
      // Keep first, mark rest as duplicates
      diaperDuplicates.push(...items.slice(1))
    }
  })

  Object.entries(formulaGroups).forEach(([timestamp, items]) => {
    if (items.length > 1) {
      console.log(`⚠️  Found ${items.length} formula entries with same timestamp: ${timestamp}`)
      items.forEach((item, idx) => {
        console.log(`    ${idx + 1}. ID: ${item.id}, Quantity: ${item.quantity}`)
      })
      // Keep first, mark rest as duplicates
      formulaDuplicates.push(...items.slice(1))
    }
  })

  const diaperDuplicateTotal = diaperDuplicates.reduce((sum, item) => sum + Number(item.quantity), 0)
  const formulaDuplicateTotal = formulaDuplicates.reduce((sum, item) => sum + Number(item.quantity), 0)

  console.log(`\n📉 Duplicates to remove:`)
  console.log(`  - Baby Diapers: ${diaperDuplicates.length} entries, ${diaperDuplicateTotal} units`)
  console.log(`  - Baby Formula: ${formulaDuplicates.length} entries, ${formulaDuplicateTotal} units`)

  if (!dryRun) {
    console.log(`\n🗑️  Deleting duplicate entries...`)

    if (diaperDuplicates.length > 0) {
      const { error: diaperError } = await supabase
        .from('collection_items')
        .delete()
        .in('id', diaperDuplicates.map(d => d.id))

      if (diaperError) {
        console.error(`❌ Error deleting diaper duplicates:`, diaperError)
      } else {
        console.log(`✅ Deleted ${diaperDuplicates.length} duplicate diaper entries`)
      }
    }

    if (formulaDuplicates.length > 0) {
      const { error: formulaError } = await supabase
        .from('collection_items')
        .delete()
        .in('id', formulaDuplicates.map(d => d.id))

      if (formulaError) {
        console.error(`❌ Error deleting formula duplicates:`, formulaError)
      } else {
        console.log(`✅ Deleted ${formulaDuplicates.length} duplicate formula entries`)
      }
    }

    // Refresh master inventory
    console.log(`\n🔄 Refreshing master inventory...`)
    const { error: refreshError } = await supabase.rpc('refresh_master_inventory')

    if (refreshError) {
      console.error(`❌ Error refreshing inventory:`, refreshError)
    } else {
      console.log(`✅ Master inventory refreshed`)
    }

    // Verify final totals
    console.log(`\n✅ Final verification:`)
    await analyzeDuplicates()
  } else {
    console.log(`\n⚠️  DRY RUN MODE - No changes made`)
    console.log(`Run with --execute flag to actually delete duplicates`)
  }
}

// Main execution
const args = process.argv.slice(2)
const execute = args.includes('--execute')

removeDuplicates(!execute)
  .then(() => {
    console.log(`\n✅ Done!`)
    process.exit(0)
  })
  .catch((error) => {
    console.error(`\n❌ Error:`, error)
    process.exit(1)
  })
