-- Migration: Add CBAJ-Only Flag to Items
--
-- Purpose: Distinguish CBAJ-specific items from regular inventory items
-- CBAJ items should only appear in Distributions/CBAJ deliveries, NOT in inventory tracking
--
-- Changes:
-- 1. Add is_cbaj_only column to items table
-- 2. Mark CBAJ-specific items as is_cbaj_only = true
-- 3. Add index for filtering
-- 4. Update master_inventory view to exclude CBAJ-only items

-- ============================================================================
-- PART 1: Add is_cbaj_only column to items table
-- ============================================================================

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS is_cbaj_only BOOLEAN DEFAULT false;

-- Add index for filtering
CREATE INDEX IF NOT EXISTS idx_items_cbaj_only ON public.items(is_cbaj_only);

COMMENT ON COLUMN public.items.is_cbaj_only IS
'Marks items that are CBAJ-only (deliveries tracking). These items should NOT appear in regular inventory tracking or collection forms.';

-- ============================================================================
-- PART 2: Mark CBAJ-specific items
-- ============================================================================

-- Update CBAJ-specific items to is_cbaj_only = true
UPDATE public.items SET is_cbaj_only = true WHERE name IN (
  'Cereal kits',
  'Food Packages',
  'Water - cases (of 24 bottles)',
  'Water - 5 Gallon',
  'Hygiene Kit Bags',
  'Women Sanitary Kits',
  'Laundry Kits Bags',
  'Mosquito Destroyer Kits',
  'Snacks Kits'
);

-- Also mark these if they exist (may have slightly different names)
UPDATE public.items SET is_cbaj_only = true WHERE name ILIKE '%cereal kit%';
UPDATE public.items SET is_cbaj_only = true WHERE name ILIKE '%food package%';
UPDATE public.items SET is_cbaj_only = true WHERE name ILIKE '%hygiene kit%';
UPDATE public.items SET is_cbaj_only = true WHERE name ILIKE '%sanitary kit%';
UPDATE public.items SET is_cbaj_only = true WHERE name ILIKE '%laundry kit%';
UPDATE public.items SET is_cbaj_only = true WHERE name ILIKE '%mosquito destroyer kit%';
UPDATE public.items SET is_cbaj_only = true WHERE name ILIKE '%snacks kit%';

-- ============================================================================
-- PART 3: Update master_inventory view to exclude CBAJ-only items
-- ============================================================================

-- Drop existing view
DROP MATERIALIZED VIEW IF EXISTS public.master_inventory;

-- Recreate with CBAJ-only filter
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
WHERE i.is_cbaj_only = false  -- EXCLUDE CBAJ-only items from inventory calculations
GROUP BY i.id, i.name, ic.name, i.unit_type, i.low_stock_threshold, i.is_active;

-- Recreate indexes
CREATE INDEX idx_master_inventory_item_id ON public.master_inventory(item_id);
CREATE INDEX idx_master_inventory_category ON public.master_inventory(category_name);
CREATE INDEX idx_master_inventory_active ON public.master_inventory(is_active);

-- Refresh the view
REFRESH MATERIALIZED VIEW public.master_inventory;

COMMENT ON MATERIALIZED VIEW public.master_inventory IS
'Master inventory view: Tracks YOUR inventory only (excludes CBAJ-only items).
Shows total_collected, total_withdrawn, and current_stock for items you actually manage.
CBAJ items are tracked separately in distributions/cbaj_deliveries tables.';

-- ============================================================================
-- PART 4: Update daily_inventory view to exclude CBAJ-only items
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.daily_inventory;

-- Recreate daily_inventory view excluding CBAJ-only items
CREATE OR REPLACE VIEW public.daily_inventory AS
SELECT
  c.submission_date,
  i.id AS item_id,
  i.name AS item_name,
  ic.name AS category_name,
  i.unit_type,
  SUM(ci.quantity) AS daily_collected
FROM public.collections c
JOIN public.collection_items ci ON c.id = ci.collection_id
JOIN public.items i ON ci.item_id = i.id
JOIN public.item_categories ic ON i.category_id = ic.id
WHERE i.is_cbaj_only = false  -- EXCLUDE CBAJ-only items
GROUP BY c.submission_date, i.id, i.name, ic.name, ic.order_index, i.unit_type
ORDER BY c.submission_date DESC, ic.order_index, i.name;

COMMENT ON VIEW public.daily_inventory IS
'Daily breakdown of collected items by submission date. Excludes CBAJ-only items.';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check which items are marked as CBAJ-only
SELECT 'CBAJ-only items:' AS status;
SELECT id, name, category_id, unit_type, is_cbaj_only
FROM public.items
WHERE is_cbaj_only = true
ORDER BY name;

-- Check master_inventory excludes CBAJ items
SELECT 'Master inventory item count (should exclude CBAJ):' AS status;
SELECT COUNT(*) AS total_items FROM public.master_inventory;

-- Compare with total items
SELECT 'Total items in items table:' AS status;
SELECT
  COUNT(*) FILTER (WHERE is_cbaj_only = false) AS regular_items,
  COUNT(*) FILTER (WHERE is_cbaj_only = true) AS cbaj_items,
  COUNT(*) AS total_items
FROM public.items;
