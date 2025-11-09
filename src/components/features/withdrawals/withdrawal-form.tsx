/**
 * Withdrawal Form Component
 *
 * Form for creating new withdrawals/distributions.
 * Supports kit templates for quick entry and manual item selection.
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
import { submitWithdrawal } from '@/app/actions/withdrawals'
import { toast } from 'react-hot-toast'

interface DistributionType {
  id: string
  name: string
  requires_recipient: boolean
}

interface KitTemplate {
  id: string
  name: string
  description: string | null
  kit_template_items: Array<{
    quantity: number
    item: {
      id: string
      name: string
      unit_type: string
    }
  }>
}

interface Item {
  id: string
  name: string
  unit_type: string
  category: {
    name: string
  }
}

interface WithdrawalItem {
  item_id: string
  quantity: number
}

interface WithdrawalFormProps {
  distributionTypes: DistributionType[]
  kitTemplates: KitTemplate[]
  items: Item[]
}

export function WithdrawalForm({
  distributionTypes,
  kitTemplates,
  items,
}: WithdrawalFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [distributionTypeId, setDistributionTypeId] = useState('')
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null)
  const [kitsCreated, setKitsCreated] = useState(1)
  const [withdrawalItems, setWithdrawalItems] = useState<WithdrawalItem[]>([
    { item_id: '', quantity: 0 },
  ])
  const [recipient, setRecipient] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')

  // Find selected distribution type
  const selectedDistType = distributionTypes.find(
    (dt) => dt.id === distributionTypeId
  )

  // Group items by category
  const itemsByCategory = items.reduce((acc: any, item) => {
    const category = item.category.name
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {})

  const handleKitSelect = (kitId: string) => {
    if (!kitId) {
      setSelectedKitId(null)
      return
    }

    const kit = kitTemplates.find((k) => k.id === kitId)
    if (!kit) return

    setSelectedKitId(kitId)

    // Populate items from kit template
    const kitItems = kit.kit_template_items.map((kti) => ({
      item_id: kti.item.id,
      quantity: kti.quantity * kitsCreated,
    }))

    setWithdrawalItems(kitItems)
  }

  const handleKitsCreatedChange = (value: number) => {
    setKitsCreated(value)

    // Update quantities if kit is selected
    if (selectedKitId) {
      const kit = kitTemplates.find((k) => k.id === selectedKitId)
      if (kit) {
        const kitItems = kit.kit_template_items.map((kti) => ({
          item_id: kti.item.id,
          quantity: kti.quantity * value,
        }))
        setWithdrawalItems(kitItems)
      }
    }
  }

  const handleAddItem = () => {
    setWithdrawalItems([...withdrawalItems, { item_id: '', quantity: 0 }])
  }

  const handleRemoveItem = (index: number) => {
    setWithdrawalItems(withdrawalItems.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...withdrawalItems]
    updated[index] = { ...updated[index], [field]: value }
    setWithdrawalItems(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate distribution type
      if (!distributionTypeId) {
        toast.error('Please select a distribution type')
        setLoading(false)
        return
      }

      // Filter out empty items
      const validItems = withdrawalItems.filter(
        (item) => item.item_id && item.quantity > 0
      )

      if (validItems.length === 0) {
        toast.error('Please add at least one item')
        setLoading(false)
        return
      }

      // Check if recipient is required
      if (selectedDistType?.requires_recipient && !recipient.trim()) {
        toast.error('Recipient is required for this distribution type')
        setLoading(false)
        return
      }

      // Prepare form data
      const formData = new FormData()
      formData.append('distribution_type_id', distributionTypeId)
      if (selectedKitId) {
        formData.append('kit_template_id', selectedKitId)
        formData.append('kits_created', kitsCreated.toString())
      }
      if (recipient) formData.append('recipient', recipient)
      if (reason) formData.append('reason', reason)
      if (notes) formData.append('notes', notes)
      formData.append('items', JSON.stringify(validItems))

      const result = await submitWithdrawal(formData)

      if (result.success) {
        toast.success('Withdrawal submitted successfully!')
        router.push('/admin/withdrawals/success')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to submit withdrawal')
      }
    } catch (error) {
      console.error('Submission error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Withdrawal</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Distribution Type */}
          <div>
            <Label htmlFor="distribution-type">Distribution Type *</Label>
            <Select
              id="distribution-type"
              value={distributionTypeId}
              onChange={(e) => setDistributionTypeId(e.target.value)}
              required
            >
              <option value="">Select distribution type...</option>
              {distributionTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Kit Template Selector */}
          <div>
            <Label htmlFor="kit-template">Kit Template (Optional)</Label>
            <Select
              id="kit-template"
              value={selectedKitId || ''}
              onChange={(e) => handleKitSelect(e.target.value)}
            >
              <option value="">Manual item selection...</option>
              {kitTemplates.map((kit) => (
                <option key={kit.id} value={kit.id}>
                  {kit.name} ({kit.kit_template_items.length} items)
                </option>
              ))}
            </Select>
            {selectedKitId && (
              <div className="mt-2">
                <Label htmlFor="kits-created">Number of Kits</Label>
                <Input
                  id="kits-created"
                  type="number"
                  min="1"
                  value={kitsCreated}
                  onChange={(e) =>
                    handleKitsCreatedChange(Number(e.target.value))
                  }
                  className="w-32"
                />
              </div>
            )}
          </div>

          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Items *</Label>
              <Button
                type="button"
                onClick={handleAddItem}
                variant="outline"
                size="sm"
              >
                + Add Item
              </Button>
            </div>

            {withdrawalItems.map((item, index) => {
              const selectedItem = items.find((i) => i.id === item.item_id)
              return (
                <div key={index} className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Select
                      value={item.item_id}
                      onChange={(e) =>
                        handleItemChange(index, 'item_id', e.target.value)
                      }
                      required
                    >
                      <option value="">Select item...</option>
                      {Object.keys(itemsByCategory).map((category) => (
                        <optgroup key={category} label={category}>
                          {itemsByCategory[category].map((item: Item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </Select>
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Quantity"
                      value={item.quantity || ''}
                      onChange={(e) =>
                        handleItemChange(index, 'quantity', Number(e.target.value))
                      }
                      required
                    />
                  </div>
                  {selectedItem && (
                    <div className="w-20 text-sm text-gray-600">
                      {selectedItem.unit_type}
                    </div>
                  )}
                  <Button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    variant="outline"
                    size="sm"
                    disabled={withdrawalItems.length === 1}
                  >
                    Remove
                  </Button>
                </div>
              )
            })}
          </div>

          {/* Recipient (conditional) */}
          {selectedDistType?.requires_recipient && (
            <div>
              <Label htmlFor="recipient">Recipient *</Label>
              <Input
                id="recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Church name, location, or person"
                required
              />
            </div>
          )}

          {/* Reason */}
          <div>
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Hurricane relief, Monthly distribution"
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/withdrawals')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Withdrawal'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
