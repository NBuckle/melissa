/**
 * Date Range Selector Component
 *
 * Allows users to select preset date ranges or custom dates for reports.
 */

'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export type DateRange = {
  startDate: string
  endDate: string
}

interface DateRangeSelectorProps {
  value: DateRange
  onChange: (range: DateRange) => void
  onApply?: () => void
  showApplyButton?: boolean
}

export function DateRangeSelector({
  value,
  onChange,
  onApply,
  showApplyButton = false,
}: DateRangeSelectorProps) {
  const [preset, setPreset] = useState<string>('30days')

  // Generate date strings in YYYY-MM-DD format
  const getDateString = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  const handlePresetChange = (presetValue: string) => {
    setPreset(presetValue)

    const today = new Date()
    let startDate: Date

    switch (presetValue) {
      case '7days':
        startDate = new Date(today)
        startDate.setDate(today.getDate() - 7)
        break
      case '30days':
        startDate = new Date(today)
        startDate.setDate(today.getDate() - 30)
        break
      case '90days':
        startDate = new Date(today)
        startDate.setDate(today.getDate() - 90)
        break
      case 'ytd':
        startDate = new Date(today.getFullYear(), 0, 1) // Jan 1 of current year
        break
      case 'custom':
        // Keep current dates for custom
        return
      default:
        startDate = new Date(today)
        startDate.setDate(today.getDate() - 30)
    }

    onChange({
      startDate: getDateString(startDate),
      endDate: getDateString(today),
    })

    // Auto-apply if no apply button
    if (!showApplyButton && onApply) {
      setTimeout(() => onApply(), 100)
    }
  }

  const handleCustomStartChange = (date: string) => {
    setPreset('custom')
    onChange({
      ...value,
      startDate: date,
    })
  }

  const handleCustomEndChange = (date: string) => {
    setPreset('custom')
    onChange({
      ...value,
      endDate: date,
    })
  }

  const handleApply = () => {
    if (onApply) {
      onApply()
    }
  }

  return (
    <div className="space-y-4">
      {/* Preset Buttons */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2 block">
          Quick Select
        </Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={preset === '7days' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePresetChange('7days')}
          >
            Last 7 Days
          </Button>
          <Button
            type="button"
            variant={preset === '30days' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePresetChange('30days')}
          >
            Last 30 Days
          </Button>
          <Button
            type="button"
            variant={preset === '90days' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePresetChange('90days')}
          >
            Last 90 Days
          </Button>
          <Button
            type="button"
            variant={preset === 'ytd' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePresetChange('ytd')}
          >
            Year to Date
          </Button>
          <Button
            type="button"
            variant={preset === 'custom' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreset('custom')}
          >
            Custom Range
          </Button>
        </div>
      </div>

      {/* Custom Date Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start-date" className="text-sm font-medium text-gray-700">
            Start Date
          </Label>
          <Input
            id="start-date"
            type="date"
            value={value.startDate}
            onChange={(e) => handleCustomStartChange(e.target.value)}
            max={value.endDate}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="end-date" className="text-sm font-medium text-gray-700">
            End Date
          </Label>
          <Input
            id="end-date"
            type="date"
            value={value.endDate}
            onChange={(e) => handleCustomEndChange(e.target.value)}
            min={value.startDate}
            max={getDateString(new Date())}
            className="mt-1"
          />
        </div>
      </div>

      {/* Apply Button (optional) */}
      {showApplyButton && (
        <div className="flex justify-end">
          <Button type="button" onClick={handleApply}>
            Apply Date Range
          </Button>
        </div>
      )}

      {/* Date Range Display */}
      <div className="text-sm text-gray-600">
        Showing data from{' '}
        <span className="font-medium">{value.startDate}</span> to{' '}
        <span className="font-medium">{value.endDate}</span>
      </div>
    </div>
  )
}
