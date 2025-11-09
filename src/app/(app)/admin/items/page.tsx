/**
 * Items Management Page (Admin Only)
 *
 * Manage item catalog - view, add, edit, activate/deactivate items.
 */

import { getItems, getCategories } from '@/app/actions/items'
import { ItemsManagementClient } from '@/components/features/items/items-management-client'

export default async function ItemsManagementPage() {
  const [itemsResult, categoriesResult] = await Promise.all([
    getItems(),
    getCategories(),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Items Management</h1>
        <p className="text-gray-600 mt-2">
          Manage your item catalog
        </p>
      </div>

      {itemsResult.error || categoriesResult.error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">
            Error loading data: {itemsResult.error || categoriesResult.error}
          </p>
        </div>
      ) : (
        <ItemsManagementClient
          items={itemsResult.items}
          categories={categoriesResult.categories}
        />
      )}
    </div>
  )
}
