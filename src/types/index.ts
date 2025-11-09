/**
 * Custom Type Definitions
 */

export type UserRole = 'admin' | 'data_entry'

export type ItemCategory = 'Baby' | 'Bathroom' | 'First Aid' | 'Other' | 'Pantry'

export type DistributionType =
  | 'Church Delivery'
  | 'Package Creation'
  | 'Expired Goods Removal'
  | 'Stock Correction'
  | 'General Withdrawal'

export interface User {
  id: string
  email: string
  full_name?: string | null
  role: UserRole
}

export interface Item {
  id: string
  name: string
  description?: string | null
  category_id: string
  category_name?: string
  unit_type: string
  is_active: boolean
  low_stock_threshold: number
  created_at: string
  updated_at: string
}

export interface Collection {
  id: string
  submitted_by: string
  submission_date: string
  submission_timestamp: string
  notes?: string | null
  created_at: string
}

export interface CollectionItem {
  id: string
  collection_id: string
  item_id: string
  quantity: number
  created_at: string
}

export interface Withdrawal {
  id: string
  distribution_type_id?: string | null
  kit_template_id?: string | null
  kits_created?: number | null
  withdrawn_by: string
  withdrawal_date: string
  withdrawal_timestamp: string
  recipient?: string | null
  reason?: string | null
  notes?: string | null
  created_at: string
}

export interface WithdrawalItem {
  id: string
  withdrawal_id: string
  item_id: string
  quantity: number
  created_at: string
}

export interface InventorySummary {
  item_id: string
  item_name: string
  category_name: string
  unit_type: string
  low_stock_threshold: number
  is_active: boolean
  total_collected: number
  total_withdrawn: number
  current_stock: number
}
