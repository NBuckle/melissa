#!/usr/bin/env node
/**
 * Import CBAJ Deliveries - Correctly parsed structure
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const subfolder = process.argv[2] || 'nov16'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const CBAJ_FILE = path.join(__dirname, `../old google sheets/${subfolder}/Inventory - Melissa Donations - CBAJ DELIVERIES to CHURCHES.csv`)

async function importDeliveries() {
  console.log('\n📦 Parsing CBAJ Deliveries...')

  if (!fs.existsSync(CBAJ_FILE)) {
    console.log('⚠️  File not found')
    return
  }

  const lines = fs.readFileSync(CBAJ_FILE, 'utf-8').split('\n')
  
  // Row indices (0-based)
  const siteRow = 5    // Row 6: Site names
  const parishRow = 7  // Row 8: Parish names
  const dateRow = 8    // Row 9: First item row has dates
  
  const sitesLine = lines[siteRow].split(',')
  const parishesLine = lines[parishRow].split(',')
  
  console.log('🗑️  Clearing existing deliveries...')
  await supabase.from('cbaj_deliveries').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const deliveries = []
  
  // Define parish groups with their column ranges and dates
  const parishGroups = [
    {
      parish: 'St Elizabeth',
      date: '2025-11-05',
      siteCols: [2, 3, 4, 5, 6, 7, 8, 9, 10], // Columns C-K (0-indexed)
      sites: ['Johnson', 'Comfort Hall', 'Roses Valley', 'Aberdeen', 'Black River',
              'Emmaus Gospel Chapel', 'Quick Step', 'Brucefield Gospel Chapel', 'Gifted to Individuals']
    },
    {
      parish: 'Trelawny',
      date: '2025-11-08',
      siteCols: [18, 19, 20, 21], // Columns S-V
      sites: ['Albert Town', 'Sawyers', 'Bethel Town', 'Clarks Town']
    },
    {
      parish: 'St. James',
      date: '2025-11-12',
      siteCols: [26, 27, 28, 29, 30, 31, 32, 33, 34], // Columns AA-AI
      sites: ['Maroon Town', 'Niagra', 'Bickersteth', 'Cambridge', 'Pitfour',
              'Redemption', 'Emmanuel', 'Canaan', 'Godfrey Stewart High']
    },
    {
      parish: 'South St. Eliz',
      date: '2025-11-15',
      siteCols: [39, 40], // Columns AN-AO
      sites: ['Billy Bay', 'Grace']
    }
  ]

  // Parse item rows (starting from row 9, index 8)
  for (let i = 8; i < Math.min(lines.length, 35); i++) {
    const row = lines[i].split(',')
    const itemType = row[1]?.trim()
    
    if (!itemType || itemType === '') continue

    // Process each parish group
    for (const group of parishGroups) {
      // Check each site in this parish
      group.sites.forEach((site, siteIdx) => {
        const colIdx = group.siteCols[siteIdx]
        const qty = row[colIdx]?.trim()
        
        if (qty && qty !== '' && qty !== '0') {
          deliveries.push({
            delivery_date: group.date,
            parish: group.parish,
            church_name: site,
            item_type: itemType,
            quantity: qty
          })
        }
      })
    }
  }

  console.log(`📊 Parsed ${deliveries.length} delivery records`)

  if (deliveries.length > 0) {
    // Need to add parish column to table first
    const { error } = await supabase.from('cbaj_deliveries').insert(deliveries)
    if (error) {
      console.error('❌ Error:', error.message)
      console.log('Hint: You may need to add "parish TEXT" column to cbaj_deliveries table')
    } else {
      console.log(`✅ Imported ${deliveries.length} deliveries`)
    }
  }
}

importDeliveries().then(() => console.log('✅ Done!'))
