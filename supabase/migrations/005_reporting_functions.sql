-- ============================================
-- PHASE 5: REPORTING FUNCTIONS
-- ============================================
-- Created: November 9, 2025
-- Purpose: Add reporting and analytics functions for inventory trends

-- ============================================
-- FUNCTION: Get Daily Closing Balance
-- ============================================
-- Calculates opening balance, daily changes, and closing balance
-- for all items across a date range
--
-- Parameters:
--   start_date: Beginning of date range
--   end_date: End of date range
--   p_item_id: Optional item filter (NULL = all items)
--
-- Returns: Table with daily balance calculations per item

CREATE OR REPLACE FUNCTION get_daily_closing_balance(
  start_date DATE,
  end_date DATE,
  p_item_id UUID DEFAULT NULL
)
RETURNS TABLE (
  date DATE,
  item_id UUID,
  item_name TEXT,
  category_name TEXT,
  opening_balance NUMERIC,
  daily_collected NUMERIC,
  daily_withdrawn NUMERIC,
  closing_balance NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE date_series AS (
    -- Generate series of dates from start to end
    SELECT start_date::DATE AS date
    UNION ALL
    SELECT (date + INTERVAL '1 day')::DATE
    FROM date_series
    WHERE date < end_date
  ),
  item_list AS (
    -- Get all active items (filtered by p_item_id if provided)
    SELECT i.id, i.name, COALESCE(ic.name, 'Uncategorized') AS category_name
    FROM items i
    LEFT JOIN item_categories ic ON i.category_id = ic.id
    WHERE i.is_active = TRUE
      AND (p_item_id IS NULL OR i.id = p_item_id)
  ),
  collections_by_day AS (
    -- Sum collections per item per day
    SELECT
      c.submission_date AS date,
      ci.item_id,
      COALESCE(SUM(ci.quantity), 0) AS collected
    FROM collections c
    JOIN collection_items ci ON c.id = ci.collection_id
    WHERE c.submission_date BETWEEN start_date AND end_date
    GROUP BY c.submission_date, ci.item_id
  ),
  withdrawals_by_day AS (
    -- Sum withdrawals per item per day
    SELECT
      w.withdrawal_date::DATE AS date,
      wi.item_id,
      COALESCE(SUM(wi.quantity), 0) AS withdrawn
    FROM withdrawals w
    JOIN withdrawal_items wi ON w.id = wi.withdrawal_id
    WHERE w.withdrawal_date::DATE BETWEEN start_date AND end_date
    GROUP BY w.withdrawal_date::DATE, wi.item_id
  ),
  daily_changes AS (
    -- Combine all days and items with their daily changes
    SELECT
      ds.date,
      il.id AS item_id,
      il.name AS item_name,
      il.category_name,
      COALESCE(cbd.collected, 0) AS daily_collected,
      COALESCE(wbd.withdrawn, 0) AS daily_withdrawn
    FROM date_series ds
    CROSS JOIN item_list il
    LEFT JOIN collections_by_day cbd ON ds.date = cbd.date AND il.id = cbd.item_id
    LEFT JOIN withdrawals_by_day wbd ON ds.date = wbd.date AND il.id = wbd.item_id
  ),
  cumulative_balance AS (
    -- Calculate cumulative balance for each item
    SELECT
      dc.date,
      dc.item_id,
      dc.item_name,
      dc.category_name,
      dc.daily_collected,
      dc.daily_withdrawn,
      -- Sum all previous days to get opening balance
      (
        SELECT COALESCE(SUM(dc2.daily_collected - dc2.daily_withdrawn), 0)
        FROM daily_changes dc2
        WHERE dc2.item_id = dc.item_id AND dc2.date < dc.date
      ) AS opening_balance,
      -- Sum up to and including current day to get closing balance
      (
        SELECT COALESCE(SUM(dc2.daily_collected - dc2.daily_withdrawn), 0)
        FROM daily_changes dc2
        WHERE dc2.item_id = dc.item_id AND dc2.date <= dc.date
      ) AS closing_balance
    FROM daily_changes dc
  )
  SELECT
    cb.date,
    cb.item_id,
    cb.item_name,
    cb.category_name,
    cb.opening_balance,
    cb.daily_collected,
    cb.daily_withdrawn,
    cb.closing_balance
  FROM cumulative_balance cb
  ORDER BY cb.date DESC, cb.item_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Get Inventory Trends
-- ============================================
-- Simplified version that returns closing balance per item per day
-- Optimized for charting (less detailed than closing balance report)

CREATE OR REPLACE FUNCTION get_inventory_trends(
  start_date DATE,
  end_date DATE,
  p_item_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  date DATE,
  item_id UUID,
  item_name TEXT,
  stock_level NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE date_series AS (
    SELECT start_date::DATE AS date
    UNION ALL
    SELECT (date + INTERVAL '1 day')::DATE
    FROM date_series
    WHERE date < end_date
  ),
  item_list AS (
    SELECT i.id, i.name
    FROM items i
    WHERE i.is_active = TRUE
      AND (p_item_ids IS NULL OR i.id = ANY(p_item_ids))
  ),
  collections_cumulative AS (
    SELECT
      ci.item_id,
      c.submission_date,
      SUM(ci.quantity) AS collected
    FROM collections c
    JOIN collection_items ci ON c.id = ci.collection_id
    WHERE c.submission_date <= end_date
    GROUP BY ci.item_id, c.submission_date
  ),
  withdrawals_cumulative AS (
    SELECT
      wi.item_id,
      w.withdrawal_date::DATE AS withdrawal_date,
      SUM(wi.quantity) AS withdrawn
    FROM withdrawals w
    JOIN withdrawal_items wi ON w.id = wi.withdrawal_id
    WHERE w.withdrawal_date::DATE <= end_date
    GROUP BY wi.item_id, w.withdrawal_date::DATE
  )
  SELECT
    ds.date,
    il.id AS item_id,
    il.name AS item_name,
    (
      SELECT COALESCE(SUM(cc.collected), 0)
      FROM collections_cumulative cc
      WHERE cc.item_id = il.id AND cc.submission_date <= ds.date
    ) - (
      SELECT COALESCE(SUM(wc.withdrawn), 0)
      FROM withdrawals_cumulative wc
      WHERE wc.item_id = il.id AND wc.withdrawal_date <= ds.date
    ) AS stock_level
  FROM date_series ds
  CROSS JOIN item_list il
  WHERE ds.date >= start_date
  ORDER BY ds.date ASC, il.name;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Get Category Trends
-- ============================================
-- Aggregate inventory trends by category

CREATE OR REPLACE FUNCTION get_category_trends(
  start_date DATE,
  end_date DATE,
  p_category_id UUID DEFAULT NULL
)
RETURNS TABLE (
  date DATE,
  category_id UUID,
  category_name TEXT,
  total_stock NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE date_series AS (
    SELECT start_date::DATE AS date
    UNION ALL
    SELECT (date + INTERVAL '1 day')::DATE
    FROM date_series
    WHERE date < end_date
  ),
  category_list AS (
    SELECT ic.id, ic.name
    FROM item_categories ic
    WHERE p_category_id IS NULL OR ic.id = p_category_id
  ),
  collections_by_category AS (
    SELECT
      i.category_id,
      c.submission_date,
      SUM(ci.quantity) AS collected
    FROM collections c
    JOIN collection_items ci ON c.id = ci.collection_id
    JOIN items i ON ci.item_id = i.id
    WHERE c.submission_date <= end_date
      AND i.category_id IS NOT NULL
    GROUP BY i.category_id, c.submission_date
  ),
  withdrawals_by_category AS (
    SELECT
      i.category_id,
      w.withdrawal_date::DATE AS withdrawal_date,
      SUM(wi.quantity) AS withdrawn
    FROM withdrawals w
    JOIN withdrawal_items wi ON w.id = wi.withdrawal_id
    JOIN items i ON wi.item_id = i.id
    WHERE w.withdrawal_date::DATE <= end_date
      AND i.category_id IS NOT NULL
    GROUP BY i.category_id, w.withdrawal_date::DATE
  )
  SELECT
    ds.date,
    cl.id AS category_id,
    cl.name AS category_name,
    (
      SELECT COALESCE(SUM(cbc.collected), 0)
      FROM collections_by_category cbc
      WHERE cbc.category_id = cl.id AND cbc.submission_date <= ds.date
    ) - (
      SELECT COALESCE(SUM(wbc.withdrawn), 0)
      FROM withdrawals_by_category wbc
      WHERE wbc.category_id = cl.id AND wbc.withdrawal_date <= ds.date
    ) AS total_stock
  FROM date_series ds
  CROSS JOIN category_list cl
  WHERE ds.date >= start_date
  ORDER BY ds.date ASC, cl.name;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Index on submission_date for faster date range queries
CREATE INDEX IF NOT EXISTS idx_collections_submission_date
  ON public.collections(submission_date);

-- Index on withdrawal_date for faster date range queries
CREATE INDEX IF NOT EXISTS idx_withdrawals_withdrawal_date
  ON public.withdrawals(withdrawal_date);

-- Composite index for collection_items joins
CREATE INDEX IF NOT EXISTS idx_collection_items_item_id
  ON public.collection_items(item_id);

-- Composite index for withdrawal_items joins
CREATE INDEX IF NOT EXISTS idx_withdrawal_items_item_id
  ON public.withdrawal_items(item_id);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Allow authenticated users to execute reporting functions
GRANT EXECUTE ON FUNCTION get_daily_closing_balance(DATE, DATE, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_inventory_trends(DATE, DATE, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_category_trends(DATE, DATE, UUID) TO authenticated;
