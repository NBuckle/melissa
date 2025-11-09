/**
 * Application Constants
 */

export const APP_NAME = 'Melissa Inventory System'
export const APP_DESCRIPTION = 'Hurricane Relief Donations Hub'

export const ROLES = {
  ADMIN: 'admin',
  DATA_ENTRY: 'data_entry',
} as const

export const ITEM_CATEGORIES = [
  'Baby',
  'Bathroom',
  'First Aid',
  'Other',
  'Pantry',
] as const

export const DISTRIBUTION_TYPES = [
  'Church Delivery',
  'Package Creation',
  'Expired Goods Removal',
  'Stock Correction',
  'General Withdrawal',
] as const
