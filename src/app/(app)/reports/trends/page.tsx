/**
 * Inventory Trends Report Page
 *
 * Visualize stock levels over time with interactive charts.
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DateRangeSelector, type DateRange } from '@/components/features/reports/date-range-selector'
import { ItemSelector } from '@/components/features/reports/item-selector'
import { InventoryTrendChart } from '@/components/features/reports/inventory-trend-chart'
import { getInventoryTrends, getActiveItemsForReports } from '@/app/actions/reports'
import { exportInventoryTrendsToCSV } from '@/lib/utils/csv-export'
import { toast } from 'react-hot-toast'
import type { InventoryTrend } from '@/app/actions/reports'

export default function InventoryTrendsPage() {
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
  const [data, setData] = useState<InventoryTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [items, setItems] = useState<any[]>([])

  // Load items for selection
  useEffect(() => {
    loadItems()
  }, [])

  // Load data when filters change
  useEffect(() => {
    loadData()
  }, [dateRange, selectedItemIds])

  const loadItems = async () => {
    const { items: itemsData } = await getActiveItemsForReports()
    setItems(itemsData)

    // Auto-select first 5 items by default
    if (itemsData.length > 0) {
      const defaultSelection = itemsData.slice(0, 5).map((item: any) => item.id)
      setSelectedItemIds(defaultSelection)
    }
  }

  const loadData = async () => {
    setLoading(true)
    const { data: reportData, error } = await getInventoryTrends(
      dateRange.startDate,
      dateRange.endDate,
      selectedItemIds.length > 0 ? selectedItemIds : undefined
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
      exportInventoryTrendsToCSV(data, dateRange.startDate, dateRange.endDate)
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
            Inventory Trends
          </h1>
          <p className="text-gray-600 mt-2">
            Visualize stock levels over time and identify trends
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
        <CardContent className="space-y-6">
          {/* Date Range Selector */}
          <DateRangeSelector
            value={dateRange}
            onChange={setDateRange}
            showApplyButton={false}
          />

          {/* Item Selector */}
          <ItemSelector
            items={items}
            selectedItemIds={selectedItemIds}
            onChange={setSelectedItemIds}
            maxSelections={10}
          />

          {selectedItemIds.length === 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                Select at least one item to view trends
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Level Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading trend data...</p>
            </div>
          ) : selectedItemIds.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg
                className="w-12 h-12 text-gray-400 mx-auto mb-4"
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
              <p className="text-gray-500">
                Select items above to view their inventory trends
              </p>
            </div>
          ) : (
            <InventoryTrendChart data={data} selectedItemIds={selectedItemIds} />
          )}
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6">
          <h3 className="font-medium text-gray-900 mb-2">
            Understanding the Chart
          </h3>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>
              Each line represents the stock level of an item over time
            </li>
            <li>
              Hover over data points to see exact stock levels
            </li>
            <li>
              Select up to 10 items to compare trends
            </li>
            <li>
              Upward trends indicate more collections than withdrawals
            </li>
            <li>
              Downward trends indicate more withdrawals than collections
            </li>
            <li>
              Export to CSV to analyze data in Excel or Google Sheets
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
