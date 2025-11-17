import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const { data } = await supabase
  .from('actual_withdrawals')
  .select('withdrawal_date, reason')
  .order('withdrawal_date')

console.log('\nCurrent withdrawal dates in database:')
data.forEach(w => console.log(`  ${w.withdrawal_date} - ${w.reason}`))
console.log()
