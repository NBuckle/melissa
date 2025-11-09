/**
 * Items Management Client Component
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ItemsTable } from './items-table'
import { ItemFormModal } from './item-form-modal'

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

interface ItemsManagementClientProps {
  items: Item[]
  categories: Category[]
}

export function ItemsManagementClient({
  items,
  categories,
}: ItemsManagementClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [showModal, setShowModal] = useState(false)

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && item.is_active) ||
      (filterStatus === 'inactive' && !item.is_active)

    return matchesSearch && matchesStatus
  })

  const handleAddNew = () => {
    setSelectedItem(null)
    setShowModal(true)
  }

  const handleEdit = (item: Item) => {
    setSelectedItem(item)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedItem(null)
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <CardTitle>Items Catalog</CardTitle>
              <Button onClick={handleAddNew}>Add New Item</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={filterStatus === 'all' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === 'active' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('active')}
                >
                  Active
                </Button>
                <Button
                  variant={filterStatus === 'inactive' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('inactive')}
                >
                  Inactive
                </Button>
              </div>
            </div>

            <ItemsTable items={filteredItems} onEdit={handleEdit} />

            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredItems.length} of {items.length} items
            </div>
          </CardContent>
        </Card>
      </div>

      {showModal && (
        <ItemFormModal
          item={selectedItem}
          categories={categories}
          onClose={handleCloseModal}
        />
      )}
    </>
  )
}
