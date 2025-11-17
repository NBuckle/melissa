/**
 * Withdrawal Form Component
 *
 * Form for recording actual inventory withdrawals (YOUR withdrawals, not CBAJ distributions)
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
import { submitWithdrawal } from '@/app/actions/actual-withdrawals'
import { toast } from 'react-hot-toast'

interface Category {
  id: string
  name: string
  order_index: number
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

interface WithdrawalFormProps {
  items: Item[]
}

interface WithdrawalItem {
  item_id: string
  quantity: number
}

export function WithdrawalForm({ items }: WithdrawalFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [recipient, setRecipient] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [withdrawalDate, setWithdrawalDate] = useState(
    new Date().toISOString().split('T')[0]
  ) // Today by default
  const [withdrawalItems, setWithdrawalItems] = useState<WithdrawalItem[]>([
    { item_id: '', quantity: 0 },
  ])

  const addItem = () => {
    setWithdrawalItems([...withdrawalItems, { item_id: '', quantity: 0 }])
  }

  const removeItem = (index: number) => {
    if (withdrawalItems.length > 1) {
      setWithdrawalItems(withdrawalItems.filter((_, i) => i !== index))
    }
  }

  const updateItem = (
    index: number,
    field: keyof WithdrawalItem,
    value: string | number
  ) => {
    const updated = [...withdrawalItems]
    updated[index] = { ...updated[index], [field]: value }
    setWithdrawalItems(updated)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validate that all items have been selected and have quantities
    const validItems = withdrawalItems.filter(
      (item) => item.item_id && item.quantity > 0
    )

    if (validItems.length === 0) {
      toast.error('Please add at least one item with a quantity')
      return
    }

    setLoading(true)

    const formData = new FormData()
    formData.append('items', JSON.stringify(validItems))
    formData.append('recipient', recipient)
    formData.append('reason', reason)
    formData.append('notes', notes)
    formData.append('withdrawal_date', withdrawalDate)

    const result = await submitWithdrawal(formData)

    if (result.success) {
      toast.success('Withdrawal recorded successfully!')
      // Reset form
      setWithdrawalItems([{ item_id: '', quantity: 0 }])
      setRecipient('')
      setReason('')
      setNotes('')
      setWithdrawalDate(new Date().toISOString().split('T')[0])
      router.refresh()
    } else {
      toast.error(result.error || 'Failed to record withdrawal')
    }

    setLoading(false)
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
          <CardTitle>Withdrawal Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {withdrawalItems.map((withdrawalItem, index) => {
            const selectedItem = getItemById(withdrawalItem.item_id)

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
                    value={withdrawalItem.item_id}
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
                    value={withdrawalItem.quantity || ''}
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
                    disabled={withdrawalItems.length === 1}
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
          <CardTitle>Withdrawal Date</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="withdrawal-date">
            When were these items withdrawn?
          </Label>
          <Input
            id="withdrawal-date"
            type="date"
            value={withdrawalDate}
            onChange={(e) => setWithdrawalDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]} // Can't be future date
            required
            className="max-w-xs"
          />
          <p className="text-sm text-gray-500 mt-2">
            This date will appear in your daily inventory report
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="recipient">Recipient (Optional)</Label>
            <Input
              id="recipient"
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Who received these items?"
            />
          </div>

          <div>
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Input
              id="reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Community giveaway, Emergency assistance"
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this withdrawal..."
              rows={4}
            />
          </div>
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
          {loading ? 'Recording...' : 'Record Withdrawal'}
        </Button>
      </div>
    </form>
  )
}
