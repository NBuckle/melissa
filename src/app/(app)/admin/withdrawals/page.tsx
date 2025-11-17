/**
 * Withdrawals Page
 *
 * Admin page for recording actual inventory withdrawals.
 * These withdrawals subtract from inventory stock.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveItems } from '@/app/actions/items'
import { getRecentWithdrawals } from '@/app/actions/actual-withdrawals'
import { WithdrawalForm } from '@/components/features/withdrawals/withdrawal-form'
import { WithdrawalsList } from '@/components/features/withdrawals/withdrawals-list'

export const metadata = {
  title: 'Record Withdrawal | Melissa Inventory',
  description: 'Record inventory withdrawals',
}

export default async function WithdrawalsPage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((profile as any)?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Get active items (excluding CBAJ-only items)
  const { items } = await getActiveItems()

  // Get recent withdrawals
  const { withdrawals } = await getRecentWithdrawals(10)

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Record Withdrawal</h1>
        <p className="mt-2 text-gray-600">
          Record items withdrawn from your inventory for giveaways, distributions, or other purposes.
          These withdrawals will reduce your inventory stock and appear in daily reports.
        </p>
      </div>

      <div className="space-y-8">
        {/* Withdrawal Form */}
        <WithdrawalForm items={items} />

        {/* Recent Withdrawals */}
        <WithdrawalsList withdrawals={withdrawals} />
      </div>
    </div>
  )
}
