/**
 * Server Actions for Inventory
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

/**
 * Get master inventory summary
 */
export async function getMasterInventory() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('master_inventory')
    .select('*')
    .order('item_name')

  if (error) {
    console.error('Error fetching master inventory:', error)
    return { inventory: [], error: error.message }
  }

  return { inventory: data, error: null }
}

/**
 * Get daily inventory for a specific date
 */
export async function getDailyInventory(date?: string) {
  const supabase = await createClient()
  const targetDate = date || new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('daily_inventory')
    .select('*')
    .eq('submission_date', targetDate)
    .order('item_name')

  if (error) {
    console.error('Error fetching daily inventory:', error)
    return { inventory: [], error: error.message }
  }

  return { inventory: data, error: null }
}

/**
 * Get low stock items
 */
export async function getLowStockItems() {
  const supabase = await createClient()

  // Fetch all active items and filter in JavaScript
  // (Supabase doesn't support column-to-column comparison in filters)
  const { data, error } = await supabase
    .from('master_inventory')
    .select('*')
    .eq('is_active', true)
    .order('current_stock')

  if (error) {
    console.error('Error fetching low stock items:', error)
    return { items: [], error: error.message }
  }

  // Filter items where current_stock <= low_stock_threshold
  const lowStockItems = (data as any)?.filter(
    (item: any) => item.current_stock <= item.low_stock_threshold
  ) || []

  return { items: lowStockItems, error: null }
}

/**
 * Get inventory statistics
 */
export async function getInventoryStats() {
  const supabase = await createClient()

  // Get total active items
  const { count: totalItems } = await supabase
    .from('items')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  // Get today's collections count
  const today = new Date().toISOString().split('T')[0]
  const { count: todayCollections } = await supabase
    .from('collections')
    .select('*', { count: 'exact', head: true })
    .eq('submission_date', today)

  // Get total current stock value (sum of all current_stock)
  const { data: inventoryData } = await supabase
    .from('master_inventory')
    .select('current_stock, total_collected, total_withdrawn')

  const totalStock = (inventoryData as any)?.reduce(
    (sum: number, item: any) => sum + (item.current_stock || 0),
    0
  ) || 0

  const totalCollected = (inventoryData as any)?.reduce(
    (sum: number, item: any) => sum + (item.total_collected || 0),
    0
  ) || 0

  const totalWithdrawn = (inventoryData as any)?.reduce(
    (sum: number, item: any) => sum + (item.total_withdrawn || 0),
    0
  ) || 0

  // Get low stock count (filter in JavaScript due to column comparison limitation)
  const lowStockCount = (inventoryData as any)?.filter(
    (item: any) => item.is_active && item.current_stock <= item.low_stock_threshold
  ).length || 0

  return {
    totalItems: totalItems || 0,
    todayCollections: todayCollections || 0,
    totalStock,
    totalCollected,
    totalWithdrawn,
    lowStockCount,
  }
}

/**
 * Types for Inventory Snapshot
 */
export type SnapshotItem = {
  date: string
  item_id: string
  item_name: string
  category_name: string
  opening_balance: number
  daily_collected: number
  daily_withdrawn: number
  closing_balance: number
}

export type SnapshotSummary = {
  totalItems: number
  totalCollected: number
  totalWithdrawn: number
  netChange: number
  itemsWithActivity: number
}

/**
 * Get inventory snapshot for a specific date
 * Shows opening balance, daily changes, and closing balance for all items
 */
export async function getInventorySnapshot(date: string) {
  const supabase = await createClient()

  // Validate date format (YYYY-MM-DD)
  const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
  const validation = dateSchema.safeParse(date)

  if (!validation.success) {
    return {
      data: [],
      summary: null,
      error: 'Invalid date format. Please use YYYY-MM-DD format.',
    }
  }

  // Check if date is not before first data entry (Nov 1, 2025)
  const firstDataDate = '2025-11-01'
  if (new Date(date) < new Date(firstDataDate)) {
    return {
      data: [],
      summary: null,
      error: `No data available before ${firstDataDate}`,
    }
  }

  // Check if date is not in the future
  const today = new Date().toISOString().split('T')[0]
  if (new Date(date) > new Date(today)) {
    return {
      data: [],
      summary: null,
      error: 'Cannot view future dates',
    }
  }

  try {
    // Use existing get_daily_closing_balance function with single date
    const { data, error } = await (supabase as any).rpc('get_daily_closing_balance', {
      start_date: date,
      end_date: date,
      p_item_id: null,
    })

    if (error) {
      console.error('Error fetching inventory snapshot:', error)
      return { data: [], summary: null, error: error.message }
    }

    const snapshotData = (data as SnapshotItem[]) || []

    // Calculate summary statistics
    const summary: SnapshotSummary = {
      totalItems: snapshotData.length,
      totalCollected: snapshotData.reduce(
        (sum, item) => sum + (item.daily_collected || 0),
        0
      ),
      totalWithdrawn: snapshotData.reduce(
        (sum, item) => sum + (item.daily_withdrawn || 0),
        0
      ),
      netChange: snapshotData.reduce(
        (sum, item) => sum + (item.daily_collected || 0) - (item.daily_withdrawn || 0),
        0
      ),
      itemsWithActivity: snapshotData.filter(
        item => (item.daily_collected || 0) > 0 || (item.daily_withdrawn || 0) > 0
      ).length,
    }

    return { data: snapshotData, summary, error: null }
  } catch (err) {
    console.error('Unexpected error:', err)
    return {
      data: [],
      summary: null,
      error: 'An unexpected error occurred while fetching inventory snapshot',
    }
  }
}

/**
 * Get the earliest date with data (for date picker limits)
 */
export async function getEarliestDataDate() {
  const supabase = await createClient()

  const { data, error} = await supabase
    .from('collections')
    .select('submission_date')
    .order('submission_date', { ascending: true })
    .limit(1)

  if (error || !data || data.length === 0) {
    // Default to Nov 1, 2025 if no data found
    return { date: '2025-11-01', error: null }
  }

  return { date: (data as any)[0].submission_date, error: null }
}

/**
 * Get withdrawal breakdowns for all items grouped by category
 */
export async function getWithdrawalBreakdowns() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('withdrawal_breakdowns')
    .select(`
      id,
      item_id,
      giveaway_name,
      quantity,
      items (
        name,
        category_id,
        item_categories (
          name
        )
      )
    `)
    .order('giveaway_name', { ascending: true })

  if (error) {
    console.error('Error fetching withdrawal breakdowns:', error)
    return { breakdowns: [], error: error.message }
  }

  return { breakdowns: data || [], error: null }
}

/**
 * Get master inventory with corrected withdrawal totals from breakdown data
 */
export async function getMasterInventoryWithBreakdowns() {
  const supabase = await createClient()

  // Get master inventory
  const { data: inventory, error: invError } = await supabase
    .from('master_inventory')
    .select('*')
    .order('item_name')

  if (invError) {
    console.error('Error fetching master inventory:', invError)
    return { inventory: [], error: invError.message }
  }

  // Get withdrawal breakdowns summed by item
  const { data: breakdowns, error: breakError } = await supabase
    .from('withdrawal_breakdowns')
    .select('item_id, quantity')

  if (breakError) {
    console.error('Error fetching withdrawal breakdowns:', breakError)
    // Continue without breakdowns data
  }

  // Calculate total withdrawn per item from breakdowns
  const withdrawnByItem = new Map<string, number>()
  if (breakdowns) {
    breakdowns.forEach((b: any) => {
      const current = withdrawnByItem.get(b.item_id) || 0
      withdrawnByItem.set(b.item_id, current + parseFloat(b.quantity || 0))
    })
  }

  // Update inventory with corrected withdrawal totals
  const correctedInventory = inventory.map((item: any) => {
    const totalWithdrawn = withdrawnByItem.get(item.item_id) || 0
    return {
      ...item,
      total_withdrawn: totalWithdrawn,
      current_stock: item.total_collected - totalWithdrawn
    }
  })

  return { inventory: correctedInventory, error: null }
}

/**
 * Get CBAJ deliveries grouped by date
 */
export async function getCBAJDeliveries() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cbaj_deliveries')
    .select('*')
    .order('delivery_date', { ascending: true })
    .order('church_name', { ascending: true })

  if (error) {
    console.error('Error fetching CBAJ deliveries:', error)
    return { deliveries: [], error: error.message }
  }

  return { deliveries: data || [], error: null }
}
