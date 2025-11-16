/**
 * Total Inventory Page
 *
 * Shows master inventory with totals and expandable withdrawal breakdowns.
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getMasterInventoryWithBreakdowns, getWithdrawalBreakdowns } from '@/app/actions/inventory'

export default function TotalInventoryPage() {
  const [inventory, setInventory] = useState<any[]>([])
  const [breakdowns, setBreakdowns] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [inventoryRes, breakdownsRes] = await Promise.all([
      getMasterInventoryWithBreakdowns(),
      getWithdrawalBreakdowns()
    ])

    if (inventoryRes.error) {
      setError(inventoryRes.error)
    } else {
      setInventory(inventoryRes.inventory)
    }

    if (!breakdownsRes.error) {
      setBreakdowns(breakdownsRes.breakdowns)
    }

    setLoading(false)
  }

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName)
    } else {
      newExpanded.add(categoryName)
    }
    setExpandedCategories(newExpanded)
  }

  // Group inventory by category
  const inventoryByCategory = inventory.reduce((acc: any, item: any) => {
    const category = item.category_name
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {})

  const categoryOrder = ['Baby', 'Bathroom', 'First Aid', 'Pantry', 'Other']
  const sortedCategories = categoryOrder.filter(cat => inventoryByCategory[cat])

  const isLowStock = (item: any) => item.current_stock <= item.low_stock_threshold

  // Get breakdowns for a specific item
  const getItemBreakdowns = (itemId: string) => {
    return breakdowns.filter((b: any) => b.item_id === itemId)
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Total Inventory</h1>
          <p className="text-gray-600 mt-2">
            Master inventory with current stock levels
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total Items</p>
          <p className="text-2xl font-bold text-gray-900">{inventory.length}</p>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">Error loading inventory: {error}</p>
        </div>
      ) : inventory.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">
              No inventory data available. Start by submitting collections!
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {sortedCategories.map((categoryName) => {
            const isExpanded = expandedCategories.has(categoryName)
            const categoryItems = inventoryByCategory[categoryName]

            return (
              <Card key={categoryName}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      <span>{categoryName}</span>
                      <Badge variant="default">
                        {categoryItems.length} items
                      </Badge>
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleCategory(categoryName)}
                    >
                      {isExpanded ? '▲ Hide' : '▼ View'} Withdrawals
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Collected
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Withdrawn
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Current Stock
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {categoryItems.map((item: any) => (
                          <tr
                            key={item.item_id}
                            className={isLowStock(item) ? 'bg-yellow-50' : 'hover:bg-gray-50'}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {item.item_name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.unit_type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {item.total_collected.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {item.total_withdrawn.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              <span className={`font-semibold ${
                                isLowStock(item) ? 'text-yellow-700' : 'text-green-700'
                              }`}>
                                {item.current_stock.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {isLowStock(item) ? (
                                <Badge variant="warning">
                                  Low Stock
                                </Badge>
                              ) : (
                                <Badge variant="success">
                                  In Stock
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Expandable Withdrawal Breakdowns */}
                  {isExpanded && (
                    <div className="mt-6 bg-gray-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Withdrawal Breakdown - {categoryName}
                      </h4>
                      <div className="space-y-4">
                        {categoryItems.map((item: any) => {
                          const itemBreakdowns = getItemBreakdowns(item.item_id)
                          if (itemBreakdowns.length === 0) return null

                          return (
                            <div key={item.item_id} className="bg-white rounded-md p-4 shadow-sm">
                              <h5 className="font-medium text-gray-900 mb-2">{item.item_name}</h5>
                              <ul className="space-y-1 text-sm">
                                {itemBreakdowns.map((breakdown: any) => (
                                  <li key={breakdown.id} className="flex justify-between text-gray-700">
                                    <span>• {breakdown.giveaway_name}</span>
                                    <span className="font-semibold">{breakdown.quantity.toLocaleString()}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </>
      )}
    </div>
  )
}
