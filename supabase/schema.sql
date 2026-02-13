-- Complete POS System Schema for Supabase
-- Generated for importing to new Supabase instance

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone
);

-- Indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Comments
COMMENT ON TABLE categories IS 'Product categories for organizing menu items';
COMMENT ON COLUMN categories.name IS 'Category name';
COMMENT ON COLUMN categories.description IS 'Optional category description';

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  sku text,
  price numeric(10, 2),
  stock numeric(10, 2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone
);

-- Indexes for products
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Comments
COMMENT ON TABLE products IS 'Menu products/items available for sale';
COMMENT ON COLUMN products.category_id IS 'Foreign key to categories table';
COMMENT ON COLUMN products.sku IS 'Stock Keeping Unit identifier';
COMMENT ON COLUMN products.price IS 'Product price';
COMMENT ON COLUMN products.stock IS 'Current stock quantity';
COMMENT ON COLUMN products.is_active IS 'Whether the product is available for ordering';

-- ============================================
-- PRODUCT VARIANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(10, 2),
  stock numeric(10, 2) DEFAULT 0,
  sku text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone
);

-- Indexes for product variants
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_name ON product_variants(name);

-- Comments
COMMENT ON TABLE product_variants IS 'Variants of products (e.g., sizes, flavors)';
COMMENT ON COLUMN product_variants.product_id IS 'Foreign key to products table';
COMMENT ON COLUMN product_variants.name IS 'Variant name (e.g., Small, Medium, Large)';
COMMENT ON COLUMN product_variants.price IS 'Variant-specific price';
COMMENT ON COLUMN product_variants.stock IS 'Variant-specific stock quantity';

-- ============================================
-- PRODUCT VARIANT OPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS product_variant_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  name text NOT NULL,
  value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone
);

-- Indexes for product variant options
CREATE INDEX IF NOT EXISTS idx_product_variant_options_variant_id ON product_variant_options(variant_id);

-- Comments
COMMENT ON TABLE product_variant_options IS 'Options for product variants (e.g., Add-ons, Modifiers)';
COMMENT ON COLUMN product_variant_options.variant_id IS 'Foreign key to product_variants table';
COMMENT ON COLUMN product_variant_options.name IS 'Option name';
COMMENT ON COLUMN product_variant_options.value IS 'Option value';

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL DEFAULT 'Guest',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')),
  total numeric(10, 2) NOT NULL DEFAULT 0,
  order_date timestamp with time zone NOT NULL DEFAULT now(),
  order_type text CHECK (order_type IN ('pickup', 'delivery', 'dine_in')),
  delivery_fee numeric(10, 2) DEFAULT 0,
  payment_method text CHECK (payment_method IN ('cash', 'gcash')),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone
);

-- Indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON orders(customer_name);
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);

-- Comments
COMMENT ON TABLE orders IS 'Customer orders';
COMMENT ON COLUMN orders.status IS 'Order status: pending, processing, completed, cancelled, refunded';
COMMENT ON COLUMN orders.total IS 'Total order amount';
COMMENT ON COLUMN orders.order_type IS 'Type of order: pickup, delivery, dine_in';
COMMENT ON COLUMN orders.delivery_fee IS 'Additional delivery fee';
COMMENT ON COLUMN orders.payment_method IS 'Payment method: cash, gcash';
COMMENT ON COLUMN orders.notes IS 'Special instructions or notes for the order';

-- ============================================
-- ORDER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price numeric(10, 2) NOT NULL,
  subtotal numeric(10, 2) NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone
);

-- Indexes for order items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items(variant_id);

-- Comments
COMMENT ON TABLE order_items IS 'Individual items within an order';
COMMENT ON COLUMN order_items.product_id IS 'Foreign key to products table';
COMMENT ON COLUMN order_items.variant_id IS 'Foreign key to product_variants table (optional)';
COMMENT ON COLUMN order_items.quantity IS 'Quantity ordered';
COMMENT ON COLUMN order_items.price IS 'Price per unit at time of order';
COMMENT ON COLUMN order_items.subtotal IS 'Quantity * Price';

-- ============================================
-- ORDER ITEM ADD-ONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS order_item_add_ons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id uuid NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  value text NOT NULL,
  price numeric(10, 2) NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone
);

-- Indexes for order item add-ons
CREATE INDEX IF NOT EXISTS idx_order_item_add_ons_order_item_id ON order_item_add_ons(order_item_id);

-- Comments
COMMENT ON TABLE order_item_add_ons IS 'Add-ons/modifiers for order items';
COMMENT ON COLUMN order_item_add_ons.order_item_id IS 'Foreign key to order_items table';
COMMENT ON COLUMN order_item_add_ons.name IS 'Add-on name';
COMMENT ON COLUMN order_item_add_ons.value IS 'Add-on value/description';
COMMENT ON COLUMN order_item_add_ons.price IS 'Add-on price';
COMMENT ON COLUMN order_item_add_ons.quantity IS 'Add-on quantity';

-- ============================================
-- EXPENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date timestamp with time zone NOT NULL DEFAULT now(),
  total_expense numeric(10, 2) NOT NULL DEFAULT 0,
  items_count integer NOT NULL DEFAULT 0,
  remarks text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone
);

-- Indexes for expenses
CREATE INDEX IF NOT EXISTS idx_expenses_transaction_date ON expenses(transaction_date);
CREATE INDEX IF NOT EXISTS idx_expenses_total_expense ON expenses(total_expense);

-- Comments
COMMENT ON TABLE expenses IS 'Expense records for tracking costs';
COMMENT ON COLUMN expenses.transaction_date IS 'Date of the expense transaction';
COMMENT ON COLUMN expenses.total_expense IS 'Total expense amount';
COMMENT ON COLUMN expenses.items_count IS 'Number of expense items';
COMMENT ON COLUMN expenses.remarks IS 'Additional notes or remarks';

-- ============================================
-- EXPENSE ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS expense_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  cost numeric(10, 2) NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone
);

-- Indexes for expense items
CREATE INDEX IF NOT EXISTS idx_expense_items_expense_id ON expense_items(expense_id);

-- Comments
COMMENT ON TABLE expense_items IS 'Individual items within an expense record';
COMMENT ON COLUMN expense_items.expense_id IS 'Foreign key to expenses table';
COMMENT ON COLUMN expense_items.item_name IS 'Name of the expense item';
COMMENT ON COLUMN expense_items.cost IS 'Cost of the expense item';

-- ============================================
-- PORTION CONTROLS TABLE (RECIPES)
-- ============================================
CREATE TABLE IF NOT EXISTS portion_controls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  serving_size text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone,
  CONSTRAINT unique_product_recipe UNIQUE (product_id, variant_id)
);

-- Indexes for portion controls
CREATE INDEX IF NOT EXISTS idx_portion_controls_product_id ON portion_controls(product_id);
CREATE INDEX IF NOT EXISTS idx_portion_controls_variant_id ON portion_controls(variant_id);
CREATE INDEX IF NOT EXISTS idx_portion_controls_name ON portion_controls(name);

-- Comments
COMMENT ON TABLE portion_controls IS 'Recipes/portion controls for products with or without variants';
COMMENT ON COLUMN portion_controls.product_id IS 'The product this recipe is for';
COMMENT ON COLUMN portion_controls.variant_id IS 'The variant this recipe is for (NULL if recipe is for base product)';
COMMENT ON COLUMN portion_controls.name IS 'Name of the recipe/portion control';
COMMENT ON COLUMN portion_controls.serving_size IS 'Serving size description (e.g., "1 serving", "1 portion")';

-- ============================================
-- PORTION CONTROL ITEMS TABLE (RECIPE INGREDIENTS)
-- ============================================
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

-- Indexes for portion control items
CREATE INDEX IF NOT EXISTS idx_portion_control_items_portion_control_id ON portion_control_items(portion_control_id);
CREATE INDEX IF NOT EXISTS idx_portion_control_items_ingredient_product_id ON portion_control_items(ingredient_product_id);
CREATE INDEX IF NOT EXISTS idx_portion_control_items_ingredient_variant_id ON portion_control_items(ingredient_variant_id);

-- Comments
COMMENT ON TABLE portion_control_items IS 'Ingredients/items that make up a recipe';
COMMENT ON COLUMN portion_control_items.portion_control_id IS 'Foreign key to portion_controls table';
COMMENT ON COLUMN portion_control_items.ingredient_product_id IS 'Product used as ingredient (optional, can use ingredient_name instead)';
COMMENT ON COLUMN portion_control_items.ingredient_variant_id IS 'Variant used as ingredient (optional, must have ingredient_product_id if set)';
COMMENT ON COLUMN portion_control_items.ingredient_name IS 'Name of the ingredient (required, can be product name or custom name)';
COMMENT ON COLUMN portion_control_items.quantity IS 'Quantity of the ingredient needed';
COMMENT ON COLUMN portion_control_items.unit IS 'Unit of measurement (e.g., "pcs", "kg", "g", "ml", "l")';
COMMENT ON COLUMN portion_control_items.notes IS 'Additional notes about the ingredient';

-- ============================================
-- EVENTS TABLE (for Deja Bros website / blog-style portfolio)
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  location text NOT NULL,
  pax integer NOT NULL CHECK (pax > 0),
  description text NOT NULL,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  featured_image_index integer NOT NULL DEFAULT 0,
  event_date date NOT NULL,
  category text NOT NULL CHECK (category IN ('wedding', 'corporate', 'private')),
  flavors jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);

COMMENT ON TABLE events IS 'Portfolio events for Deja Bros website (displayed on /events)';
COMMENT ON COLUMN events.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN events.images IS 'Array of image URLs (JSON)';
COMMENT ON COLUMN events.featured_image_index IS 'Index in images array for the featured/cover image';
COMMENT ON COLUMN events.flavors IS 'Array of flavor names (JSON)';

-- ============================================
-- ROW LEVEL SECURITY POLICIES (RLS)
-- Uncomment and configure as needed for production
-- ============================================

-- Enable RLS on all tables
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE product_variant_options ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE order_item_add_ons ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE expense_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE portion_controls ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE portion_control_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VIEW: PRODUCTS WITH DETAILS
-- ============================================
CREATE OR REPLACE VIEW products_with_details AS
SELECT 
  p.id,
  p.name,
  p.description,
  p.category_id,
  c.name as category_name,
  p.sku,
  p.price,
  p.stock,
  p.is_active,
  p.created_at,
  p.updated_at,
  COUNT(pv.id) as variants_count
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN product_variants pv ON p.id = pv.product_id
GROUP BY p.id, c.name;

-- ============================================
-- VIEW: ORDERS WITH DETAILS
-- ============================================
CREATE OR REPLACE VIEW orders_with_details AS
SELECT 
  o.id,
  o.customer_name,
  o.status,
  o.total,
  o.order_date,
  o.order_type,
  o.delivery_fee,
  o.payment_method,
  o.notes,
  o.created_at,
  o.updated_at,
  COALESCE(
    json_agg(
      json_build_object(
        'id', oi.id,
        'product_id', oi.product_id,
        'product_name', p.name,
        'variant_id', oi.variant_id,
        'variant_name', pv.name,
        'quantity', oi.quantity,
        'price', oi.price,
        'subtotal', oi.subtotal,
        'add_ons', (
          SELECT json_agg(
            json_build_object(
              'id', ao.id,
              'name', ao.name,
              'value', ao.value,
              'price', ao.price,
              'quantity', ao.quantity
            )
          )
          FROM order_item_add_ons ao
          WHERE ao.order_item_id = oi.id
        )
      )
    ) FILTER (WHERE oi.id IS NOT NULL),
    '[]'::json
  ) as items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
LEFT JOIN product_variants pv ON oi.variant_id = pv.id
GROUP BY o.id;

-- ============================================
-- VIEW: EXPENSES WITH ITEMS
-- ============================================
CREATE OR REPLACE VIEW expenses_with_items AS
SELECT 
  e.id,
  e.transaction_date,
  e.total_expense,
  e.items_count,
  e.remarks,
  e.created_at,
  e.updated_at,
  COALESCE(
    json_agg(
      json_build_object(
        'id', ei.id,
        'item_name', ei.item_name,
        'cost', ei.cost,
        'created_at', ei.created_at,
        'updated_at', ei.updated_at
      )
    ) FILTER (WHERE ei.id IS NOT NULL),
    '[]'::json
  ) as items
FROM expenses e
LEFT JOIN expense_items ei ON e.id = ei.expense_id
GROUP BY e.id;

-- ============================================
-- VIEW: PORTION CONTROLS WITH DETAILS
-- ============================================
CREATE OR REPLACE VIEW portion_controls_with_details AS
SELECT 
  pc.id,
  pc.product_id,
  p.name as product_name,
  pc.variant_id,
  pv.name as variant_name,
  p.category_id,
  c.name as category_name,
  pc.name,
  pc.description,
  pc.serving_size,
  pc.created_at,
  pc.updated_at,
  COUNT(pci.id) as items_count,
  COALESCE(
    json_agg(
      json_build_object(
        'id', pci.id,
        'ingredient_product_id', pci.ingredient_product_id,
        'ingredient_variant_id', pci.ingredient_variant_id,
        'ingredient_name', pci.ingredient_name,
        'quantity', pci.quantity,
        'unit', pci.unit,
        'notes', pci.notes,
        'created_at', pci.created_at,
        'updated_at', pci.updated_at
      )
    ) FILTER (WHERE pci.id IS NOT NULL),
    '[]'::json
  ) as items
FROM portion_controls pc
LEFT JOIN products p ON pc.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN product_variants pv ON pc.variant_id = pv.id
LEFT JOIN portion_control_items pci ON pc.id = pci.portion_control_id
GROUP BY pc.id, p.name, pv.name, c.name;
