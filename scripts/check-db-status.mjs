#!/usr/bin/env node
/**
 * Database Status Checker
 *
 * Run this at the start of each session to see what's been set up.
 * Usage: npm run check-db
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function checkDatabaseStatus() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 MELISSA INVENTORY - DATABASE STATUS CHECK')
  console.log('='.repeat(60))
  console.log(`\n🔗 Supabase URL: ${SUPABASE_URL}`)
  console.log(`📅 Check Time: ${new Date().toLocaleString()}\n`)

  const results = {
    migrations: { run: false, details: '' },
    categories: { count: 0, exists: false },
    items: { count: 0, exists: false },
    collections: { count: 0, exists: false },
    profiles: { count: 0, exists: false },
    dataImported: false,
  }

  // Check 1: Core tables exist?
  console.log('1️⃣  CHECKING MIGRATIONS STATUS...')
  const tables = ['profiles', 'item_categories', 'items', 'collections', 'distribution_types']
  let allTablesExist = true

  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1)
    if (error) {
      console.log(`   ❌ Table '${table}' NOT FOUND`)
      allTablesExist = false
    } else {
      console.log(`   ✅ Table '${table}' exists`)
    }
  }

  results.migrations.run = allTablesExist
  results.migrations.details = allTablesExist
    ? 'All migration tables found'
    : 'Some tables missing - migrations not fully run'

  // Check 2: Categories seeded?
  console.log('\n2️⃣  CHECKING CATEGORIES...')
  const { data: categories, error: catError } = await supabase
    .from('item_categories')
    .select('name')
    .order('order_index')

  if (catError) {
    console.log(`   ❌ Cannot access categories: ${catError.message}`)
  } else if (categories.length === 0) {
    console.log(`   ⚠️  No categories found (expected 5)`)
  } else {
    results.categories.count = categories.length
    results.categories.exists = true
    console.log(`   ✅ Found ${categories.length} categories:`)
    categories.forEach(c => console.log(`      - ${c.name}`))
  }

  // Check 3: Items seeded?
  console.log('\n3️⃣  CHECKING ITEMS...')
  const { count: itemCount, error: itemError } = await supabase
    .from('items')
    .select('*', { count: 'exact', head: true })

  if (itemError) {
    console.log(`   ❌ Cannot access items: ${itemError.message}`)
  } else if (itemCount === 0) {
    console.log(`   ⚠️  No items found (expected ~90 from seed data)`)
  } else {
    results.items.count = itemCount
    results.items.exists = true
    console.log(`   ✅ Found ${itemCount} items`)

    // Show a few examples
    const { data: sampleItems } = await supabase
      .from('items')
      .select('name, unit_type')
      .limit(5)
    if (sampleItems) {
      console.log(`   📦 Sample items:`)
      sampleItems.forEach(i => console.log(`      - ${i.name} (${i.unit_type})`))
    }
  }

  // Check 4: Collections imported?
  console.log('\n4️⃣  CHECKING COLLECTIONS...')
  const { count: collectionCount, error: collError } = await supabase
    .from('collections')
    .select('*', { count: 'exact', head: true })

  if (collError) {
    console.log(`   ❌ Cannot access collections: ${collError.message}`)
  } else {
    results.collections.count = collectionCount
    results.collections.exists = true

    if (collectionCount === 0) {
      console.log(`   ⚠️  No collections found (data import not run yet)`)
    } else {
      console.log(`   ✅ Found ${collectionCount} collections`)

      // Check for imported collections
      const { count: importedCount } = await supabase
        .from('collections')
        .select('*', { count: 'exact', head: true })
        .eq('notes', 'Imported from Google Sheets')

      results.dataImported = importedCount > 0
      console.log(`   📥 Imported from Google Sheets: ${importedCount}`)
    }
  }

  // Check 5: User profiles
  console.log('\n5️⃣  CHECKING USER PROFILES...')
  const { count: profileCount, error: profError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  if (profError) {
    console.log(`   ❌ Cannot access profiles: ${profError.message}`)
  } else {
    results.profiles.count = profileCount
    results.profiles.exists = true

    if (profileCount === 0) {
      console.log(`   ⚠️  No user profiles (no one has signed up yet)`)
    } else {
      console.log(`   ✅ Found ${profileCount} user profiles`)

      const { data: admins } = await supabase
        .from('profiles')
        .select('email')
        .eq('role', 'admin')

      if (admins && admins.length > 0) {
        console.log(`   👑 Admin users: ${admins.length}`)
      } else {
        console.log(`   ⚠️  No admin users yet`)
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📋 SUMMARY')
  console.log('='.repeat(60))

  console.log('\n✅ COMPLETED:')
  if (results.migrations.run) console.log('   ✅ Database migrations')
  if (results.categories.exists && results.categories.count === 5) console.log('   ✅ Categories seeded (5/5)')
  if (results.items.exists && results.items.count > 0) console.log(`   ✅ Items catalog (${results.items.count} items)`)
  if (results.collections.exists && results.collections.count > 0) console.log(`   ✅ Collections tracked (${results.collections.count} total)`)
  if (results.dataImported) console.log('   ✅ Google Sheets data imported')
  if (results.profiles.exists && results.profiles.count > 0) console.log(`   ✅ User profiles (${results.profiles.count} users)`)

  console.log('\n⚠️  PENDING:')
  if (!results.migrations.run) console.log('   ⚠️  Run database migrations')
  if (results.categories.count === 0) console.log('   ⚠️  Seed categories (run migration 003)')
  if (results.items.count === 0) console.log('   ⚠️  Seed items (run migration 003)')
  if (!results.dataImported) console.log('   ⚠️  Import Google Sheets data (npm run import-data)')
  if (results.profiles.count === 0) console.log('   ⚠️  Create first user account (sign up at /login)')

  console.log('\n' + '='.repeat(60))
  console.log('💡 NEXT STEPS:')
  console.log('='.repeat(60))

  if (!results.migrations.run) {
    console.log('\n1. Run database migrations:')
    console.log('   - Go to: https://supabase.com/dashboard/project/karwhqspyarzebiwpnrh/sql/new')
    console.log('   - Copy & run: supabase/migrations/001_initial_schema.sql')
    console.log('   - Copy & run: supabase/migrations/002_rls_policies.sql')
    console.log('   - Copy & run: supabase/migrations/003_seed_data.sql')
    console.log('   - Copy & run: supabase/migrations/004_fix_profile_creation.sql')
  } else if (!results.dataImported && results.items.count > 0) {
    console.log('\n1. Import historical Google Sheets data:')
    console.log('   npm run import-data')
  } else if (results.dataImported) {
    console.log('\n1. Start the development server:')
    console.log('   npm run dev')
    console.log('\n2. Create your admin account:')
    console.log('   - Go to http://localhost:3000/login')
    console.log('   - Sign up with your email')
    console.log('   - In Supabase, set your role to "admin"')
  }

  console.log('\n📊 Re-run this check anytime: npm run check-db\n')
}

// Run the check
checkDatabaseStatus().catch(error => {
  console.error('\n❌ Error checking database:', error.message)
  process.exit(1)
})
