-- Portion Controls (Recipe Maker) Schema
-- This schema allows creating recipes for products with or without variants

-- Portion Controls Table
-- Links to a product or product variant to create a recipe
CREATE TABLE IF NOT EXISTS portion_controls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  serving_size text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone,
  -- Ensure unique combination of product_id and variant_id
  -- If variant_id is NULL, only one recipe per product
  -- If variant_id is set, only one recipe per product-variant combination
  CONSTRAINT unique_product_recipe UNIQUE (product_id, variant_id)
);

-- Portion Control Items Table
-- Ingredients/items that make up the recipe
CREATE TABLE IF NOT EXISTS portion_control_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portion_control_id uuid NOT NULL REFERENCES portion_controls(id) ON DELETE CASCADE,
  ingredient_product_id uuid REFERENCES products(id) ON DELETE RESTRICT,
  ingredient_variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  ingredient_name text NOT NULL,
  quantity numeric(10, 3) NOT NULL CHECK (quantity > 0),
  unit text NOT NULL DEFAULT 'pcs',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_portion_controls_product_id ON portion_controls(product_id);
CREATE INDEX IF NOT EXISTS idx_portion_controls_variant_id ON portion_controls(variant_id);
CREATE INDEX IF NOT EXISTS idx_portion_controls_name ON portion_controls(name);
CREATE INDEX IF NOT EXISTS idx_portion_control_items_portion_control_id ON portion_control_items(portion_control_id);
CREATE INDEX IF NOT EXISTS idx_portion_control_items_ingredient_product_id ON portion_control_items(ingredient_product_id);
CREATE INDEX IF NOT EXISTS idx_portion_control_items_ingredient_variant_id ON portion_control_items(ingredient_variant_id);

-- Comments for documentation
COMMENT ON TABLE portion_controls IS 'Recipes/portion controls for products with or without variants';
COMMENT ON COLUMN portion_controls.product_id IS 'The product this recipe is for';
COMMENT ON COLUMN portion_controls.variant_id IS 'The variant this recipe is for (NULL if recipe is for base product)';
COMMENT ON COLUMN portion_controls.name IS 'Name of the recipe/portion control';
COMMENT ON COLUMN portion_controls.serving_size IS 'Serving size description (e.g., "1 serving", "1 portion")';

COMMENT ON TABLE portion_control_items IS 'Ingredients/items that make up a recipe';
COMMENT ON COLUMN portion_control_items.ingredient_product_id IS 'Product used as ingredient (optional, can use ingredient_name instead)';
COMMENT ON COLUMN portion_control_items.ingredient_variant_id IS 'Variant used as ingredient (optional, must have ingredient_product_id if set)';
COMMENT ON COLUMN portion_control_items.ingredient_name IS 'Name of the ingredient (required, can be product name or custom name)';
COMMENT ON COLUMN portion_control_items.quantity IS 'Quantity of the ingredient needed';
COMMENT ON COLUMN portion_control_items.unit IS 'Unit of measurement (e.g., "pcs", "kg", "g", "ml", "l")';

