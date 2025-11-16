/**
 * App Layout
 *
 * Main layout for authenticated application routes.
 * Includes navigation and user info.
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Navigation } from '@/components/layout/navigation'
import { ToastProvider } from '@/components/providers/toast-provider'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Get user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastProvider />
      <Header user={user} profile={profile} />
      <div className="flex">
        <Navigation role={(profile as any)?.role || 'data_entry'} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
