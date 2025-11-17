/**
 * Server Actions for Actual Withdrawals
 *
 * Handles withdrawals that subtract from inventory stock.
 * These are YOUR withdrawals (not CBAJ distributions).
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Validation schemas
const withdrawalItemSchema = z.object({
  item_id: z.string().uuid('Invalid item'),
  quantity: z.number().positive('Quantity must be greater than 0'),
})

const withdrawalSchema = z.object({
  recipient: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  withdrawal_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  items: z.array(withdrawalItemSchema).min(1, 'At least one item is required'),
})

/**
 * Submit a new actual withdrawal
 */
export async function submitWithdrawal(formData: FormData) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((profile as any)?.role !== 'admin') {
    return { success: false, error: 'Unauthorized. Admin access required.' }
  }

  // Parse data from form
  const itemsJson = formData.get('items') as string
  const recipient = (formData.get('recipient') as string) || null
  const reason = (formData.get('reason') as string) || null
  const notes = (formData.get('notes') as string) || null
  const withdrawalDate = formData.get('withdrawal_date') as string

  let items
  try {
    items = JSON.parse(itemsJson)
  } catch (error) {
    return { success: false, error: 'Invalid items data' }
  }

  // Validate data
  const validation = withdrawalSchema.safeParse({
    recipient,
    reason,
    notes,
    withdrawal_date: withdrawalDate,
    items,
  })

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0].message,
    }
  }

  // Check stock availability for all items
  const { data: inventoryData } = await supabase
    .from('master_inventory')
    .select('item_id, item_name, current_stock')
    .in(
      'item_id',
      items.map((item: any) => item.item_id)
    )

  if (!inventoryData) {
    return { success: false, error: 'Failed to check stock availability' }
  }

  // Verify sufficient stock
  for (const item of items) {
    const inventoryItem = (inventoryData as any).find((inv: any) => inv.item_id === item.item_id)
    if (!inventoryItem) {
      return {
        success: false,
        error: `Item not found in inventory`,
      }
    }
    if (inventoryItem.current_stock < item.quantity) {
      return {
        success: false,
        error: `Insufficient stock for ${inventoryItem.item_name}. Available: ${inventoryItem.current_stock}, Requested: ${item.quantity}`,
      }
    }
  }

  const now = new Date()

  // Create withdrawal record
  const { data: withdrawal, error: withdrawalError } = await supabase
    .from('actual_withdrawals')
    .insert([
      {
        withdrawn_by: user.id,
        withdrawal_date: withdrawalDate,
        withdrawal_timestamp: now.toISOString(),
        recipient,
        reason,
        notes,
      },
    ])
    .select()
    .single()

  if (withdrawalError || !withdrawal) {
    console.error('Error creating withdrawal:', withdrawalError)
    return { success: false, error: withdrawalError?.message || 'Failed to create withdrawal' }
  }

  // Create withdrawal items
  const withdrawalItems = validation.data.items.map((item) => ({
    withdrawal_id: (withdrawal as any).id,
    item_id: item.item_id,
    quantity: item.quantity,
  }))

  const { error: itemsError } = await supabase
    .from('actual_withdrawal_items')
    .insert(withdrawalItems)

  if (itemsError) {
    console.error('Error creating withdrawal items:', itemsError)
    // Rollback: delete the withdrawal
    await supabase.from('actual_withdrawals').delete().eq('id', (withdrawal as any).id)
    return { success: false, error: itemsError.message }
  }

  // Refresh the materialized view
  await supabase.rpc('refresh_master_inventory')

  revalidatePath('/dashboard')
  revalidatePath('/inventory/total')
  revalidatePath('/inventory/daily')
  revalidatePath('/admin/withdrawals')

  return { success: true, withdrawalId: (withdrawal as any).id }
}

/**
 * Get recent actual withdrawals with details
 */
export async function getRecentWithdrawals(limit: number = 10) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('actual_withdrawals')
    .select(
      `
      *,
      profile:profiles(full_name, email),
      actual_withdrawal_items(
        quantity,
        item:items(name, unit_type)
      )
    `
    )
    .order('withdrawal_timestamp', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent withdrawals:', error)
    return { withdrawals: [], error: error.message }
  }

  return { withdrawals: data, error: null }
}

/**
 * Get withdrawals within a date range
 */
export async function getWithdrawalsByDateRange(
  startDate: string,
  endDate: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('actual_withdrawals')
    .select(
      `
      *,
      profile:profiles(full_name, email),
      actual_withdrawal_items(
        quantity,
        item:items(name, unit_type, category:item_categories(name))
      )
    `
    )
    .gte('withdrawal_date', startDate)
    .lte('withdrawal_date', endDate)
    .order('withdrawal_timestamp', { ascending: false })

  if (error) {
    console.error('Error fetching withdrawals by date range:', error)
    return { withdrawals: [], error: error.message }
  }

  return { withdrawals: data, error: null }
}
