/**
 * Reports Page (Admin Only)
 *
 * Generate and export reports.
 * (Placeholder - will be implemented in Phase 6)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-2">
          Generate custom reports and export data
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon - Phase 6</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Reporting features will be implemented in Phase 6. Features include:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
            <li>Export inventory to CSV/PDF</li>
            <li>Custom date range reports</li>
            <li>Distribution reports by church/location</li>
            <li>Kit creation reports</li>
            <li>Collection trends and analytics</li>
            <li>Low stock reports</li>
            <li>User activity reports</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
