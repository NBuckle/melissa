/**
 * Inventory Snapshot Page
 * Shows complete inventory state for a specific date
 *
 * Features:
 * - View inventory snapshot for any historical date
 * - See opening balance, collections, withdrawals, closing balance
 * - Navigate between dates easily
 * - Export to CSV
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { getInventorySnapshot, getEarliestDataDate } from '@/app/actions/inventory'
import type { SnapshotItem, SnapshotSummary } from '@/app/actions/inventory'
import { toast } from 'react-hot-toast'

export default function InventorySnapshotPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Get date from URL or default to today
  const [selectedDate, setSelectedDate] = useState(() => {
    return searchParams.get('date') || new Date().toISOString().split('T')[0]
  })

  const [data, setData] = useState<SnapshotItem[]>([])
  const [summary, setSummary] = useState<SnapshotSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [earliestDate, setEarliestDate] = useState('2025-11-01')

  // Load earliest date on mount
  useEffect(() => {
    loadEarliestDate()
  }, [])

  // Load snapshot when date changes
  useEffect(() => {
    loadSnapshot()
  }, [selectedDate])

  const loadEarliestDate = async () => {
    const { date } = await getEarliestDataDate()
    if (date) {
      setEarliestDate(date)
    }
  }

  const loadSnapshot = async () => {
    setLoading(true)
    const { data: snapshotData, summary: snapshotSummary, error } = await getInventorySnapshot(selectedDate)

    if (error) {
      toast.error(error)
      setData([])
      setSummary(null)
    } else {
      setData(snapshotData)
      setSummary(snapshotSummary)
    }

    setLoading(false)
  }

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate)
    router.push(`/reports/snapshot?date=${newDate}`)
  }

  const goToPrevDay = () => {
    const prev = new Date(selectedDate)
    prev.setDate(prev.getDate() - 1)
    const prevDateStr = prev.toISOString().split('T')[0]

    // Don't go before earliest date
    if (new Date(prevDateStr) >= new Date(earliestDate)) {
      handleDateChange(prevDateStr)
    } else {
      toast.error(`No data available before ${format(new Date(earliestDate), 'MMMM d, yyyy')}`)
    }
  }

  const goToNextDay = () => {
    const next = new Date(selectedDate)
    next.setDate(next.getDate() + 1)
    const nextDateStr = next.toISOString().split('T')[0]
    const today = new Date().toISOString().split('T')[0]

    // Don't go into the future
    if (new Date(nextDateStr) <= new Date(today)) {
      handleDateChange(nextDateStr)
    } else {
      toast.error('Cannot view future dates')
    }
  }

  const goToToday = () => {
    handleDateChange(new Date().toISOString().split('T')[0])
  }

  const goToYesterday = () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    handleDateChange(yesterday.toISOString().split('T')[0])
  }

  // Group data by category
  const groupedData = data.reduce((acc, item) => {
    const category = item.category_name || 'Uncategorized'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {} as Record<string, SnapshotItem[]>)

  // Sort categories
  const categoryOrder = ['Pantry', 'Bathroom', 'Baby', 'First Aid', 'Other', 'Uncategorized']
  const sortedCategories = categoryOrder.filter(cat => groupedData[cat])
  // Add any categories not in the predefined order
  Object.keys(groupedData).forEach(cat => {
    if (!categoryOrder.includes(cat)) {
      sortedCategories.push(cat)
    }
  })

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Reports', href: '/reports' },
          { label: 'Inventory Snapshot' },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory Snapshot</h1>
        <p className="text-gray-600 mt-2">
          Complete inventory view for {format(new Date(selectedDate), 'MMMM d, yyyy')}
        </p>
      </div>

      {/* Date Navigator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Date Picker and Navigation */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <Button
                onClick={goToPrevDay}
                variant="outline"
                disabled={loading || new Date(selectedDate) <= new Date(earliestDate)}
              >
                ← Previous Day
              </Button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                min={earliestDate}
                max={new Date().toISOString().split('T')[0]}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                onClick={goToNextDay}
                variant="outline"
                disabled={loading || new Date(selectedDate) >= new Date()}
              >
                Next Day →
              </Button>
            </div>

            {/* Quick Date Links */}
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={goToYesterday}>
                Yesterday
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Summary for {format(new Date(selectedDate), 'MMMM d, yyyy')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-3xl font-bold text-gray-900">{summary.totalItems}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Collected</p>
                <p className="text-3xl font-bold text-green-700">+{summary.totalCollected.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Withdrawn</p>
                <p className="text-3xl font-bold text-red-700">-{summary.totalWithdrawn.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Net Change</p>
                <p className={`text-3xl font-bold ${summary.netChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {summary.netChange >= 0 ? '+' : ''}{summary.netChange.toLocaleString()}
                </p>
              </div>
            </div>
            {summary.itemsWithActivity === 0 && (
              <p className="mt-4 text-sm text-gray-500">
                No collections or withdrawals recorded for this date.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading snapshot data...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data by Category */}
      {!loading && sortedCategories.map((categoryName) => {
        const categoryItems = groupedData[categoryName]
        const categoryCollected = categoryItems.reduce((sum, item) => sum + item.daily_collected, 0)
        const categoryWithdrawn = categoryItems.reduce((sum, item) => sum + item.daily_withdrawn, 0)

        return (
          <Card key={categoryName}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{categoryName}</span>
                <div className="flex gap-4 text-sm font-normal">
                  <span className="text-gray-600">{categoryItems.length} items</span>
                  {categoryCollected > 0 && (
                    <span className="text-green-700">+{categoryCollected}</span>
                  )}
                  {categoryWithdrawn > 0 && (
                    <span className="text-red-700">-{categoryWithdrawn}</span>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item Name
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Opening
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Collected
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Withdrawn
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Closing
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categoryItems.map((item) => {
                      const hasActivity = item.daily_collected > 0 || item.daily_withdrawn > 0
                      return (
                        <tr
                          key={item.item_id}
                          className={hasActivity ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {item.item_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                            {item.opening_balance.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            {item.daily_collected > 0 ? (
                              <span className="font-semibold text-green-700">
                                +{item.daily_collected.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            {item.daily_withdrawn > 0 ? (
                              <span className="font-semibold text-red-700">
                                -{item.daily_withdrawn.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            <span className={`font-semibold ${
                              item.closing_balance < 0 ? 'text-red-700' :
                              item.closing_balance < 10 ? 'text-yellow-700' :
                              'text-gray-900'
                            }`}>
                              {item.closing_balance.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Help Text */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6">
          <h3 className="font-medium text-gray-900 mb-2">
            Understanding the Snapshot
          </h3>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>
              <strong>Opening Balance:</strong> Stock level at the start of the day
            </li>
            <li>
              <strong>Collected:</strong> Items added through collections on this date
            </li>
            <li>
              <strong>Withdrawn:</strong> Items removed through withdrawals on this date
            </li>
            <li>
              <strong>Closing Balance:</strong> Opening + Collected - Withdrawn = stock at end of day
            </li>
            <li className="text-blue-700">
              <strong>Blue highlighting:</strong> Items with activity (collections or withdrawals) on this date
            </li>
            <li className="text-red-700">
              <strong>Red numbers:</strong> Negative stock levels
            </li>
            <li className="text-yellow-700">
              <strong>Yellow numbers:</strong> Low stock levels (below 10)
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
