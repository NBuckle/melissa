/**
 * Class Name Utility
 *
 * Merges class names with tailwind-merge to handle conflicts.
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
