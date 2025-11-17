/**
 * Server Actions for Items Management
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Validation schemas
const itemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  category_id: z.string().uuid('Invalid category'),
  unit_type: z.string().min(1, 'Unit type is required'),
  low_stock_threshold: z.number().min(0, 'Threshold must be 0 or greater'),
})

/**
 * Get all items with category information
 */
export async function getItems() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      category:item_categories(id, name, order_index)
    `)
    .order('name')

  if (error) {
    console.error('Error fetching items:', error)
    return { items: [], error: error.message }
  }

  return { items: data, error: null }
}

/**
 * Get active items only (excludes CBAJ-only items)
 * Use this for collection forms and inventory tracking
 */
export async function getActiveItems() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      category:item_categories(id, name, order_index)
    `)
    .eq('is_active', true)
    .eq('is_cbaj_only', false)  // Exclude CBAJ-only items from collection forms
    .order('name')

  if (error) {
    console.error('Error fetching active items:', error)
    return { items: [], error: error.message }
  }

  return { items: data, error: null }
}

/**
 * Get ALL active items (includes CBAJ-only items)
 * Use this for distributions/withdrawals where CBAJ items should be available
 */
export async function getAllActiveItems() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      category:item_categories(id, name, order_index)
    `)
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Error fetching all active items:', error)
    return { items: [], error: error.message }
  }

  return { items: data, error: null }
}

/**
 * Get all categories
 */
export async function getCategories() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('item_categories')
    .select('*')
    .order('order_index')

  if (error) {
    console.error('Error fetching categories:', error)
    return { categories: [], error: error.message }
  }

  return { categories: data, error: null }
}

/**
 * Create a new item
 */
export async function createItem(formData: FormData) {
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

  // Parse and validate form data
  const rawData = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || null,
    category_id: formData.get('category_id') as string,
    unit_type: formData.get('unit_type') as string,
    low_stock_threshold: Number(formData.get('low_stock_threshold')),
  }

  const validation = itemSchema.safeParse(rawData)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0].message,
    }
  }

  // Create item
  const { data, error } = await supabase
    .from('items')
    .insert([validation.data])
    .select()
    .single()

  if (error) {
    console.error('Error creating item:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/items')
  revalidatePath('/collect')
  return { success: true, data }
}

/**
 * Update an existing item
 */
export async function updateItem(id: string, formData: FormData) {
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

  // Parse and validate form data
  const rawData = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || null,
    category_id: formData.get('category_id') as string,
    unit_type: formData.get('unit_type') as string,
    low_stock_threshold: Number(formData.get('low_stock_threshold')),
  }

  const validation = itemSchema.safeParse(rawData)
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0].message,
    }
  }

  // Update item
  const { data, error } = await supabase
    .from('items')
    .update(validation.data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating item:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/items')
  revalidatePath('/collect')
  return { success: true, data }
}

/**
 * Toggle item active status
 */
export async function toggleItemStatus(id: string, isActive: boolean) {
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

  // Update item status
  const { data, error } = await supabase
    .from('items')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error toggling item status:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/items')
  revalidatePath('/collect')
  return { success: true, data }
}
