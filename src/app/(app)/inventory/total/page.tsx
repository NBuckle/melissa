/**
 * Total Inventory Page
 *
 * Shows master inventory with totals.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getMasterInventory } from '@/app/actions/inventory'

export default async function TotalInventoryPage() {
  const { inventory, error } = await getMasterInventory()

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
                      {inventoryByCategory[categoryName].map((item: any) => (
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
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  )
}
