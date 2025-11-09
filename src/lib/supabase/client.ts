/**
 * Supabase Client for Browser/Client Components
 *
 * Use this in Client Components that run in the browser.
 * This client uses the anon key and respects RLS policies.
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
