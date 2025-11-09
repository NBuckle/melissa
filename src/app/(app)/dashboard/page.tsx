/**
 * Dashboard Page
 *
 * Overview of inventory stats and recent activity.
 */

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getInventoryStats, getLowStockItems } from '@/app/actions/inventory'
import { getRecentCollections } from '@/app/actions/collections'
import { format } from 'date-fns'

export default async function DashboardPage() {
  const [stats, lowStockResult, collectionsResult] = await Promise.all([
    getInventoryStats(),
    getLowStockItems(),
    getRecentCollections(5),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome to the Melissa Inventory Management System
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Active Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{stats.totalItems}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Today&apos;s Collections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">
              {stats.todayCollections}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">
              {stats.lowStockCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Items Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {stats.totalCollected.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStockResult.items && lowStockResult.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <svg
                className="w-5 h-5 text-yellow-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockResult.items.slice(0, 5).map((item: any) => (
                <div
                  key={item.item_id}
                  className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{item.item_name}</p>
                    <p className="text-sm text-gray-600">
                      {item.category_name} • {item.unit_type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-yellow-700">
                      {item.current_stock}
                    </p>
                    <p className="text-xs text-gray-600">
                      Alert at {item.low_stock_threshold}
                    </p>
                  </div>
                </div>
              ))}
              {lowStockResult.items.length > 5 && (
                <Link
                  href="/inventory/total"
                  className="block text-center text-sm text-blue-600 hover:text-blue-700"
                >
                  View all low stock items →
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Collections */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Collections</CardTitle>
        </CardHeader>
        <CardContent>
          {collectionsResult.collections && collectionsResult.collections.length > 0 ? (
            <div className="space-y-4">
              {collectionsResult.collections.map((collection: any) => (
                <div
                  key={collection.id}
                  className="border-l-4 border-blue-500 pl-4 py-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        {format(
                          new Date(collection.submission_timestamp),
                          'MMM d, yyyy h:mm a'
                        )}
                      </p>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {collection.profile?.full_name || collection.profile?.email}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {collection.collection_items?.slice(0, 3).map((ci: any, idx: number) => (
                          <Badge key={idx} variant="info">
                            {ci.item?.name}: {ci.quantity} {ci.item?.unit_type}
                          </Badge>
                        ))}
                        {collection.collection_items?.length > 3 && (
                          <Badge variant="default">
                            +{collection.collection_items.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No collections yet. Start by submitting your first collection!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/collect"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900">Submit Collection</h3>
              <p className="text-sm text-gray-600 mt-1">
                Log new donated items
              </p>
            </Link>
            <Link
              href="/inventory/total"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900">View Inventory</h3>
              <p className="text-sm text-gray-600 mt-1">
                Check current stock levels
              </p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
