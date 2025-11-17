/**
 * Collection Form Component
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { submitCollection } from '@/app/actions/collections'
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

interface CollectionFormProps {
  items: Item[]
}

interface CollectionItem {
  item_id: string
  quantity: number
}

export function CollectionForm({ items }: CollectionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]) // Today by default
  const [collectionItems, setCollectionItems] = useState<CollectionItem[]>([
    { item_id: '', quantity: 0 },
  ])

  const addItem = () => {
    setCollectionItems([...collectionItems, { item_id: '', quantity: 0 }])
  }

  const removeItem = (index: number) => {
    if (collectionItems.length > 1) {
      setCollectionItems(collectionItems.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof CollectionItem, value: string | number) => {
    const updated = [...collectionItems]
    updated[index] = { ...updated[index], [field]: value }
    setCollectionItems(updated)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validate that all items have been selected and have quantities
    const validItems = collectionItems.filter(
      (item) => item.item_id && item.quantity > 0
    )

    if (validItems.length === 0) {
      toast.error('Please add at least one item with a quantity')
      return
    }

    setLoading(true)

    const formData = new FormData()
    formData.append('items', JSON.stringify(validItems))
    formData.append('notes', notes)
    formData.append('receipt_date', receiptDate)

    const result = await submitCollection(formData)

    if (result.success) {
      toast.success('Collection submitted successfully!')
      router.push(`/collect/success?id=${result.collectionId}`)
    } else {
      toast.error(result.error || 'Failed to submit collection')
      setLoading(false)
    }
  }

  const getItemById = (id: string) => {
    return items.find((item) => item.id === id)
  }

  // Group items by category for easier selection
  const itemsByCategory = items.reduce((acc, item) => {
    const categoryName = item.category.name
    if (!acc[categoryName]) {
      acc[categoryName] = []
    }
    acc[categoryName].push(item)
    return acc
  }, {} as Record<string, Item[]>)

  const categoryOrder = ['Baby', 'Bathroom', 'First Aid', 'Pantry', 'Other']
  const sortedCategories = categoryOrder.filter((cat) => itemsByCategory[cat])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Collection Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {collectionItems.map((collectionItem, index) => {
            const selectedItem = getItemById(collectionItem.item_id)

            return (
              <div
                key={index}
                className="flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-4 p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex-1">
                  <Label htmlFor={`item-${index}`} required>
                    Item
                  </Label>
                  <Select
                    id={`item-${index}`}
                    value={collectionItem.item_id}
                    onChange={(e) =>
                      updateItem(index, 'item_id', e.target.value)
                    }
                    required
                  >
                    <option value="">Select an item</option>
                    {sortedCategories.map((categoryName) => (
                      <optgroup key={categoryName} label={categoryName}>
                        {itemsByCategory[categoryName].map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({item.unit_type})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </Select>
                </div>

                <div className="w-full md:w-32">
                  <Label htmlFor={`quantity-${index}`} required>
                    Quantity
                  </Label>
                  <Input
                    id={`quantity-${index}`}
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={collectionItem.quantity || ''}
                    onChange={(e) =>
                      updateItem(index, 'quantity', parseFloat(e.target.value))
                    }
                    placeholder={selectedItem?.unit_type || 'Qty'}
                    required
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={collectionItems.length === 1}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )
          })}

          <Button type="button" variant="outline" onClick={addItem}>
            + Add Another Item
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Receipt Date</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="receipt-date">
            When were these items received?
          </Label>
          <Input
            id="receipt-date"
            type="date"
            value={receiptDate}
            onChange={(e) => setReceiptDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]} // Can't be future date
            required
            className="max-w-xs"
          />
          <p className="text-sm text-gray-500 mt-2">
            This may differ from today's date if you're recording items received earlier
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Notes (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this collection..."
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard')}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Collection'}
        </Button>
      </div>
    </form>
  )
}
