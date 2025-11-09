/**
 * Server Actions for Inventory
 */

'use server'

import { createClient } from '@/lib/supabase/server'

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
    .eq('date', targetDate)
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

  const { data, error } = await supabase
    .from('master_inventory')
    .select('*')
    .filter('current_stock', 'lte', 'low_stock_threshold')
    .eq('is_active', true)
    .order('current_stock')

  if (error) {
    console.error('Error fetching low stock items:', error)
    return { items: [], error: error.message }
  }

  return { items: data, error: null }
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

  const totalStock = inventoryData?.reduce(
    (sum, item) => sum + (item.current_stock || 0),
    0
  ) || 0

  const totalCollected = inventoryData?.reduce(
    (sum, item) => sum + (item.total_collected || 0),
    0
  ) || 0

  const totalWithdrawn = inventoryData?.reduce(
    (sum, item) => sum + (item.total_withdrawn || 0),
    0
  ) || 0

  // Get low stock count
  const { count: lowStockCount } = await supabase
    .from('master_inventory')
    .select('*', { count: 'exact', head: true })
    .filter('current_stock', 'lte', 'low_stock_threshold')
    .eq('is_active', true)

  return {
    totalItems: totalItems || 0,
    todayCollections: todayCollections || 0,
    totalStock,
    totalCollected,
    totalWithdrawn,
    lowStockCount: lowStockCount || 0,
  }
}
