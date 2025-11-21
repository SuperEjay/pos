# Database Schema for Products Module

This document outlines the database tables and columns required for the Products module in Supabase.

## Tables Overview

The Products module requires three main tables:
1. `products` - Main product information
2. `product_variants` - Product variants (e.g., sizes, colors)
3. `product_variant_options` - Options for each variant (e.g., "Size: Large", "Color: Red")

---

## 1. Products Table

**Table Name:** `products`

### Columns

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier for the product |
| `name` | `text` | NOT NULL | Product name (max 100 characters) |
| `description` | `text` | NULLABLE | Product description (max 1000 characters) |
| `category_id` | `uuid` | NOT NULL, FOREIGN KEY → `categories(id)` | Reference to the category this product belongs to |
| `sku` | `text` | NULLABLE | Stock Keeping Unit (max 50 characters) |
| `price` | `numeric(10, 2)` | NULLABLE | Base product price (decimal with 2 decimal places) |
| `stock` | `integer` | NULLABLE | Base product stock quantity |
| `is_active` | `boolean` | NOT NULL, DEFAULT `true` | Whether the product is active/available |
| `created_at` | `timestamp with time zone` | NOT NULL, DEFAULT `now()` | Timestamp when the product was created |
| `updated_at` | `timestamp with time zone` | NULLABLE | Timestamp when the product was last updated |

### SQL Creation Script

```sql
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  sku text,
  price numeric(10, 2),
  stock integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone
);

-- Create index on category_id for faster queries
CREATE INDEX idx_products_category_id ON products(category_id);

-- Create index on is_active for filtering active products
CREATE INDEX idx_products_is_active ON products(is_active);

-- Create index on name for search functionality
CREATE INDEX idx_products_name ON products(name);
```

---

## 2. Product Variants Table

**Table Name:** `product_variants`

### Columns

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier for the variant |
| `product_id` | `uuid` | NOT NULL, FOREIGN KEY → `products(id)` | Reference to the parent product |
| `name` | `text` | NOT NULL | Variant name (e.g., "Large", "Red", "Premium") (max 100 characters) |
| `price` | `numeric(10, 2)` | NULLABLE | Variant-specific price override |
| `stock` | `integer` | NULLABLE | Variant-specific stock quantity |
| `sku` | `text` | NULLABLE | Variant-specific SKU (max 50 characters) |
| `created_at` | `timestamp with time zone` | NOT NULL, DEFAULT `now()` | Timestamp when the variant was created |
| `updated_at` | `timestamp with time zone` | NULLABLE | Timestamp when the variant was last updated |

### SQL Creation Script

```sql
CREATE TABLE product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(10, 2),
  stock integer,
  sku text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone
);

-- Create index on product_id for faster queries
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
```

---

## 3. Product Variant Options Table

**Table Name:** `product_variant_options`

### Columns

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier for the option |
| `variant_id` | `uuid` | NOT NULL, FOREIGN KEY → `product_variants(id)` | Reference to the parent variant |
| `name` | `text` | NOT NULL | Option name (e.g., "Size", "Color", "Material") (max 50 characters) |
| `value` | `text` | NOT NULL | Option value (e.g., "Large", "Red", "Cotton") (max 100 characters) |
| `created_at` | `timestamp with time zone` | NOT NULL, DEFAULT `now()` | Timestamp when the option was created |
| `updated_at` | `timestamp with time zone` | NULLABLE | Timestamp when the option was last updated |

### SQL Creation Script

```sql
CREATE TABLE product_variant_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  name text NOT NULL,
  value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone
);

-- Create index on variant_id for faster queries
CREATE INDEX idx_product_variant_options_variant_id ON product_variant_options(variant_id);
```

---

## Relationships

### Entity Relationship Diagram (Text Representation)

```
categories
  │
  ├── id (uuid)
  │
  └── products (one-to-many)
      │
      ├── id (uuid)
      ├── category_id → categories.id
      │
      └── product_variants (one-to-many)
          │
          ├── id (uuid)
          ├── product_id → products.id
          │
          └── product_variant_options (one-to-many)
              │
              ├── id (uuid)
              └── variant_id → product_variants.id
```

### Foreign Key Constraints

1. **products.category_id** → **categories.id**
   - `ON DELETE RESTRICT` - Prevents deletion of a category if products reference it

2. **product_variants.product_id** → **products.id**
   - `ON DELETE CASCADE` - Deletes all variants when a product is deleted

3. **product_variant_options.variant_id** → **product_variants.id**
   - `ON DELETE CASCADE` - Deletes all options when a variant is deleted

---

## Row Level Security (RLS) Policies

If you're using Supabase with Row Level Security enabled, you'll need to create policies. Here are example policies:

### Products Table Policies

```sql
-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users (adjust based on your needs)
CREATE POLICY "Allow all for authenticated users" ON products
  FOR ALL
  USING (auth.role() = 'authenticated');
```

### Product Variants Table Policies

```sql
-- Enable RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON product_variants
  FOR ALL
  USING (auth.role() = 'authenticated');
```

### Product Variant Options Table Policies

```sql
-- Enable RLS
ALTER TABLE product_variant_options ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON product_variant_options
  FOR ALL
  USING (auth.role() = 'authenticated');
```

**Note:** Adjust these policies based on your specific authentication and authorization requirements.

---

## Complete SQL Script

Here's the complete SQL script to create all tables at once:

```sql
-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  sku text,
  price numeric(10, 2),
  stock integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone
);

-- Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(10, 2),
  stock integer,
  sku text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone
);

-- Create product_variant_options table
CREATE TABLE IF NOT EXISTS product_variant_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  name text NOT NULL,
  value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variant_options_variant_id ON product_variant_options(variant_id);
```

---

## Notes

1. **Categories Table**: This schema assumes a `categories` table already exists. If it doesn't, create it first with at least an `id` column (uuid).

2. **Data Types**:
   - `numeric(10, 2)` allows prices up to 99,999,999.99. Adjust precision if needed.
   - `text` fields don't have explicit length limits in PostgreSQL, but the application enforces max lengths as specified in the form schema.

3. **Timestamps**: All tables use `timestamp with time zone` for proper timezone handling.

4. **Cascade Deletes**: Variants and options are automatically deleted when their parent is deleted. This prevents orphaned records.

5. **Nullable Fields**: Fields marked as nullable in the form (sku, price, stock) are nullable in the database to match the application requirements.

---

## Example Data

### Example Product with Variants

```sql
-- Insert a product
INSERT INTO products (name, description, category_id, sku, price, stock)
VALUES (
  'T-Shirt',
  'A comfortable cotton t-shirt',
  'your-category-id-here',
  'TSH-001',
  29.99,
  100
);

-- Insert variants for the product
INSERT INTO product_variants (product_id, name, price, stock, sku)
VALUES
  ('product-id-here', 'Small', 29.99, 25, 'TSH-001-S'),
  ('product-id-here', 'Medium', 29.99, 30, 'TSH-001-M'),
  ('product-id-here', 'Large', 31.99, 20, 'TSH-001-L');

-- Insert options for a variant
INSERT INTO product_variant_options (variant_id, name, value)
VALUES
  ('variant-id-here', 'Size', 'Small'),
  ('variant-id-here', 'Color', 'Blue');
```

---

## Supabase Dashboard Setup

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the complete SQL script above
4. Verify tables are created in the **Table Editor**
5. Set up RLS policies if needed in the **Authentication** → **Policies** section

---

## Verification Queries

After creating the tables, you can verify the structure:

```sql
-- Check products table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- Check foreign key constraints
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('products', 'product_variants', 'product_variant_options');
```

