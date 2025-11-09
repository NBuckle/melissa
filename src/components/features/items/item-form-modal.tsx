/**
 * Item Form Modal Component
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createItem, updateItem } from '@/app/actions/items'
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

interface ItemFormModalProps {
  item: Item | null
  categories: Category[]
  onClose: () => void
}

const UNIT_TYPES = [
  'lbs',
  'units',
  'packs',
  'cans',
  'bottles',
  'boxes',
  'bags',
  'dozen',
  'gallons',
  'oz',
]

export function ItemFormModal({
  item,
  categories,
  onClose,
}: ItemFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    unit_type: '',
    low_stock_threshold: '10',
  })

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description || '',
        category_id: item.category_id,
        unit_type: item.unit_type,
        low_stock_threshold: item.low_stock_threshold.toString(),
      })
    }
  }, [item])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formDataObj = new FormData()
    formDataObj.append('name', formData.name)
    formDataObj.append('description', formData.description)
    formDataObj.append('category_id', formData.category_id)
    formDataObj.append('unit_type', formData.unit_type)
    formDataObj.append('low_stock_threshold', formData.low_stock_threshold)

    const result = item
      ? await updateItem(item.id, formDataObj)
      : await createItem(formDataObj)

    if (result.success) {
      toast.success(
        `Item ${item ? 'updated' : 'created'} successfully`
      )
      onClose()
    } else {
      toast.error(result.error || 'An error occurred')
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{item ? 'Edit Item' : 'Add New Item'}</CardTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" required>
                  Item Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category_id" required>
                    Category
                  </Label>
                  <Select
                    id="category_id"
                    value={formData.category_id}
                    onChange={(e) =>
                      setFormData({ ...formData, category_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="unit_type" required>
                    Unit Type
                  </Label>
                  <Select
                    id="unit_type"
                    value={formData.unit_type}
                    onChange={(e) =>
                      setFormData({ ...formData, unit_type: e.target.value })
                    }
                    required
                  >
                    <option value="">Select a unit</option>
                    {UNIT_TYPES.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="low_stock_threshold" required>
                  Low Stock Alert Threshold
                </Label>
                <Input
                  id="low_stock_threshold"
                  type="number"
                  min="0"
                  value={formData.low_stock_threshold}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      low_stock_threshold: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : item ? 'Update Item' : 'Create Item'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
