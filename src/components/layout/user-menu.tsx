/**
 * User Menu Component
 *
 * Displays user info and logout button.
 */

'use client'

import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface UserMenuProps {
  user: User
  profile: any
}

export function UserMenu({ user, profile }: UserMenuProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">
          {(profile as any)?.full_name || user.email}
        </p>
        <p className="text-xs text-gray-500 capitalize">{(profile as any)?.role || 'data_entry'}</p>
      </div>
      <button
        onClick={handleLogout}
        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
      >
        Sign Out
      </button>
    </div>
  )
}
