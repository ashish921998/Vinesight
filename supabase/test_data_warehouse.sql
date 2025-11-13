-- Test Data for Warehouse Feature
-- Run this AFTER applying the main migration
-- This creates sample warehouse items for testing

-- Note: Replace 'YOUR_USER_ID' with your actual Supabase user ID
-- You can get it from: SELECT auth.uid() in SQL Editor when logged in

-- Sample Fertilizers
INSERT INTO warehouse_items (user_id, name, type, quantity, unit, unit_price, reorder_quantity, notes)
VALUES
  (auth.uid(), 'NPK 19:19:19', 'fertilizer', 100, 'kg', 50, 20, 'General purpose fertilizer'),
  (auth.uid(), 'DAP (Di-Ammonium Phosphate)', 'fertilizer', 75, 'kg', 60, 30, 'High phosphorus fertilizer'),
  (auth.uid(), 'Urea', 'fertilizer', 15, 'kg', 25, 20, 'Low stock - need to reorder'),
  (auth.uid(), 'Potash (Muriate of Potash)', 'fertilizer', 50, 'kg', 45, 25, 'Potassium supplement'),
  (auth.uid(), 'Calcium Nitrate', 'fertilizer', 30, 'liter', 80, 10, 'Liquid fertilizer for fertigation');

-- Sample Sprays/Pesticides
INSERT INTO warehouse_items (user_id, name, type, quantity, unit, unit_price, reorder_quantity, notes)
VALUES
  (auth.uid(), 'Imidacloprid 17.8% SL', 'spray', 5, 'liter', 800, 2, 'Insecticide for aphids and thrips'),
  (auth.uid(), 'Mancozeb 75% WP', 'spray', 3, 'kg', 450, 2, 'Fungicide for downy mildew'),
  (auth.uid(), 'Sulfur 80% WDG', 'spray', 10, 'kg', 350, 5, 'Fungicide and acaricide'),
  (auth.uid(), 'Lambda Cyhalothrin', 'spray', 2, 'liter', 1200, 1, 'Broad spectrum insecticide'),
  (auth.uid(), 'Copper Oxychloride', 'spray', 8, 'kg', 280, 3, 'Fungicide and bactericide');

-- Verify insertion
SELECT
  name,
  type,
  quantity,
  unit,
  unit_price,
  CASE
    WHEN reorder_quantity IS NOT NULL AND quantity <= reorder_quantity THEN 'LOW STOCK'
    ELSE 'OK'
  END as stock_status
FROM warehouse_items
ORDER BY type, name;
