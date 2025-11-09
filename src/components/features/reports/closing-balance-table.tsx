/**
 * Closing Balance Table Component
 *
 * Displays daily closing balance data in table format.
 * Supports sorting, grouping, and highlighting.
 */

'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import type { DailyClosingBalance } from '@/app/actions/reports'

interface ClosingBalanceTableProps {
  data: DailyClosingBalance[]
}

type SortField = 'date' | 'item_name' | 'category_name' | 'closing_balance'
type SortDirection = 'asc' | 'desc'

export function ClosingBalanceTable({ data }: ClosingBalanceTableProps) {
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Group data by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, DailyClosingBalance[]> = {}

    data.forEach((row) => {
      if (!groups[row.date]) {
        groups[row.date] = []
      }
      groups[row.date].push(row)
    })

    return groups
  }, [data])

  // Sort the data
  const sortedData = useMemo(() => {
    const sorted = [...data]

    sorted.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      // Handle date sorting
      if (sortField === 'date') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      // Handle numeric sorting
      if (sortField === 'closing_balance') {
        aValue = Number(aValue)
        bValue = Number(bValue)
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [data, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const toggleRowExpansion = (rowId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId)
    } else {
      newExpanded.add(rowId)
    }
    setExpandedRows(newExpanded)
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      )
    }

    return sortDirection === 'asc' ? (
      <svg
        className="w-4 h-4 text-blue-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    ) : (
      <svg
        className="w-4 h-4 text-blue-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available for the selected date range</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('date')}
            >
              <div className="flex items-center gap-1">
                Date
                <SortIcon field="date" />
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('item_name')}
            >
              <div className="flex items-center gap-1">
                Item Name
                <SortIcon field="item_name" />
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('category_name')}
            >
              <div className="flex items-center gap-1">
                Category
                <SortIcon field="category_name" />
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Opening
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Collected
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Withdrawn
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('closing_balance')}
            >
              <div className="flex items-center justify-end gap-1">
                Closing Balance
                <SortIcon field="closing_balance" />
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((row, index) => {
            const rowId = `${row.date}-${row.item_id}`
            const isExpanded = expandedRows.has(rowId)
            const closingBalance = Number(row.closing_balance)
            const isNegative = closingBalance < 0
            const isLowStock = closingBalance > 0 && closingBalance < 10 // Arbitrary low threshold

            return (
              <tr
                key={rowId}
                className={`hover:bg-gray-50 ${
                  isNegative ? 'bg-red-50' : isLowStock ? 'bg-yellow-50' : ''
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(row.date), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {row.item_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {row.category_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                  {Number(row.opening_balance).toFixed(0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                  +{Number(row.daily_collected).toFixed(0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                  -{Number(row.daily_withdrawn).toFixed(0)}
                </td>
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                    isNegative
                      ? 'text-red-700'
                      : isLowStock
                      ? 'text-yellow-700'
                      : 'text-gray-900'
                  }`}
                >
                  {closingBalance.toFixed(0)}
                  {isNegative && (
                    <span className="ml-2 text-xs">(Negative!)</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Summary Stats */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Total Records</p>
            <p className="text-xl font-bold text-gray-900">{data.length}</p>
          </div>
          <div>
            <p className="text-gray-600">Total Collected</p>
            <p className="text-xl font-bold text-green-700">
              {data
                .reduce((sum, row) => sum + Number(row.daily_collected), 0)
                .toFixed(0)}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Total Withdrawn</p>
            <p className="text-xl font-bold text-red-700">
              {data
                .reduce((sum, row) => sum + Number(row.daily_withdrawn), 0)
                .toFixed(0)}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Unique Dates</p>
            <p className="text-xl font-bold text-gray-900">
              {Object.keys(groupedByDate).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
