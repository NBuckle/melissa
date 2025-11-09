/**
 * Withdrawals Management Page
 *
 * Admin-only page for creating and viewing withdrawals/distributions.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WithdrawalForm } from '@/components/features/withdrawals/withdrawal-form'
import { WithdrawalsList } from '@/components/features/withdrawals/withdrawals-list'
import {
  getDistributionTypes,
  getKitTemplates,
  getRecentWithdrawals,
} from '@/app/actions/withdrawals'
import { getActiveItems } from '@/app/actions/items'

export default async function WithdrawalsPage() {
  // Fetch all required data
  const { types: distributionTypes } = await getDistributionTypes()
  const { templates: kitTemplates } = await getKitTemplates()
  const { items } = await getActiveItems()
  const { withdrawals } = await getRecentWithdrawals(20)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Withdrawals & Distributions
        </h1>
        <p className="text-gray-600 mt-2">
          Record distributions, kit creation, and inventory withdrawals
        </p>
      </div>

      {/* Create New Withdrawal Form */}
      <WithdrawalForm
        distributionTypes={distributionTypes}
        kitTemplates={kitTemplates}
        items={items}
      />

      {/* Recent Withdrawals List */}
      <WithdrawalsList withdrawals={withdrawals} />
    </div>
  )
}
