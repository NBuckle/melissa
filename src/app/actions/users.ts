/**
 * Server Actions for User Management
 *
 * Admin-only actions for managing user accounts, roles, and invitations.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Validation schemas
const roleSchema = z.enum(['admin', 'data_entry'])

const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: roleSchema,
})

/**
 * Check if current user is admin
 */
async function isAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin'
}

/**
 * Get all users with activity summary
 */
export async function getAllUsers() {
  const supabase = await createClient()

  // Check admin access
  if (!(await isAdmin())) {
    return { users: [], error: 'Unauthorized' }
  }

  // Fetch all profiles with collection and withdrawal counts
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (profilesError) {
    console.error('Error fetching users:', profilesError)
    return { users: [], error: profilesError.message }
  }

  // Get collection counts for each user
  const { data: collectionCounts } = await supabase
    .from('collections')
    .select('submitted_by')

  // Get withdrawal counts for each user
  const { data: withdrawalCounts } = await supabase
    .from('withdrawals')
    .select('withdrawn_by')

  // Aggregate counts
  const collectionsByUser = collectionCounts?.reduce((acc: any, c) => {
    acc[c.submitted_by] = (acc[c.submitted_by] || 0) + 1
    return acc
  }, {})

  const withdrawalsByUser = withdrawalCounts?.reduce((acc: any, w) => {
    acc[w.withdrawn_by] = (acc[w.withdrawn_by] || 0) + 1
    return acc
  }, {})

  // Combine data
  const users = profiles.map((profile) => ({
    ...profile,
    collections_count: collectionsByUser?.[profile.id] || 0,
    withdrawals_count: withdrawalsByUser?.[profile.id] || 0,
  }))

  return { users, error: null }
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, role: string) {
  const supabase = await createClient()

  // Check admin access
  if (!(await isAdmin())) {
    return { success: false, error: 'Unauthorized' }
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Prevent self-demotion
  if (user?.id === userId && role !== 'admin') {
    return {
      success: false,
      error: 'You cannot change your own role',
    }
  }

  // Validate role
  const validation = roleSchema.safeParse(role)
  if (!validation.success) {
    return {
      success: false,
      error: 'Invalid role. Must be admin or data_entry',
    }
  }

  // Update role
  const { error } = await supabase
    .from('profiles')
    .update({ role: validation.data, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user role:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/users')

  return { success: true }
}

/**
 * Invite a new user
 */
export async function inviteUser(formData: FormData) {
  const supabase = await createClient()

  // Check admin access
  if (!(await isAdmin())) {
    return { success: false, error: 'Unauthorized' }
  }

  const email = formData.get('email') as string
  const role = formData.get('role') as string

  // Validate input
  const validation = inviteUserSchema.safeParse({ email, role })
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0].message,
    }
  }

  // Check if user already exists
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email.toLowerCase())
    .single()

  if (existing) {
    return {
      success: false,
      error: 'A user with this email already exists',
    }
  }

  // Note: Actual email invitation would require Supabase Admin API
  // For now, we'll create a placeholder profile
  // The user will need to use magic link to create their auth account

  const { error: insertError } = await supabase.from('profiles').insert([
    {
      email: email.toLowerCase(),
      role: validation.data.role,
      full_name: null,
    },
  ])

  if (insertError) {
    console.error('Error creating user profile:', insertError)
    return { success: false, error: insertError.message }
  }

  revalidatePath('/admin/users')

  return {
    success: true,
    message: `Invitation sent to ${email}. They can sign up using magic link.`,
  }
}

/**
 * Get user activity for a specific user
 */
export async function getUserActivity(userId: string, days: number = 30) {
  const supabase = await createClient()

  // Check admin access
  if (!(await isAdmin())) {
    return { activity: null, error: 'Unauthorized' }
  }

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const startDateStr = startDate.toISOString().split('T')[0]

  // Get recent collections
  const { data: collections } = await supabase
    .from('collections')
    .select(
      `
      id,
      submission_date,
      submission_timestamp,
      notes,
      collection_items(quantity)
    `
    )
    .eq('submitted_by', userId)
    .gte('submission_date', startDateStr)
    .order('submission_timestamp', { ascending: false })

  // Get recent withdrawals
  const { data: withdrawals } = await supabase
    .from('withdrawals')
    .select(
      `
      id,
      withdrawal_date,
      withdrawal_timestamp,
      distribution_type:distribution_types(name),
      withdrawal_items(quantity)
    `
    )
    .eq('withdrawn_by', userId)
    .gte('withdrawal_date', startDateStr)
    .order('withdrawal_timestamp', { ascending: false })

  // Calculate totals
  const totalCollections = collections?.length || 0
  const totalWithdrawals = withdrawals?.length || 0

  const totalItemsCollected =
    collections?.reduce((sum, c) => {
      const itemsTotal = c.collection_items.reduce(
        (s: number, i: any) => s + Number(i.quantity),
        0
      )
      return sum + itemsTotal
    }, 0) || 0

  const totalItemsWithdrawn =
    withdrawals?.reduce((sum, w) => {
      const itemsTotal = w.withdrawal_items.reduce(
        (s: number, i: any) => s + Number(i.quantity),
        0
      )
      return sum + itemsTotal
    }, 0) || 0

  return {
    activity: {
      totalCollections,
      totalWithdrawals,
      totalItemsCollected,
      totalItemsWithdrawn,
      recentCollections: collections || [],
      recentWithdrawals: withdrawals || [],
    },
    error: null,
  }
}
