/**
 * Items Table Component
 */

'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toggleItemStatus } from '@/app/actions/items'
import { toast } from 'react-hot-toast'

interface Category {
  id: string
  name: string
  display_order: number
}

interface Item {
  id: string
  name: string
  description: string | null
  category_id: string
  unit_type: string
  is_active: boolean
  low_stock_threshold: number
  created_at: string
  category: Category
}

interface ItemsTableProps {
  items: Item[]
  onEdit: (item: Item) => void
}

export function ItemsTable({ items, onEdit }: ItemsTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleToggleStatus = async (item: Item) => {
    setLoadingId(item.id)
    const result = await toggleItemStatus(item.id, !item.is_active)

    if (result.success) {
      toast.success(
        `Item ${!item.is_active ? 'activated' : 'deactivated'} successfully`
      )
    } else {
      toast.error(result.error || 'Failed to update item status')
    }
    setLoadingId(null)
  }

  const getCategoryColor = (categoryName: string) => {
    const colors: Record<string, string> = {
      Baby: 'bg-pink-100 text-pink-800',
      Bathroom: 'bg-blue-100 text-blue-800',
      'First Aid': 'bg-red-100 text-red-800',
      Pantry: 'bg-green-100 text-green-800',
      Other: 'bg-gray-100 text-gray-800',
    }
    return colors[categoryName] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Item Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Unit Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Low Stock Alert
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {item.name}
                </div>
                {item.description && (
                  <div className="text-xs text-gray-500">
                    {item.description}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(
                    item.category.name
                  )}`}
                >
                  {item.category.name}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.unit_type}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.low_stock_threshold}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant={item.is_active ? 'success' : 'default'}>
                  {item.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(item)}
                >
                  Edit
                </Button>
                <Button
                  variant={item.is_active ? 'danger' : 'secondary'}
                  size="sm"
                  onClick={() => handleToggleStatus(item)}
                  disabled={loadingId === item.id}
                >
                  {loadingId === item.id
                    ? 'Loading...'
                    : item.is_active
                    ? 'Deactivate'
                    : 'Activate'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No items found</p>
        </div>
      )}
    </div>
  )
}
