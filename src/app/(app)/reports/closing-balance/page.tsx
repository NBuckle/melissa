/**
 * Daily Closing Balance Report Page
 *
 * Shows opening balance, collections, withdrawals, and closing balance
 * for each item across a date range.
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DateRangeSelector, type DateRange } from '@/components/features/reports/date-range-selector'
import { ClosingBalanceTable } from '@/components/features/reports/closing-balance-table'
import { getDailyClosingBalance, getActiveItemsForReports } from '@/app/actions/reports'
import { exportClosingBalanceToCSV } from '@/lib/utils/csv-export'
import { toast } from 'react-hot-toast'
import type { DailyClosingBalance } from '@/app/actions/reports'

export default function ClosingBalanceReportPage() {
  // Calculate default date range (last 30 days)
  const getDefaultDateRange = (): DateRange => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)

    return {
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    }
  }

  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange())
  const [data, setData] = useState<DailyClosingBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItemId, setSelectedItemId] = useState<string>('')
  const [items, setItems] = useState<any[]>([])

  // Load items for filter
  useEffect(() => {
    loadItems()
  }, [])

  // Load data when date range changes
  useEffect(() => {
    loadData()
  }, [dateRange, selectedItemId])

  const loadItems = async () => {
    const { items: itemsData } = await getActiveItemsForReports()
    setItems(itemsData)
  }

  const loadData = async () => {
    setLoading(true)
    const { data: reportData, error } = await getDailyClosingBalance(
      dateRange.startDate,
      dateRange.endDate,
      selectedItemId || undefined
    )

    if (error) {
      toast.error(error)
      setData([])
    } else {
      setData(reportData)
    }

    setLoading(false)
  }

  const handleExportCSV = () => {
    if (data.length === 0) {
      toast.error('No data to export')
      return
    }

    try {
      exportClosingBalanceToCSV(data, dateRange.startDate, dateRange.endDate)
      toast.success('Report exported to CSV')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export CSV')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Daily Closing Balance
          </h1>
          <p className="text-gray-600 mt-2">
            View opening balance, daily changes, and closing balance for each item
          </p>
        </div>
        <Button
          onClick={handleExportCSV}
          disabled={loading || data.length === 0}
          variant="outline"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Range Selector */}
          <DateRangeSelector
            value={dateRange}
            onChange={setDateRange}
            showApplyButton={false}
          />

          {/* Item Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Item (Optional)
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Items</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.item_categories && ` (${item.item_categories.name})`}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Closing Balance Data</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading report data...</p>
            </div>
          ) : (
            <ClosingBalanceTable data={data} />
          )}
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6">
          <h3 className="font-medium text-gray-900 mb-2">
            Understanding the Report
          </h3>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>
              <strong>Opening Balance:</strong> Stock level at the start of the day
            </li>
            <li>
              <strong>Daily Collected:</strong> Items added through collections
            </li>
            <li>
              <strong>Daily Withdrawn:</strong> Items removed through withdrawals
            </li>
            <li>
              <strong>Closing Balance:</strong> Opening + Collected - Withdrawn
            </li>
            <li className="text-red-600">
              <strong>Red highlighting:</strong> Indicates negative stock (more
              withdrawn than available)
            </li>
            <li className="text-yellow-600">
              <strong>Yellow highlighting:</strong> Indicates low stock levels
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
