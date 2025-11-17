-- Migration 008 (FIXED): Restructure Withdrawals System
--
-- This version handles the case where distributions table already exists but is empty
-- Run this instead of the original 008 migration
--
-- Changes:
-- 1. Update master_inventory to EXCLUDE current withdrawal_items (CBAJ distributions)
-- 2. Rename withdrawals → distributions (table + related objects)
-- 3. Create new actual_withdrawals table for YOUR inventory subtractions
-- 4. Add receipt_date to collections table

-- ============================================================================
-- PART 1: Clean up partial migration - Drop empty distributions table
-- ============================================================================

DROP TABLE IF EXISTS public.distributions CASCADE;

-- ============================================================================
-- PART 2: Update master_inventory view (exclude current withdrawal_items)
-- ============================================================================

-- Drop the existing materialized view
DROP MATERIALIZED VIEW IF EXISTS public.master_inventory;

-- Recreate without withdrawal_items (CBAJ distributions don't affect OUR inventory)
CREATE MATERIALIZED VIEW public.master_inventory AS
SELECT
  i.id AS item_id,
  i.name AS item_name,
  ic.name AS category_name,
  i.unit_type,
  i.low_stock_threshold,
  i.is_active,
  COALESCE(SUM(ci.quantity), 0) AS total_collected,
  0 AS total_withdrawn,  -- Temporarily 0, will be updated when actual_withdrawals is created
  COALESCE(SUM(ci.quantity), 0) AS current_stock  -- For now, stock = collected
FROM public.items i
LEFT JOIN public.item_categories ic ON i.category_id = ic.id
LEFT JOIN public.collection_items ci ON i.id = ci.item_id
GROUP BY i.id, i.name, ic.name, i.unit_type, i.low_stock_threshold, i.is_active;

-- Recreate indexes
CREATE INDEX idx_master_inventory_item_id ON public.master_inventory(item_id);
CREATE INDEX idx_master_inventory_category ON public.master_inventory(category_name);
CREATE INDEX idx_master_inventory_active ON public.master_inventory(is_active);

-- Refresh the view
REFRESH MATERIALIZED VIEW public.master_inventory;

COMMENT ON MATERIALIZED VIEW public.master_inventory IS
'Master inventory view showing total collected and stock levels.
Excludes CBAJ distributions (old withdrawals table).
Will include actual_withdrawals once that table is created.';

-- ============================================================================
-- PART 3: Rename withdrawals → distributions
-- ============================================================================

-- Rename main table
ALTER TABLE public.withdrawals RENAME TO distributions;

-- Rename withdrawal_items → distribution_items
ALTER TABLE public.withdrawal_items RENAME TO distribution_items;

-- Update foreign key column name in distribution_items
ALTER TABLE public.distribution_items
  RENAME COLUMN withdrawal_id TO distribution_id;

-- Update constraint names (drop and recreate)
ALTER TABLE public.distribution_items
  DROP CONSTRAINT IF EXISTS withdrawal_items_withdrawal_id_fkey;

ALTER TABLE public.distribution_items
  ADD CONSTRAINT distribution_items_distribution_id_fkey
  FOREIGN KEY (distribution_id) REFERENCES public.distributions(id) ON DELETE CASCADE;

-- Rename indexes
DROP INDEX IF EXISTS idx_withdrawals_date;
DROP INDEX IF EXISTS idx_withdrawals_type;
DROP INDEX IF EXISTS idx_withdrawal_items_item;
DROP INDEX IF EXISTS idx_withdrawal_items_withdrawal;

CREATE INDEX idx_distributions_date ON public.distributions(withdrawal_date DESC);
CREATE INDEX idx_distributions_type ON public.distributions(distribution_type_id);
CREATE INDEX idx_distribution_items_item ON public.distribution_items(item_id);
CREATE INDEX idx_distribution_items_distribution ON public.distribution_items(distribution_id);

-- Update column names in distributions table to be more appropriate
ALTER TABLE public.distributions
  RENAME COLUMN withdrawal_date TO distribution_date;

ALTER TABLE public.distributions
  RENAME COLUMN withdrawal_timestamp TO distribution_timestamp;

ALTER TABLE public.distributions
  RENAME COLUMN withdrawn_by TO distributed_by;

-- Add comment
COMMENT ON TABLE public.distributions IS
'Distributions table - tracks CBAJ and other external distributions.
This is for record-keeping only and does NOT affect inventory calculations.';

COMMENT ON TABLE public.distribution_items IS
'Items included in distributions. These do NOT subtract from inventory.';

-- ============================================================================
-- PART 4: Create actual_withdrawals table for YOUR giveaways
-- ============================================================================

-- Create actual_withdrawals table
CREATE TABLE IF NOT EXISTS public.actual_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawn_by UUID REFERENCES public.profiles(id),
  withdrawal_date DATE NOT NULL,
  withdrawal_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  recipient TEXT,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create actual_withdrawal_items table
CREATE TABLE IF NOT EXISTS public.actual_withdrawal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_id UUID REFERENCES public.actual_withdrawals(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id),
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_actual_withdrawals_date ON public.actual_withdrawals(withdrawal_date DESC);
CREATE INDEX IF NOT EXISTS idx_actual_withdrawals_user ON public.actual_withdrawals(withdrawn_by);
CREATE INDEX IF NOT EXISTS idx_actual_withdrawal_items_withdrawal ON public.actual_withdrawal_items(withdrawal_id);
CREATE INDEX IF NOT EXISTS idx_actual_withdrawal_items_item ON public.actual_withdrawal_items(item_id);

-- Add comments
COMMENT ON TABLE public.actual_withdrawals IS
'Actual withdrawals from OUR inventory. These subtract from stock and are used in master_inventory calculations.';

COMMENT ON TABLE public.actual_withdrawal_items IS
'Items withdrawn from OUR inventory. These quantities are subtracted from current_stock.';

-- ============================================================================
-- PART 5: Update master_inventory to include actual_withdrawals
-- ============================================================================

-- Drop and recreate with actual_withdrawals
DROP MATERIALIZED VIEW public.master_inventory;

CREATE MATERIALIZED VIEW public.master_inventory AS
SELECT
  i.id AS item_id,
  i.name AS item_name,
  ic.name AS category_name,
  i.unit_type,
  i.low_stock_threshold,
  i.is_active,
  COALESCE(SUM(ci.quantity), 0) AS total_collected,
  COALESCE(SUM(awi.quantity), 0) AS total_withdrawn,
  COALESCE(SUM(ci.quantity), 0) - COALESCE(SUM(awi.quantity), 0) AS current_stock
FROM public.items i
LEFT JOIN public.item_categories ic ON i.category_id = ic.id
LEFT JOIN public.collection_items ci ON i.id = ci.item_id
LEFT JOIN public.actual_withdrawal_items awi ON i.id = awi.item_id
GROUP BY i.id, i.name, ic.name, i.unit_type, i.low_stock_threshold, i.is_active;

-- Recreate indexes
CREATE INDEX idx_master_inventory_item_id ON public.master_inventory(item_id);
CREATE INDEX idx_master_inventory_category ON public.master_inventory(category_name);
CREATE INDEX idx_master_inventory_active ON public.master_inventory(is_active);

-- Refresh the view
REFRESH MATERIALIZED VIEW public.master_inventory;

COMMENT ON MATERIALIZED VIEW public.master_inventory IS
'Master inventory view: total_collected from collections, total_withdrawn from actual_withdrawals.
Excludes distributions (CBAJ) - those are tracked separately for record-keeping only.';

-- ============================================================================
-- PART 6: Add receipt_date to collections table
-- ============================================================================

-- Add receipt_date column (nullable for existing data)
ALTER TABLE public.collections
  ADD COLUMN IF NOT EXISTS receipt_date DATE;

-- Create index for querying by receipt date
CREATE INDEX IF NOT EXISTS idx_collections_receipt_date
  ON public.collections(receipt_date);

-- Set receipt_date = submission_date for existing records
UPDATE public.collections
SET receipt_date = submission_date
WHERE receipt_date IS NULL;

-- Add comment
COMMENT ON COLUMN public.collections.receipt_date IS
'Date when items were actually received (may differ from submission_date which is when they were recorded in the system)';

-- ============================================================================
-- PART 7: Update RLS policies for new tables
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.actual_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actual_withdrawal_items ENABLE ROW LEVEL SECURITY;

-- Policies for actual_withdrawals (admin only can create/update/delete)
DROP POLICY IF EXISTS "Authenticated users can read actual withdrawals" ON public.actual_withdrawals;
CREATE POLICY "Authenticated users can read actual withdrawals"
  ON public.actual_withdrawals FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can create actual withdrawals" ON public.actual_withdrawals;
CREATE POLICY "Admins can create actual withdrawals"
  ON public.actual_withdrawals FOR INSERT
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can update actual withdrawals" ON public.actual_withdrawals;
CREATE POLICY "Admins can update actual withdrawals"
  ON public.actual_withdrawals FOR UPDATE
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can delete actual withdrawals" ON public.actual_withdrawals;
CREATE POLICY "Admins can delete actual withdrawals"
  ON public.actual_withdrawals FOR DELETE
  USING (is_admin());

-- Policies for actual_withdrawal_items (admin only can create/update/delete)
DROP POLICY IF EXISTS "Authenticated users can read actual withdrawal items" ON public.actual_withdrawal_items;
CREATE POLICY "Authenticated users can read actual withdrawal items"
  ON public.actual_withdrawal_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can create actual withdrawal items" ON public.actual_withdrawal_items;
CREATE POLICY "Admins can create actual withdrawal items"
  ON public.actual_withdrawal_items FOR INSERT
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can update actual withdrawal items" ON public.actual_withdrawal_items;
CREATE POLICY "Admins can update actual withdrawal items"
  ON public.actual_withdrawal_items FOR UPDATE
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can delete actual withdrawal items" ON public.actual_withdrawal_items;
CREATE POLICY "Admins can delete actual withdrawal items"
  ON public.actual_withdrawal_items FOR DELETE
  USING (is_admin());

-- Update RLS policies for distributions (renamed from withdrawals)
-- Drop old policies
DROP POLICY IF EXISTS "Authenticated users can read withdrawals" ON public.distributions;
DROP POLICY IF EXISTS "Admins can create withdrawals" ON public.distributions;
DROP POLICY IF EXISTS "Admins can update withdrawals" ON public.distributions;
DROP POLICY IF EXISTS "Admins can delete withdrawals" ON public.distributions;

-- Create new policies with updated names
CREATE POLICY "Authenticated users can read distributions"
  ON public.distributions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can create distributions"
  ON public.distributions FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update distributions"
  ON public.distributions FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete distributions"
  ON public.distributions FOR DELETE
  USING (is_admin());

-- Update policies for distribution_items
DROP POLICY IF EXISTS "Authenticated users can read withdrawal items" ON public.distribution_items;
DROP POLICY IF EXISTS "Admins can insert withdrawal items" ON public.distribution_items;
DROP POLICY IF EXISTS "Admins can update withdrawal items" ON public.distribution_items;
DROP POLICY IF EXISTS "Admins can delete withdrawal items" ON public.distribution_items;

CREATE POLICY "Authenticated users can read distribution items"
  ON public.distribution_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can create distribution items"
  ON public.distribution_items FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update distribution items"
  ON public.distribution_items FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete distribution items"
  ON public.distribution_items FOR DELETE
  USING (is_admin());

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables exist
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('distributions', 'distribution_items', 'actual_withdrawals', 'actual_withdrawal_items')
ORDER BY tablename;
