-- ============================================
-- SEED DATA
-- ============================================

-- ============================================
-- ITEM CATEGORIES
-- ============================================

INSERT INTO public.item_categories (name, order_index) VALUES
('Baby', 1),
('Bathroom', 2),
('First Aid', 3),
('Other', 4),
('Pantry', 5);

-- ============================================
-- DISTRIBUTION TYPES
-- ============================================

INSERT INTO public.distribution_types (name, requires_recipient) VALUES
('Church Delivery', true),
('Package Creation', false),
('Expired Goods Removal', false),
('Stock Correction', false),
('General Withdrawal', true);

-- ============================================
-- ITEMS (from Google Sheets data)
-- ============================================

-- Baby Items
INSERT INTO public.items (name, category_id, unit_type, low_stock_threshold)
SELECT 'Baby Diapers', id, 'units', 50 FROM public.item_categories WHERE name = 'Baby'
UNION ALL
SELECT 'Baby formula', id, 'units', 10 FROM public.item_categories WHERE name = 'Baby'
UNION ALL
SELECT 'Baby wipes', id, 'units', 20 FROM public.item_categories WHERE name = 'Baby';

-- Bathroom Items
INSERT INTO public.items (name, category_id, unit_type, low_stock_threshold)
SELECT 'Deodorant', id, 'units', 10 FROM public.item_categories WHERE name = 'Bathroom'
UNION ALL
SELECT 'toothbrushes', id, 'units', 20 FROM public.item_categories WHERE name = 'Bathroom'
UNION ALL
SELECT 'Toothpaste', id, 'units', 20 FROM public.item_categories WHERE name = 'Bathroom'
UNION ALL
SELECT 'liquid body wash', id, 'units', 5 FROM public.item_categories WHERE name = 'Bathroom'
UNION ALL
SELECT 'Soap bars', id, 'units', 50 FROM public.item_categories WHERE name = 'Bathroom'
UNION ALL
SELECT 'Toilet paper rolls', id, 'units', 100 FROM public.item_categories WHERE name = 'Bathroom'
UNION ALL
SELECT 'Toiletries (general)', id, 'units', 20 FROM public.item_categories WHERE name = 'Bathroom';

-- First Aid
INSERT INTO public.items (name, category_id, unit_type, low_stock_threshold)
SELECT 'First Aid', id, 'units', 10 FROM public.item_categories WHERE name = 'First Aid'
UNION ALL
SELECT 'bandages', id, 'units', 10 FROM public.item_categories WHERE name = 'First Aid';

-- Other Items
INSERT INTO public.items (name, category_id, unit_type, low_stock_threshold)
SELECT 'Adult pads', id, 'units', 10 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'batteries', id, 'units', 20 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Bleach', id, 'units', 5 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Buckets', id, 'units', 5 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Candles', id, 'units', 50 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Dettol', id, 'units', 5 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Dishwashing Liquid', id, 'units', 5 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Disposable Forks (Pack)', id, 'packs', 10 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Disposable Knives (Pack)', id, 'packs', 5 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Disposable Lunch Boxes', id, 'units', 20 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Disposable Plate (Pack)', id, 'packs', 10 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Disposable Spoons (Pack)', id, 'packs', 10 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Flashlight', id, 'units', 5 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Garbage bags', id, 'units', 30 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Gloves', id, 'pairs', 10 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Matches', id, 'boxes', 10 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Miscellaneous', id, 'units', 0 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Mosquito Destroyer', id, 'units', 20 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Panadol/Tylenol', id, 'units', 5 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Pre Pkg - Baby Kit', id, 'kits', 10 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Pre Pkg - Sanitary', id, 'kits', 10 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Pre Pkg - Food Kit', id, 'kits', 50 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Sanitary pads (pk)', id, 'packs', 50 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Soap Laundry detergent', id, 'units', 10 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Tarpaulin 14*16', id, 'units', 5 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Tarpaulin 18*24', id, 'units', 5 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Tarpaulin 20*20', id, 'units', 5 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Tarpaulins 14*14', id, 'units', 5 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Tarpaulins 8*10', id, 'units', 5 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Hand Towels Rolls', id, 'units', 10 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'washcloths', id, 'units', 20 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Water Storage Container', id, 'units', 5 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Water Tablets', id, 'units', 10 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Ziplock bags', id, 'packs', 5 FROM public.item_categories WHERE name = 'Other'
UNION ALL
SELECT 'Resuables water bottles', id, 'units', 5 FROM public.item_categories WHERE name = 'Other';

-- Pantry Items
INSERT INTO public.items (name, category_id, unit_type, low_stock_threshold)
SELECT 'Beans', id, 'cans', 20 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Bottle Water 20L', id, 'units', 5 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Bottle Water 5L', id, 'units', 10 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Bottled Water 1.5L (Medium)', id, 'units', 50 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Bottled Water 16oz', id, 'units', 200 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Bottled Water 1L', id, 'units', 50 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Cereal', id, 'boxes', 10 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Condense Milk', id, 'cans', 10 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Cooking oil', id, 'bottles', 20 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Corned Beef (Large)', id, 'cans', 30 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Corned Beef (small)', id, 'cans', 50 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Cornmeal (lbs)', id, 'lbs', 50 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Crackers (Cream)', id, 'packs', 20 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Crackers (Tough) Family LG', id, 'packs', 15 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Crackers (Tough) Regular', id, 'packs', 15 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Cup Soup', id, 'units', 30 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Disposable Cups (Pack)', id, 'packs', 20 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Drink Mix', id, 'packs', 10 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Flour (lbs)', id, 'lbs', 50 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Instant Chocolate Tea - Milo pk', id, 'packs', 30 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Juices & Sodas', id, 'units', 30 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Mac n Cheese', id, 'boxes', 10 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Mackerel (Large)', id, 'cans', 40 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Mackerel (Medium)', id, 'cans', 20 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Mackerel (small)', id, 'cans', 100 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Milk (large)', id, 'units', 5 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Milk (small)', id, 'units', 5 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Mixed Vegetables Can', id, 'cans', 15 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Noodles - Ramen', id, 'packs', 30 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Oats (pk)', id, 'packs', 20 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Pasta', id, 'packs', 15 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Peas - Red Peas Pack', id, 'packs', 10 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Peas Can', id, 'cans', 10 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Porridge Mix', id, 'packs', 15 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Powdered milk (Lasco)', id, 'packs', 50 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Rice (lbs)', id, 'lbs', 100 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Salt (pk)', id, 'packs', 10 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Sardine', id, 'cans', 100 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Seasonings', id, 'units', 10 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Snacks/Biscuits/Chips', id, 'units', 50 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Soup Mix (or Chicken Noodle)', id, 'packs', 25 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Sugar (lbs)', id, 'lbs', 50 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Tea Bag', id, 'bags', 100 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Tea Bags Box', id, 'boxes', 10 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Tin Food (miscellaneous)', id, 'cans', 10 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Tuna & Salmon', id, 'cans', 50 FROM public.item_categories WHERE name = 'Pantry'
UNION ALL
SELECT 'Vienna Sausage', id, 'cans', 50 FROM public.item_categories WHERE name = 'Pantry';

-- ============================================
-- EXAMPLE KIT TEMPLATES
-- ============================================

-- Food Care Bag kit (based on Google Sheets PACKAGES MADE data)
INSERT INTO public.kit_templates (name, description)
VALUES ('Food Care Bag', 'Rice, Flour, Cornmeal, sugar (@2lbs each) + Sardine, mackerel, sausage (@ 2 tins) + Corned beef @1, + 1 Noodle soup pk + Cooking Oil + 1 Toilet paper');

-- Get the kit template ID and add items
WITH food_kit AS (
  SELECT id FROM public.kit_templates WHERE name = 'Food Care Bag'
)
INSERT INTO public.kit_template_items (kit_template_id, item_id, quantity)
SELECT
  (SELECT id FROM food_kit),
  i.id,
  CASE i.name
    WHEN 'Rice (lbs)' THEN 2
    WHEN 'Flour (lbs)' THEN 2
    WHEN 'Cornmeal (lbs)' THEN 2
    WHEN 'Sugar (lbs)' THEN 2
    WHEN 'Sardine' THEN 2
    WHEN 'Mackerel (small)' THEN 2
    WHEN 'Vienna Sausage' THEN 2
    WHEN 'Corned Beef (small)' THEN 1
    WHEN 'Soup Mix (or Chicken Noodle)' THEN 1
    WHEN 'Cooking oil' THEN 1
    WHEN 'Toilet paper rolls' THEN 1
  END as quantity
FROM public.items i
WHERE i.name IN (
  'Rice (lbs)', 'Flour (lbs)', 'Cornmeal (lbs)', 'Sugar (lbs)',
  'Sardine', 'Mackerel (small)', 'Vienna Sausage', 'Corned Beef (small)',
  'Soup Mix (or Chicken Noodle)', 'Cooking oil', 'Toilet paper rolls'
);

-- Baby Care Kit
INSERT INTO public.kit_templates (name, description)
VALUES ('Baby Care Kit', 'Diapers + Wipes + Formula (or another baby product available)');

WITH baby_kit AS (
  SELECT id FROM public.kit_templates WHERE name = 'Baby Care Kit'
)
INSERT INTO public.kit_template_items (kit_template_id, item_id, quantity)
SELECT
  (SELECT id FROM baby_kit),
  i.id,
  CASE i.name
    WHEN 'Baby Diapers' THEN 1
    WHEN 'Baby wipes' THEN 1
    WHEN 'Baby formula' THEN 1
  END as quantity
FROM public.items i
WHERE i.name IN ('Baby Diapers', 'Baby wipes', 'Baby formula');

-- Women Sanitary Kit
INSERT INTO public.kit_templates (name, description)
VALUES ('Women Sanitary Kit', 'Sanitary pads + bar soap');

WITH sanitary_kit AS (
  SELECT id FROM public.kit_templates WHERE name = 'Women Sanitary Kit'
)
INSERT INTO public.kit_template_items (kit_template_id, item_id, quantity)
SELECT
  (SELECT id FROM sanitary_kit),
  i.id,
  CASE i.name
    WHEN 'Sanitary pads (pk)' THEN 1
    WHEN 'Soap bars' THEN 1
  END as quantity
FROM public.items i
WHERE i.name IN ('Sanitary pads (pk)', 'Soap bars');

-- Hygiene Kit
INSERT INTO public.kit_templates (name, description)
VALUES ('Hygiene Kit', 'Toothbrush + toothpaste + soap');

WITH hygiene_kit AS (
  SELECT id FROM public.kit_templates WHERE name = 'Hygiene Kit'
)
INSERT INTO public.kit_template_items (kit_template_id, item_id, quantity)
SELECT
  (SELECT id FROM hygiene_kit),
  i.id,
  CASE i.name
    WHEN 'toothbrushes' THEN 1
    WHEN 'Toothpaste' THEN 1
    WHEN 'Soap bars' THEN 1
  END as quantity
FROM public.items i
WHERE i.name IN ('toothbrushes', 'Toothpaste', 'Soap bars');

-- Laundry Kit
INSERT INTO public.kit_templates (name, description)
VALUES ('Laundry Kit', 'Washing soap + brush or cake soap');

WITH laundry_kit AS (
  SELECT id FROM public.kit_templates WHERE name = 'Laundry Kit'
)
INSERT INTO public.kit_template_items (kit_template_id, item_id, quantity)
SELECT
  (SELECT id FROM laundry_kit),
  i.id,
  1 as quantity
FROM public.items i
WHERE i.name IN ('Soap Laundry detergent');
