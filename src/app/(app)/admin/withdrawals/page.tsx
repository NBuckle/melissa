/**
 * Withdrawals Page (Admin Only)
 *
 * Manage distributions and withdrawals.
 * (Placeholder - will be implemented in Phase 4)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function WithdrawalsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Withdrawals & Distributions</h1>
        <p className="text-gray-600 mt-2">
          Manage item distributions and withdrawals
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon - Phase 4</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Withdrawal management will be implemented in Phase 4. Features include:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
            <li>Create new withdrawals (manual or kit-based)</li>
            <li>Church/location deliveries tracking</li>
            <li>Package kit creation</li>
            <li>Expired goods removal logs</li>
            <li>Stock corrections</li>
            <li>Withdrawal history</li>
            <li>Distribution reports</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
