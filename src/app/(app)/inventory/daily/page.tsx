/**
 * Daily Inventory Page
 *
 * Shows daily collection breakdown.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getDailyInventory } from '@/app/actions/inventory'
import { format } from 'date-fns'

export default async function DailyInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const params = await searchParams
  const selectedDate = params.date || new Date().toISOString().split('T')[0]
  const { inventory, error } = await getDailyInventory(selectedDate)

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

  const totalCollected = inventory.reduce((sum: number, item: any) => sum + (item.daily_collected || 0), 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Daily Inventory</h1>
        <p className="text-gray-600 mt-2">
          Daily breakdown of collections for {format(new Date(selectedDate), 'MMMM d, yyyy')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Date Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/inventory/daily" method="GET" className="flex items-center space-x-4">
            <input
              type="date"
              name="date"
              defaultValue={selectedDate}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              View Date
            </button>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">Error loading inventory: {error}</p>
        </div>
      ) : inventory.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">
              No collections recorded for this date.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Daily Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Total Items Collected</p>
                  <p className="text-3xl font-bold text-gray-900">{totalCollected.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Unique Items</p>
                  <p className="text-3xl font-bold text-gray-900">{inventory.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Categories</p>
                  <p className="text-3xl font-bold text-gray-900">{sortedCategories.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {sortedCategories.map((categoryName) => (
            <Card key={categoryName}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{categoryName}</span>
                  <Badge variant="default">
                    {inventoryByCategory[categoryName].length} items
                  </Badge>
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity Collected
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {inventoryByCategory[categoryName].map((item: any) => (
                        <tr key={item.item_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {item.item_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.unit_type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            <span className="font-semibold text-green-700">
                              {item.daily_collected.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  )
}
