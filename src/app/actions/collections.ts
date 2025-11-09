/**
 * Server Actions for Collections
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Validation schemas
const collectionItemSchema = z.object({
  item_id: z.string().uuid('Invalid item'),
  quantity: z.number().positive('Quantity must be greater than 0'),
})

const collectionSchema = z.object({
  notes: z.string().optional(),
  items: z
    .array(collectionItemSchema)
    .min(1, 'At least one item is required'),
})

/**
 * Submit a new collection
 */
export async function submitCollection(formData: FormData) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Parse items from form data
  const itemsJson = formData.get('items') as string
  const notes = (formData.get('notes') as string) || null

  let items
  try {
    items = JSON.parse(itemsJson)
  } catch (error) {
    return { success: false, error: 'Invalid items data' }
  }

  // Validate data
  const validation = collectionSchema.safeParse({ items, notes })
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0].message,
    }
  }

  // Get today's date
  const now = new Date()
  const submissionDate = now.toISOString().split('T')[0]

  // Create collection record
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .insert([
      {
        submitted_by: user.id,
        submission_date: submissionDate,
        submission_timestamp: now.toISOString(),
        notes,
      },
    ])
    .select()
    .single()

  if (collectionError) {
    console.error('Error creating collection:', collectionError)
    return { success: false, error: collectionError.message }
  }

  // Create collection items
  const collectionItems = validation.data.items.map((item) => ({
    collection_id: collection.id,
    item_id: item.item_id,
    quantity: item.quantity,
  }))

  const { error: itemsError } = await supabase
    .from('collection_items')
    .insert(collectionItems)

  if (itemsError) {
    console.error('Error creating collection items:', itemsError)
    // Rollback: delete the collection
    await supabase.from('collections').delete().eq('id', collection.id)
    return { success: false, error: itemsError.message }
  }

  // Refresh the materialized view
  await supabase.rpc('refresh_master_inventory')

  revalidatePath('/dashboard')
  revalidatePath('/inventory/total')
  revalidatePath('/inventory/daily')

  return { success: true, collectionId: collection.id }
}

/**
 * Get recent collections
 */
export async function getRecentCollections(limit: number = 10) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('collections')
    .select(
      `
      *,
      profile:profiles(full_name, email),
      collection_items(
        quantity,
        item:items(name, unit_type)
      )
    `
    )
    .order('submission_timestamp', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent collections:', error)
    return { collections: [], error: error.message }
  }

  return { collections: data, error: null }
}

/**
 * Get collections for a specific date
 */
export async function getCollectionsByDate(date: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('collections')
    .select(
      `
      *,
      profile:profiles(full_name, email),
      collection_items(
        quantity,
        item:items(name, unit_type, category:item_categories(name))
      )
    `
    )
    .eq('submission_date', date)
    .order('submission_timestamp', { ascending: false })

  if (error) {
    console.error('Error fetching collections by date:', error)
    return { collections: [], error: error.message }
  }

  return { collections: data, error: null }
}
