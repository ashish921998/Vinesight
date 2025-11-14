-- Warehouse Inventory Management
-- Simple inventory tracking for fertilizers and sprays

-- Create warehouse_items table
CREATE TABLE warehouse_items (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('fertilizer', 'spray')) NOT NULL,
  quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
  unit VARCHAR(20) CHECK (unit IN ('kg', 'liter', 'gram', 'ml')) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL, -- Price per unit (e.g., ₹50 per kg)
  reorder_quantity DECIMAL(12,2), -- Alert threshold for low stock
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_warehouse_items_user_id ON warehouse_items(user_id);
CREATE INDEX idx_warehouse_items_user_type ON warehouse_items(user_id, type);
CREATE INDEX idx_warehouse_items_low_stock ON warehouse_items(user_id)
  WHERE reorder_quantity IS NOT NULL AND quantity <= reorder_quantity;

-- Enable Row Level Security
ALTER TABLE warehouse_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own warehouse items"
  ON warehouse_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own warehouse items"
  ON warehouse_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own warehouse items"
  ON warehouse_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own warehouse items"
  ON warehouse_items FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_warehouse_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_warehouse_items_updated_at_trigger
  BEFORE UPDATE ON warehouse_items
  FOR EACH ROW
  EXECUTE FUNCTION update_warehouse_items_updated_at();

-- Add comment to document the table
COMMENT ON TABLE warehouse_items IS 'Inventory management for fertilizers and sprays used across farms';
COMMENT ON COLUMN warehouse_items.unit_price IS 'Price per unit (e.g., ₹50 per kg or ₹800 per liter)';
COMMENT ON COLUMN warehouse_items.reorder_quantity IS 'Stock level threshold for low stock alerts';
