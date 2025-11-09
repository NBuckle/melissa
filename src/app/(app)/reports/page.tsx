/**
 * Reports Landing Page
 *
 * Overview of available reports and analytics.
 */

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getReportsSummary } from '@/app/actions/reports'
import { format } from 'date-fns'

export default async function ReportsPage() {
  const { summary } = await getReportsSummary()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-2">
          View inventory trends, closing balances, and detailed analytics
        </p>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {summary.totalItems}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Current Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {summary.totalStock.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Collected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-700">
                {summary.totalCollected.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Withdrawn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">
                {summary.totalWithdrawn.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Available Reports */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Available Reports
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily Closing Balance */}
          <Link href="/reports/closing-balance">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Daily Closing Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  View opening balance, daily collections, withdrawals, and
                  closing balance for each item by date.
                </p>
                <div className="mt-4">
                  <span className="text-sm text-blue-600 font-medium">
                    View Report →
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Inventory Trends */}
          <Link href="/reports/trends">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                    />
                  </svg>
                  Inventory Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Visualize stock levels over time with interactive charts.
                  Compare multiple items and identify trends.
                </p>
                <div className="mt-4">
                  <span className="text-sm text-green-600 font-medium">
                    View Report →
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Data Range Info */}
      {summary?.firstCollectionDate && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Data Available Since
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Historical data is available from{' '}
                  <span className="font-medium">
                    {format(new Date(summary.firstCollectionDate), 'MMMM d, yyyy')}
                  </span>
                  . You can generate reports for any date range within this
                  period.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
