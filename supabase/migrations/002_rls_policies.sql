-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kit_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kit_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTION: Check if user is admin
-- ============================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (is_admin());

-- Admins can update any profile
CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE
  USING (is_admin());

-- Admins can insert profiles
CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (is_admin());

-- ============================================
-- ITEM CATEGORIES POLICIES
-- ============================================

-- Anyone authenticated can read categories
CREATE POLICY "Anyone authenticated can read categories"
  ON public.item_categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins can manage categories
CREATE POLICY "Admins can manage categories"
  ON public.item_categories FOR ALL
  USING (is_admin());

-- ============================================
-- ITEMS POLICIES
-- ============================================

-- Everyone can read active items
CREATE POLICY "Anyone authenticated can read active items"
  ON public.items FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- Admins can read all items (including inactive)
CREATE POLICY "Admins can read all items"
  ON public.items FOR SELECT
  USING (is_admin());

-- Authenticated users can create items (dynamic item addition)
CREATE POLICY "Authenticated users can create items"
  ON public.items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can update/delete items
CREATE POLICY "Admins can update items"
  ON public.items FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete items"
  ON public.items FOR DELETE
  USING (is_admin());

-- ============================================
-- COLLECTIONS POLICIES
-- ============================================

-- Users can create collections
CREATE POLICY "Authenticated users can create collections"
  ON public.collections FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can read their own collections
CREATE POLICY "Users can read own collections"
  ON public.collections FOR SELECT
  USING (submitted_by = auth.uid());

-- Admins can read all collections
CREATE POLICY "Admins can read all collections"
  ON public.collections FOR SELECT
  USING (is_admin());

-- Admins can delete collections
CREATE POLICY "Admins can delete collections"
  ON public.collections FOR DELETE
  USING (is_admin());

-- ============================================
-- COLLECTION ITEMS POLICIES
-- ============================================

-- Users can insert collection items for their collections
CREATE POLICY "Users can insert collection items"
  ON public.collection_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE id = collection_id AND submitted_by = auth.uid()
    )
  );

-- Users can read their own collection items
CREATE POLICY "Users can read own collection items"
  ON public.collection_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE id = collection_id AND submitted_by = auth.uid()
    )
  );

-- Admins can read all collection items
CREATE POLICY "Admins can read all collection items"
  ON public.collection_items FOR SELECT
  USING (is_admin());

-- ============================================
-- DISTRIBUTION TYPES POLICIES
-- ============================================

-- Anyone authenticated can read distribution types
CREATE POLICY "Anyone authenticated can read distribution types"
  ON public.distribution_types FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins can manage distribution types
CREATE POLICY "Admins can manage distribution types"
  ON public.distribution_types FOR ALL
  USING (is_admin());

-- ============================================
-- KIT TEMPLATES POLICIES
-- ============================================

-- Anyone authenticated can read active kit templates
CREATE POLICY "Anyone authenticated can read active kits"
  ON public.kit_templates FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- Admins can read all kit templates
CREATE POLICY "Admins can read all kits"
  ON public.kit_templates FOR SELECT
  USING (is_admin());

-- Admins can manage kit templates
CREATE POLICY "Admins can manage kits"
  ON public.kit_templates FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update kits"
  ON public.kit_templates FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete kits"
  ON public.kit_templates FOR DELETE
  USING (is_admin());

-- ============================================
-- KIT TEMPLATE ITEMS POLICIES
-- ============================================

-- Anyone authenticated can read kit template items
CREATE POLICY "Anyone authenticated can read kit items"
  ON public.kit_template_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins can manage kit template items
CREATE POLICY "Admins can manage kit items"
  ON public.kit_template_items FOR ALL
  USING (is_admin());

-- ============================================
-- WITHDRAWALS POLICIES
-- ============================================

-- Admins can create withdrawals
CREATE POLICY "Admins can create withdrawals"
  ON public.withdrawals FOR INSERT
  WITH CHECK (is_admin());

-- Everyone can read withdrawals (for transparency)
CREATE POLICY "Authenticated users can read withdrawals"
  ON public.withdrawals FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins can update/delete withdrawals
CREATE POLICY "Admins can update withdrawals"
  ON public.withdrawals FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete withdrawals"
  ON public.withdrawals FOR DELETE
  USING (is_admin());

-- ============================================
-- WITHDRAWAL ITEMS POLICIES
-- ============================================

-- Admins can insert withdrawal items
CREATE POLICY "Admins can insert withdrawal items"
  ON public.withdrawal_items FOR INSERT
  WITH CHECK (is_admin());

-- Everyone can read withdrawal items
CREATE POLICY "Authenticated users can read withdrawal items"
  ON public.withdrawal_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins can update/delete withdrawal items
CREATE POLICY "Admins can update withdrawal items"
  ON public.withdrawal_items FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete withdrawal items"
  ON public.withdrawal_items FOR DELETE
  USING (is_admin());

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs"
  ON public.audit_logs FOR SELECT
  USING (is_admin());

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

-- Only admins can read notifications
CREATE POLICY "Admins can read notifications"
  ON public.notifications FOR SELECT
  USING (is_admin());

-- System can insert notifications (for background jobs)
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);
