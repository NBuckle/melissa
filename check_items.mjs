import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const { data: items, error } = await supabase
  .from('items')
  .select('id, name, unit_type')
  .order('name')

if (error) {
  console.error('Error:', error.message)
} else {
  console.log(`\n📋 Items in database (${items.length} total):\n`)
  items.forEach(item => {
    console.log(`  - ${item.name} (${item.unit_type})`)
  })
}
