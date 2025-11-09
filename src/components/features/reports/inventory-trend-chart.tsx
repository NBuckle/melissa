/**
 * Inventory Trend Chart Component
 *
 * Line chart showing inventory trends over time using Recharts.
 */

'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'
import type { InventoryTrend } from '@/app/actions/reports'

interface InventoryTrendChartProps {
  data: InventoryTrend[]
  selectedItemIds: string[]
}

export function InventoryTrendChart({
  data,
  selectedItemIds,
}: InventoryTrendChartProps) {
  // Colors for different items
  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#6366f1', // indigo
  ]

  // Transform data for Recharts
  const chartData = useMemo(() => {
    // Group by date
    const dateMap: Record<string, any> = {}

    data.forEach((row) => {
      if (!dateMap[row.date]) {
        dateMap[row.date] = {
          date: row.date,
        }
      }

      // Add stock level for this item
      dateMap[row.date][row.item_id] = Number(row.stock_level)
    })

    // Convert to array and sort by date
    return Object.values(dateMap).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [data])

  // Get unique items in the data
  const items = useMemo(() => {
    const itemMap: Record<string, { id: string; name: string }> = {}

    data.forEach((row) => {
      if (!itemMap[row.item_id]) {
        itemMap[row.item_id] = {
          id: row.item_id,
          name: row.item_name,
        }
      }
    })

    // Filter to only selected items (if any selected)
    const allItems = Object.values(itemMap)
    if (selectedItemIds.length > 0) {
      return allItems.filter((item) => selectedItemIds.includes(item.id))
    }

    return allItems
  }, [data, selectedItemIds])

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">
            {format(new Date(label), 'MMM d, yyyy')}
          </p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-700">{entry.name}:</span>
                <span className="font-medium text-gray-900">
                  {entry.value.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }

    return null
  }

  if (chartData.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500">
          No trend data available for the selected date range
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => format(new Date(value), 'MMM d')}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{
              value: 'Stock Level',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: '12px', fill: '#6b7280' },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            iconType="line"
          />
          {items.map((item, index) => (
            <Line
              key={item.id}
              type="monotone"
              dataKey={item.id}
              name={item.name}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Legend Info */}
      <div className="mt-4 text-sm text-gray-600">
        <p>
          Showing trends for <span className="font-medium">{items.length}</span>{' '}
          item{items.length !== 1 ? 's' : ''} across{' '}
          <span className="font-medium">{chartData.length}</span> day
          {chartData.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}
