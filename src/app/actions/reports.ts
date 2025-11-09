/**
 * Server Actions for Reports & Analytics
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ============================================
// VALIDATION SCHEMAS
// ============================================

const dateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
})

const itemIdsSchema = z.array(z.string().uuid('Invalid item ID'))

// ============================================
// TYPES
// ============================================

export type DailyClosingBalance = {
  date: string
  item_id: string
  item_name: string
  category_name: string
  opening_balance: number
  daily_collected: number
  daily_withdrawn: number
  closing_balance: number
}

export type InventoryTrend = {
  date: string
  item_id: string
  item_name: string
  stock_level: number
}

export type CategoryTrend = {
  date: string
  category_id: string
  category_name: string
  total_stock: number
}

// ============================================
// ACTIONS
// ============================================

/**
 * Get daily closing balance for items across a date range
 */
export async function getDailyClosingBalance(
  startDate: string,
  endDate: string,
  itemId?: string
) {
  const supabase = await createClient()

  // Validate dates
  const validation = dateRangeSchema.safeParse({ startDate, endDate })
  if (!validation.success) {
    return {
      data: [],
      error: 'Invalid date range. Use YYYY-MM-DD format.',
    }
  }

  // Ensure start date is before or equal to end date
  if (new Date(startDate) > new Date(endDate)) {
    return {
      data: [],
      error: 'Start date must be before or equal to end date.',
    }
  }

  try {
    const { data, error } = await supabase.rpc('get_daily_closing_balance', {
      start_date: startDate,
      end_date: endDate,
      p_item_id: itemId || null,
    })

    if (error) {
      console.error('Error fetching daily closing balance:', error)
      return { data: [], error: error.message }
    }

    return { data: (data as DailyClosingBalance[]) || [], error: null }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { data: [], error: 'An unexpected error occurred' }
  }
}

/**
 * Get inventory trends for specific items
 */
export async function getInventoryTrends(
  startDate: string,
  endDate: string,
  itemIds?: string[]
) {
  const supabase = await createClient()

  // Validate dates
  const validation = dateRangeSchema.safeParse({ startDate, endDate })
  if (!validation.success) {
    return {
      data: [],
      error: 'Invalid date range. Use YYYY-MM-DD format.',
    }
  }

  // Validate item IDs if provided
  if (itemIds && itemIds.length > 0) {
    const itemIdsValidation = itemIdsSchema.safeParse(itemIds)
    if (!itemIdsValidation.success) {
      return {
        data: [],
        error: 'Invalid item IDs provided.',
      }
    }
  }

  try {
    const { data, error } = await supabase.rpc('get_inventory_trends', {
      start_date: startDate,
      end_date: endDate,
      p_item_ids: itemIds && itemIds.length > 0 ? itemIds : null,
    })

    if (error) {
      console.error('Error fetching inventory trends:', error)
      return { data: [], error: error.message }
    }

    return { data: (data as InventoryTrend[]) || [], error: null }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { data: [], error: 'An unexpected error occurred' }
  }
}

/**
 * Get category-level inventory trends
 */
export async function getCategoryTrends(
  startDate: string,
  endDate: string,
  categoryId?: string
) {
  const supabase = await createClient()

  // Validate dates
  const validation = dateRangeSchema.safeParse({ startDate, endDate })
  if (!validation.success) {
    return {
      data: [],
      error: 'Invalid date range. Use YYYY-MM-DD format.',
    }
  }

  try {
    const { data, error } = await supabase.rpc('get_category_trends', {
      start_date: startDate,
      end_date: endDate,
      p_category_id: categoryId || null,
    })

    if (error) {
      console.error('Error fetching category trends:', error)
      return { data: [], error: error.message }
    }

    return { data: (data as CategoryTrend[]) || [], error: null }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { data: [], error: 'An unexpected error occurred' }
  }
}

/**
 * Get summary statistics for reports
 */
export async function getReportsSummary() {
  const supabase = await createClient()

  try {
    // Get total items count
    const { count: totalItems } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Get total collections count
    const { count: totalCollections } = await supabase
      .from('collections')
      .select('*', { count: 'exact', head: true })

    // Get total withdrawals count
    const { count: totalWithdrawals } = await supabase
      .from('withdrawals')
      .select('*', { count: 'exact', head: true })

    // Get current total stock
    const { data: inventoryData } = await supabase
      .from('master_inventory')
      .select('current_stock, total_collected, total_withdrawn')

    const totalStock = inventoryData?.reduce(
      (sum, item) => sum + (Number(item.current_stock) || 0),
      0
    ) || 0

    const totalCollected = inventoryData?.reduce(
      (sum, item) => sum + (Number(item.total_collected) || 0),
      0
    ) || 0

    const totalWithdrawn = inventoryData?.reduce(
      (sum, item) => sum + (Number(item.total_withdrawn) || 0),
      0
    ) || 0

    // Get date range of data
    const { data: dateRange } = await supabase
      .from('collections')
      .select('submission_date')
      .order('submission_date', { ascending: true })
      .limit(1)

    const firstCollectionDate = dateRange?.[0]?.submission_date || null

    return {
      summary: {
        totalItems: totalItems || 0,
        totalCollections: totalCollections || 0,
        totalWithdrawals: totalWithdrawals || 0,
        totalStock,
        totalCollected,
        totalWithdrawn,
        firstCollectionDate,
      },
      error: null,
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    return {
      summary: null,
      error: 'Failed to fetch summary statistics',
    }
  }
}

/**
 * Get all active items for filtering
 */
export async function getActiveItemsForReports() {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('items')
      .select('id, name, category_id, item_categories(name)')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error fetching items:', error)
      return { items: [], error: error.message }
    }

    return { items: data || [], error: null }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { items: [], error: 'An unexpected error occurred' }
  }
}

/**
 * Get all categories for filtering
 */
export async function getCategoriesForReports() {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('item_categories')
      .select('id, name')
      .order('name')

    if (error) {
      console.error('Error fetching categories:', error)
      return { categories: [], error: error.message }
    }

    return { categories: data || [], error: null }
  } catch (err) {
    console.error('Unexpected error:', err)
    return { categories: [], error: 'An unexpected error occurred' }
  }
}
