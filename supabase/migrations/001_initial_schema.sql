-- ============================================
-- MELISSA INVENTORY MANAGEMENT SYSTEM
-- Initial Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

-- Extends Supabase auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'data_entry')) DEFAULT 'data_entry',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ITEM CATEGORIES
-- ============================================

CREATE TABLE public.item_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ITEMS CATALOG
-- ============================================

CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.item_categories(id),
  unit_type TEXT DEFAULT 'units', -- units, lbs, liters, etc.
  is_active BOOLEAN DEFAULT true,
  low_stock_threshold DECIMAL(10,2) DEFAULT 10,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COLLECTIONS (DATA ENTRY)
-- ============================================

CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by UUID REFERENCES public.profiles(id),
  submission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  submission_timestamp TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, item_id) -- Prevent duplicate items in same collection
);

-- ============================================
-- DISTRIBUTION TYPES
-- ============================================

CREATE TABLE public.distribution_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  requires_recipient BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- KIT TEMPLATES (OPTIONAL)
-- ============================================

CREATE TABLE public.kit_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.kit_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_template_id UUID NOT NULL REFERENCES public.kit_templates(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(kit_template_id, item_id)
);

-- ============================================
-- WITHDRAWALS / DISTRIBUTIONS
-- ============================================

CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_type_id UUID REFERENCES public.distribution_types(id),
  kit_template_id UUID REFERENCES public.kit_templates(id), -- Optional: if using kit template
  kits_created INTEGER, -- Number of kits made (if applicable)
  withdrawn_by UUID NOT NULL REFERENCES public.profiles(id),
  withdrawal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  withdrawal_timestamp TIMESTAMPTZ DEFAULT NOW(),
  recipient TEXT, -- Church name, location, or person
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.withdrawal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_id UUID NOT NULL REFERENCES public.withdrawals(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MASTER INVENTORY (Materialized View)
-- ============================================

CREATE MATERIALIZED VIEW public.master_inventory AS
SELECT
  i.id AS item_id,
  i.name AS item_name,
  ic.name AS category_name,
  i.unit_type,
  i.low_stock_threshold,
  i.is_active,
  COALESCE(SUM(ci.quantity), 0) AS total_collected,
  COALESCE(SUM(wi.quantity), 0) AS total_withdrawn,
  COALESCE(SUM(ci.quantity), 0) - COALESCE(SUM(wi.quantity), 0) AS current_stock
FROM public.items i
LEFT JOIN public.item_categories ic ON i.category_id = ic.id
LEFT JOIN public.collection_items ci ON i.id = ci.item_id
LEFT JOIN public.withdrawal_items wi ON i.id = wi.item_id
GROUP BY i.id, i.name, ic.name, i.unit_type, i.low_stock_threshold, i.is_active;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX ON public.master_inventory (item_id);

-- ============================================
-- DAILY INVENTORY (View)
-- ============================================

CREATE VIEW public.daily_inventory AS
SELECT
  c.submission_date,
  i.id AS item_id,
  i.name AS item_name,
  ic.name AS category_name,
  i.unit_type,
  SUM(ci.quantity) AS daily_collected,
  COUNT(DISTINCT c.id) AS number_of_submissions
FROM public.collections c
JOIN public.collection_items ci ON c.id = ci.collection_id
JOIN public.items i ON ci.item_id = i.id
LEFT JOIN public.item_categories ic ON i.category_id = ic.id
WHERE i.is_active = true
GROUP BY c.submission_date, i.id, i.name, ic.name, i.unit_type
ORDER BY c.submission_date DESC, i.name;

-- ============================================
-- NOTIFICATIONS LOG
-- ============================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('daily_summary', 'new_item', 'low_stock')),
  recipient_emails TEXT[] NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOG
-- ============================================

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  entity_type TEXT NOT NULL, -- 'item', 'collection', 'withdrawal', etc.
  entity_id UUID NOT NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_items_category ON public.items(category_id);
CREATE INDEX idx_items_active ON public.items(is_active) WHERE is_active = true;
CREATE INDEX idx_collections_date ON public.collections(submission_date DESC);
CREATE INDEX idx_collections_user ON public.collections(submitted_by);
CREATE INDEX idx_collection_items_item ON public.collection_items(item_id);
CREATE INDEX idx_collection_items_collection ON public.collection_items(collection_id);
CREATE INDEX idx_withdrawals_date ON public.withdrawals(withdrawal_date DESC);
CREATE INDEX idx_withdrawals_type ON public.withdrawals(distribution_type_id);
CREATE INDEX idx_withdrawal_items_item ON public.withdrawal_items(item_id);
CREATE INDEX idx_withdrawal_items_withdrawal ON public.withdrawal_items(withdrawal_id);
CREATE INDEX idx_notifications_status ON public.notifications(status, created_at);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kit_templates_updated_at
  BEFORE UPDATE ON public.kit_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_master_inventory()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.master_inventory;
END;
$$ LANGUAGE plpgsql;

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to important tables
CREATE TRIGGER audit_items
  AFTER INSERT OR UPDATE OR DELETE ON public.items
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_withdrawals
  AFTER INSERT OR UPDATE OR DELETE ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_kit_templates
  AFTER INSERT OR UPDATE OR DELETE ON public.kit_templates
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();
