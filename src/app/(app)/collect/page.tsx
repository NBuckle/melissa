/**
 * Collect Items Page
 *
 * Form for submitting new item collections.
 */

import { getActiveItems } from '@/app/actions/items'
import { CollectionForm } from '@/components/features/collections/collection-form'

export default async function CollectPage() {
  const { items, error } = await getActiveItems()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Collect Items</h1>
        <p className="text-gray-600 mt-2">
          Submit new donation collections
        </p>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">Error loading items: {error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">
            No active items available. Please contact an administrator to add items.
          </p>
        </div>
      ) : (
        <CollectionForm items={items as any} />
      )}
    </div>
  )
}
