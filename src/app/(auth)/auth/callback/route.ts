/**
 * Auth Callback Route Handler
 *
 * Handles the callback after user clicks magic link in their email.
 * Creates user profile if it doesn't exist.
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  const redirectedFrom = requestUrl.searchParams.get('redirectedFrom') || '/dashboard'

  if (code) {
    const supabase = await createClient()

    // Exchange code for session
    await supabase.auth.exchangeCodeForSession(code)

    // Get user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      // Create profile if it doesn't exist
      if (!profile) {
        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || null,
          role: 'data_entry', // Default role
        })
      }
    }
  }

  // Redirect to the page they were trying to access or dashboard
  return NextResponse.redirect(`${origin}${redirectedFrom}`)
}
