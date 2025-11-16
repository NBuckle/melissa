-- ============================================
-- CBAJ DELIVERIES TABLE - UPDATE
-- ============================================
-- Add parish column to existing table

-- Add parish column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cbaj_deliveries' AND column_name = 'parish'
  ) THEN
    ALTER TABLE public.cbaj_deliveries ADD COLUMN parish TEXT;
  END IF;
END $$;
