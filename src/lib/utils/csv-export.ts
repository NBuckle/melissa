/**
 * CSV Export Utilities
 *
 * Functions for generating and downloading CSV files from data.
 */

import { format } from 'date-fns'

/**
 * Convert array of objects to CSV string
 *
 * @param data Array of objects to convert
 * @param headers Optional array of header names. If not provided, uses object keys
 * @returns CSV string
 */
export function generateCSV<T extends Record<string, any>>(
  data: T[],
  headers?: string[]
): string {
  if (data.length === 0) {
    return ''
  }

  // Use provided headers or extract from first object
  const columnHeaders = headers || Object.keys(data[0])
  const csvRows: string[] = []

  // Add header row
  csvRows.push(columnHeaders.join(','))

  // Add data rows
  for (const row of data) {
    const values = columnHeaders.map((header) => {
      const value = row[header]

      // Handle null/undefined
      if (value === null || value === undefined) {
        return ''
      }

      // Convert to string
      let stringValue = String(value)

      // Escape quotes by doubling them
      stringValue = stringValue.replace(/"/g, '""')

      // Wrap in quotes if contains comma, newline, or quotes
      if (
        stringValue.includes(',') ||
        stringValue.includes('\n') ||
        stringValue.includes('"')
      ) {
        return `"${stringValue}"`
      }

      return stringValue
    })

    csvRows.push(values.join(','))
  }

  return csvRows.join('\n')
}

/**
 * Convert array of objects to CSV with custom column mapping
 *
 * @param data Array of objects to convert
 * @param columnMap Object mapping display names to data keys
 * @returns CSV string
 *
 * @example
 * generateCSVWithMapping(data, {
 *   'Item Name': 'item_name',
 *   'Stock Level': 'current_stock'
 * })
 */
export function generateCSVWithMapping<T extends Record<string, any>>(
  data: T[],
  columnMap: Record<string, keyof T>
): string {
  if (data.length === 0) {
    return ''
  }

  const csvRows: string[] = []
  const displayHeaders = Object.keys(columnMap)
  const dataKeys = Object.values(columnMap)

  // Add header row with display names
  csvRows.push(displayHeaders.join(','))

  // Add data rows
  for (const row of data) {
    const values = dataKeys.map((key) => {
      const value = row[key]

      // Handle null/undefined
      if (value === null || value === undefined) {
        return ''
      }

      // Convert to string
      let stringValue = String(value)

      // Escape quotes by doubling them
      stringValue = stringValue.replace(/"/g, '""')

      // Wrap in quotes if contains comma, newline, or quotes
      if (
        stringValue.includes(',') ||
        stringValue.includes('\n') ||
        stringValue.includes('"')
      ) {
        return `"${stringValue}"`
      }

      return stringValue
    })

    csvRows.push(values.join(','))
  }

  return csvRows.join('\n')
}

/**
 * Trigger browser download of CSV file
 *
 * @param csvContent The CSV string to download
 * @param filename The name of the file (without extension)
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Add .csv extension if not present
  const finalFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`

  // Create blob with BOM for proper Excel UTF-8 handling
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], {
    type: 'text/csv;charset=utf-8;',
  })

  // Create download link
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', finalFilename)
  link.style.visibility = 'hidden'

  // Trigger download
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up
  window.URL.revokeObjectURL(url)
}

/**
 * Generate filename with date range for reports
 *
 * @param baseName Base name for the file (e.g., "daily-closing-balance")
 * @param startDate Start date of report
 * @param endDate End date of report
 * @returns Formatted filename
 *
 * @example
 * generateReportFilename('closing-balance', '2025-01-01', '2025-01-31')
 * // Returns: "closing-balance_2025-01-01_to_2025-01-31.csv"
 */
export function generateReportFilename(
  baseName: string,
  startDate?: string,
  endDate?: string
): string {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss')

  if (startDate && endDate) {
    return `${baseName}_${startDate}_to_${endDate}`
  }

  return `${baseName}_${timestamp}`
}

/**
 * Export daily closing balance data to CSV
 *
 * Helper function specifically for closing balance reports
 */
export function exportClosingBalanceToCSV(
  data: Array<{
    date: string
    item_name: string
    category_name: string
    opening_balance: number
    daily_collected: number
    daily_withdrawn: number
    closing_balance: number
  }>,
  startDate: string,
  endDate: string
): void {
  const csv = generateCSVWithMapping(data, {
    Date: 'date',
    'Item Name': 'item_name',
    Category: 'category_name',
    'Opening Balance': 'opening_balance',
    'Daily Collected': 'daily_collected',
    'Daily Withdrawn': 'daily_withdrawn',
    'Closing Balance': 'closing_balance',
  })

  const filename = generateReportFilename(
    'daily-closing-balance',
    startDate,
    endDate
  )

  downloadCSV(csv, filename)
}

/**
 * Export inventory trends data to CSV
 *
 * Helper function specifically for inventory trends reports
 */
export function exportInventoryTrendsToCSV(
  data: Array<{
    date: string
    item_name: string
    stock_level: number
  }>,
  startDate: string,
  endDate: string
): void {
  const csv = generateCSVWithMapping(data, {
    Date: 'date',
    'Item Name': 'item_name',
    'Stock Level': 'stock_level',
  })

  const filename = generateReportFilename(
    'inventory-trends',
    startDate,
    endDate
  )

  downloadCSV(csv, filename)
}

/**
 * Export category trends data to CSV
 *
 * Helper function specifically for category trends reports
 */
export function exportCategoryTrendsToCSV(
  data: Array<{
    date: string
    category_name: string
    total_stock: number
  }>,
  startDate: string,
  endDate: string
): void {
  const csv = generateCSVWithMapping(data, {
    Date: 'date',
    Category: 'category_name',
    'Total Stock': 'total_stock',
  })

  const filename = generateReportFilename(
    'category-trends',
    startDate,
    endDate
  )

  downloadCSV(csv, filename)
}
