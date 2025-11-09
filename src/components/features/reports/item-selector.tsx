/**
 * Item Selector Component
 *
 * Multi-select dropdown for filtering reports by items.
 * Groups items by category.
 */

'use client'

import { useState, useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Item {
  id: string
  name: string
  category_id: string | null
  item_categories: { name: string } | null
}

interface ItemSelectorProps {
  items: Item[]
  selectedItemIds: string[]
  onChange: (itemIds: string[]) => void
  maxSelections?: number
}

export function ItemSelector({
  items,
  selectedItemIds,
  onChange,
  maxSelections = 10,
}: ItemSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, Item[]> = {}

    items.forEach((item) => {
      const categoryName =
        item.item_categories?.name || item.category_id || 'Uncategorized'

      if (!groups[categoryName]) {
        groups[categoryName] = []
      }

      groups[categoryName].push(item)
    })

    // Sort categories alphabetically, with Uncategorized last
    return Object.keys(groups)
      .sort((a, b) => {
        if (a === 'Uncategorized') return 1
        if (b === 'Uncategorized') return -1
        return a.localeCompare(b)
      })
      .reduce((acc, key) => {
        acc[key] = groups[key].sort((a, b) => a.name.localeCompare(b.name))
        return acc
      }, {} as Record<string, Item[]>)
  }, [items])

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchTerm) return groupedItems

    const lowerSearch = searchTerm.toLowerCase()
    const filtered: Record<string, Item[]> = {}

    Object.entries(groupedItems).forEach(([category, categoryItems]) => {
      const matchingItems = categoryItems.filter(
        (item) =>
          item.name.toLowerCase().includes(lowerSearch) ||
          category.toLowerCase().includes(lowerSearch)
      )

      if (matchingItems.length > 0) {
        filtered[category] = matchingItems
      }
    })

    return filtered
  }, [groupedItems, searchTerm])

  const handleToggleItem = (itemId: string) => {
    if (selectedItemIds.includes(itemId)) {
      // Remove item
      onChange(selectedItemIds.filter((id) => id !== itemId))
    } else {
      // Add item (if under max limit)
      if (selectedItemIds.length < maxSelections) {
        onChange([...selectedItemIds, itemId])
      }
    }
  }

  const handleSelectAll = () => {
    const allItemIds = items.slice(0, maxSelections).map((item) => item.id)
    onChange(allItemIds)
  }

  const handleClearAll = () => {
    onChange([])
  }

  const selectedItems = items.filter((item) =>
    selectedItemIds.includes(item.id)
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700">
          Select Items
        </Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={items.length === 0}
          >
            Select All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={selectedItemIds.length === 0}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Selected Items Display */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md">
          {selectedItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
            >
              <span>{item.name}</span>
              <button
                type="button"
                onClick={() => handleToggleItem(item.id)}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <Input
        type="text"
        placeholder="Search items..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setShowDropdown(true)}
      />

      {/* Dropdown */}
      {showDropdown && (
        <div className="relative">
          <div className="absolute z-10 w-full max-h-96 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg">
            {Object.keys(filteredItems).length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No items found
              </div>
            ) : (
              Object.entries(filteredItems).map(([category, categoryItems]) => (
                <div key={category} className="border-b last:border-b-0">
                  {/* Category Header */}
                  <div className="px-4 py-2 bg-gray-50 font-medium text-sm text-gray-700">
                    {category}
                  </div>
                  {/* Category Items */}
                  {categoryItems.map((item) => {
                    const isSelected = selectedItemIds.includes(item.id)
                    const isDisabled =
                      !isSelected && selectedItemIds.length >= maxSelections

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => !isDisabled && handleToggleItem(item.id)}
                        disabled={isDisabled}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                          isSelected ? 'bg-blue-50' : ''
                        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className="text-sm">{item.name}</span>
                        {isSelected && (
                          <svg
                            className="w-4 h-4 text-blue-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))
            )}

            {/* Close Button */}
            <div className="p-2 bg-gray-50 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDropdown(false)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Selection Count */}
      <div className="text-sm text-gray-600">
        {selectedItemIds.length} of {maxSelections} items selected
      </div>
    </div>
  )
}
