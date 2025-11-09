-- ============================================
-- FIX: Allow users to create their own profile on first login
-- ============================================

-- Drop the restrictive admin-only insert policy
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

-- Allow users to create their own profile when they first sign in
CREATE POLICY "Users can create own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can also insert profiles (for user management)
CREATE POLICY "Admins can insert any profile"
  ON public.profiles FOR INSERT
  WITH CHECK (is_admin());
