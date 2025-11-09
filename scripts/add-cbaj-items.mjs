#!/usr/bin/env node
/**
 * Add Missing CBAJ Delivery Items
 *
 * Adds items that are specific to CBAJ deliveries
 * (Food Packages, Water cases, Tarpaulins, etc.)
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function addItems() {
  console.log('📦 Adding CBAJ delivery items...\n')

  // Get "Other" category
  const { data: categories } = await supabase
    .from('item_categories')
    .select('id, name')

  const otherCategory = categories?.find(c => c.name === 'Other')
  const pantryCategory = categories?.find(c => c.name === 'Pantry')

  const newItems = [
    {
      name: 'Food Packages',
      category_id: pantryCategory?.id || otherCategory?.id,
      unit_type: 'units',
      low_stock_threshold: 10,
      is_active: true,
    },
    {
      name: 'Water - cases (of 24 bottles)',
      category_id: pantryCategory?.id || otherCategory?.id,
      unit_type: 'cases',
      low_stock_threshold: 5,
      is_active: true,
    },
    {
      name: 'Water - 1 Litre',
      category_id: pantryCategory?.id || otherCategory?.id,
      unit_type: 'bottles',
      low_stock_threshold: 10,
      is_active: true,
    },
    {
      name: 'Water - 5 Gallon',
      category_id: pantryCategory?.id || otherCategory?.id,
      unit_type: 'jugs',
      low_stock_threshold: 5,
      is_active: true,
    },
    {
      name: 'Tarpaulins',
      category_id: otherCategory?.id,
      unit_type: 'units',
      low_stock_threshold: 10,
      is_active: true,
    },
    {
      name: 'Water Storage Containers',
      category_id: otherCategory?.id,
      unit_type: 'units',
      low_stock_threshold: 5,
      is_active: true,
    },
    {
      name: 'Hygiene Kit Bags',
      category_id: otherCategory?.id,
      unit_type: 'bags',
      low_stock_threshold: 5,
      is_active: true,
    },
    {
      name: 'Women Sanitary Kits',
      category_id: otherCategory?.id,
      unit_type: 'kits',
      low_stock_threshold: 5,
      is_active: true,
    },
    {
      name: 'Laundry Kits Bags',
      category_id: otherCategory?.id,
      unit_type: 'bags',
      low_stock_threshold: 5,
      is_active: true,
    },
    {
      name: 'Mosquito Destroyer Kits',
      category_id: otherCategory?.id,
      unit_type: 'kits',
      low_stock_threshold: 5,
      is_active: true,
    },
    {
      name: 'Snacks Kits',
      category_id: pantryCategory?.id || otherCategory?.id,
      unit_type: 'kits',
      low_stock_threshold: 5,
      is_active: true,
    },
    {
      name: 'Cereal kits',
      category_id: pantryCategory?.id || otherCategory?.id,
      unit_type: 'kits',
      low_stock_threshold: 5,
      is_active: true,
    },
  ]

  for (const item of newItems) {
    const { data, error } = await supabase
      .from('items')
      .upsert(item, { onConflict: 'name', ignoreDuplicates: false })
      .select()

    if (error) {
      console.log(`❌ ${item.name}: ${error.message}`)
    } else {
      console.log(`✅ ${item.name}`)
    }
  }

  console.log('\n✅ Done!\n')
}

addItems()
