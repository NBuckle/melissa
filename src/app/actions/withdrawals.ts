/**
 * Server Actions for Withdrawals & Distributions
 *
 * Handles creating and retrieving withdrawal/distribution records.
 * Supports kit-based distributions and manual item withdrawals.
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
  distribution_type_id: z.string().uuid('Distribution type is required'),
  kit_template_id: z.string().uuid().optional(),
  kits_created: z.number().int().positive().optional(),
  recipient: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(withdrawalItemSchema).min(1, 'At least one item is required'),
})

/**
 * Get all distribution types
 */
export async function getDistributionTypes() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('distribution_types')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching distribution types:', error)
    return { types: [], error: error.message }
  }

  return { types: data, error: null }
}

/**
 * Get all active kit templates with their items
 */
export async function getKitTemplates() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('kit_templates')
    .select(`
      *,
      kit_template_items(
        quantity,
        item:items(id, name, unit_type, category:item_categories(name))
      )
    `)
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Error fetching kit templates:', error)
    return { templates: [], error: error.message }
  }

  return { templates: data, error: null }
}

/**
 * Get a single kit template by ID with items
 */
export async function getKitTemplateById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('kit_templates')
    .select(`
      *,
      kit_template_items(
        quantity,
        item:items(id, name, unit_type)
      )
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching kit template:', error)
    return { template: null, error: error.message }
  }

  return { template: data, error: null }
}

/**
 * Submit a new withdrawal/distribution
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

  // Parse items from form data
  const itemsJson = formData.get('items') as string
  const distributionTypeId = formData.get('distribution_type_id') as string
  const kitTemplateId = formData.get('kit_template_id') as string | null
  const kitsCreated = formData.get('kits_created')
    ? Number(formData.get('kits_created'))
    : null
  const recipient = (formData.get('recipient') as string) || null
  const reason = (formData.get('reason') as string) || null
  const notes = (formData.get('notes') as string) || null

  let items
  try {
    items = JSON.parse(itemsJson)
  } catch (error) {
    return { success: false, error: 'Invalid items data' }
  }

  // Validate data
  const validation = withdrawalSchema.safeParse({
    distribution_type_id: distributionTypeId,
    kit_template_id: kitTemplateId,
    kits_created: kitsCreated,
    recipient,
    reason,
    notes,
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

  // Get today's date
  const now = new Date()
  const withdrawalDate = now.toISOString().split('T')[0]

  // Create withdrawal record
  const { data: withdrawal, error: withdrawalError } = await supabase
    .from('withdrawals')
    .insert([
      {
        distribution_type_id: distributionTypeId,
        kit_template_id: kitTemplateId || null,
        kits_created: kitsCreated || null,
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
    .from('withdrawal_items')
    .insert(withdrawalItems)

  if (itemsError) {
    console.error('Error creating withdrawal items:', itemsError)
    // Rollback: delete the withdrawal
    await supabase.from('withdrawals').delete().eq('id', (withdrawal as any).id)
    return { success: false, error: itemsError.message }
  }

  // Refresh the materialized view
  await supabase.rpc('refresh_master_inventory')

  revalidatePath('/dashboard')
  revalidatePath('/inventory/total')
  revalidatePath('/admin/withdrawals')

  return { success: true, withdrawalId: (withdrawal as any).id }
}

/**
 * Get recent withdrawals with details
 */
export async function getRecentWithdrawals(limit: number = 10) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('withdrawals')
    .select(
      `
      *,
      profile:profiles(full_name, email),
      distribution_type:distribution_types(name, requires_recipient),
      kit_template:kit_templates(name, description),
      withdrawal_items(
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
    .from('withdrawals')
    .select(
      `
      *,
      profile:profiles(full_name, email),
      distribution_type:distribution_types(name, requires_recipient),
      kit_template:kit_templates(name, description),
      withdrawal_items(
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
