-- ============================================
-- WITHDRAWAL BREAKDOWNS TABLE
-- ============================================
-- Stores detailed breakdown of withdrawals by giveaway/reason
-- Data sourced from Master Inventory Google Sheet

CREATE TABLE IF NOT EXISTS public.withdrawal_breakdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  giveaway_name TEXT NOT NULL, -- e.g., "Packed OUT Tues Nov 4", "Expired Goods removed 5/11/25"
  quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
  giveaway_date DATE, -- Extracted from giveaway_name if possible
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_withdrawal_breakdowns_item_id
  ON public.withdrawal_breakdowns(item_id);

-- Enable RLS
ALTER TABLE public.withdrawal_breakdowns ENABLE ROW LEVEL SECURITY;

-- RLS Policies (read-only for authenticated users)
CREATE POLICY "Allow authenticated users to view withdrawal breakdowns"
  ON public.withdrawal_breakdowns
  FOR SELECT
  TO authenticated
  USING (true);
