/**
 * Login Page
 *
 * Allows users to sign in via magic link (passwordless authentication).
 */

import { MagicLinkForm } from '@/components/features/auth/magic-link-form'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  // Check if user is already logged in
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Melissa Inventory System
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Hurricane Relief Donations Hub
          </p>
        </div>

        <div className="mt-8 bg-white p-8 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-6">Sign In</h2>
          <MagicLinkForm />
        </div>

        <p className="text-center text-xs text-gray-500">
          Enter your email to receive a magic link for secure sign-in
        </p>
      </div>
    </div>
  )
}
