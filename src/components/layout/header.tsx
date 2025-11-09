/**
 * Header Component
 *
 * Top navigation bar with app title and user menu.
 */

import { User } from '@supabase/supabase-js'
import { UserMenu } from './user-menu'

interface HeaderProps {
  user: User
  profile: any
}

export function Header({ user, profile }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Melissa Inventory System
          </h1>
          <p className="text-sm text-gray-500">Hurricane Relief Donations Hub</p>
        </div>
        <UserMenu user={user} profile={profile} />
      </div>
    </header>
  )
}
