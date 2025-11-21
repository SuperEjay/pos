# Database Schema for Orders Module

This document outlines the database tables and columns required for the Orders module in Supabase.

## Tables Overview

The Orders module requires two main tables:
1. `orders` - Main order information
2. `order_items` - Items within each order (with product and variant references)

---

## 1. Orders Table

**Table Name:** `orders`

### Columns

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier for the order |
| `customer_name` | `text` | NOT NULL | Customer name (max 100 characters) |
| `status` | `text` | NOT NULL | Order status: 'pending', 'processing', 'completed', 'cancelled', 'refunded' |
| `total` | `numeric(10, 2)` | NOT NULL | Total order amount (decimal with 2 decimal places) |
| `order_date` | `date` | NOT NULL | Date of the order |
| `payment_method` | `text` | NULLABLE | Payment method: 'cash' or 'gcash' |
| `notes` | `text` | NULLABLE | Additional information or notes (max 500 characters) |
| `created_at` | `timestamp with time zone` | NOT NULL, DEFAULT `now()` | Timestamp when the order was created |
| `updated_at` | `timestamp with time zone` | NULLABLE | Timestamp when the order was last updated |

### SQL Creation Script

```sql
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')),
  total numeric(10, 2) NOT NULL,
  order_date date NOT NULL,
  payment_method text CHECK (payment_method IN ('cash', 'gcash')),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone
);

-- Create index on status for faster filtering
CREATE INDEX idx_orders_status ON orders(status);

-- Create index on order_date for faster date filtering
CREATE INDEX idx_orders_order_date ON orders(order_date);

-- Create index on customer_name for faster search
CREATE INDEX idx_orders_customer_name ON orders(customer_name);

-- Create index on created_at for sorting
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

---

## 2. Order Items Table

**Table Name:** `order_items`

### Columns

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier for the order item |
| `order_id` | `uuid` | NOT NULL, FOREIGN KEY → `orders(id)` | Reference to the parent order |
| `product_id` | `uuid` | NOT NULL, FOREIGN KEY → `products(id)` | Reference to the product |
| `variant_id` | `uuid` | NULLABLE, FOREIGN KEY → `product_variants(id)` | Reference to the product variant (if applicable) |
| `quantity` | `integer` | NOT NULL | Quantity of the item |
| `price` | `numeric(10, 2)` | NOT NULL | Unit price at the time of order |
| `subtotal` | `numeric(10, 2)` | NOT NULL | Calculated subtotal (quantity × price) |
| `created_at` | `timestamp with time zone` | NOT NULL, DEFAULT `now()` | Timestamp when the item was created |
| `updated_at` | `timestamp with time zone` | NULLABLE | Timestamp when the item was last updated |

### SQL Creation Script

```sql
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  subtotal numeric(10, 2) NOT NULL CHECK (subtotal >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone
);

-- Create index on order_id for faster queries
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Create index on product_id for filtering by product
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Create index on variant_id for filtering by variant
CREATE INDEX idx_order_items_variant_id ON order_items(variant_id);
```

---

## Relationships

### Entity Relationship Diagram (Text Representation)

```
orders
  │
  ├── id (uuid)
  │
  └── order_items (one-to-many)
      │
      ├── id (uuid)
      ├── order_id → orders.id
      ├── product_id → products.id
      └── variant_id → product_variants.id (nullable)
```

### Foreign Key Constraints

1. **order_items.order_id** → **orders.id**
   - `ON DELETE CASCADE` - Deletes all items when an order is deleted

2. **order_items.product_id** → **products.id**
   - `ON DELETE RESTRICT` - Prevents deletion of a product if it's referenced in orders

3. **order_items.variant_id** → **product_variants.id**
   - `ON DELETE SET NULL` - Sets variant_id to NULL if variant is deleted (preserves order history)

---

## Row Level Security (RLS) Policies

If you're using Supabase with Row Level Security enabled, you'll need to create policies. Here are example policies:

### Orders Table Policies

```sql
-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON orders
  FOR ALL
  USING (auth.role() = 'authenticated');
```

### Order Items Table Policies

```sql
-- Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON order_items
  FOR ALL
  USING (auth.role() = 'authenticated');
```

**Note:** Adjust these policies based on your specific authentication and authorization requirements.

---

## Complete SQL Script

Here's the complete SQL script to create all tables at once:

```sql
-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')),
  total numeric(10, 2) NOT NULL,
  order_date date NOT NULL,
  payment_method text CHECK (payment_method IN ('cash', 'gcash')),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  subtotal numeric(10, 2) NOT NULL CHECK (subtotal >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone
);

-- Create indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON orders(customer_name);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Create indexes for order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items(variant_id);
```

---

## Notes

1. **Products and Variants Tables**: This schema assumes `products` and `product_variants` tables already exist (as defined in `DATABASE_SCHEMA.md`).

2. **Data Types**:
   - `numeric(10, 2)` allows amounts up to 99,999,999.99. Adjust precision if needed.
   - `date` type is used for `order_date` to store only the date without time.

3. **Status Values**: The status field uses a CHECK constraint to ensure only valid status values are stored.

4. **Cascade Deletes**: Order items are automatically deleted when their parent order is deleted. This prevents orphaned records.

5. **Price Storage**: Prices are stored at the time of order to preserve historical pricing even if product prices change later.

6. **Variant Handling**: The `variant_id` is nullable, allowing orders to include products without variants. If a variant is deleted, the order item remains but the variant reference is set to NULL.

---

## Example Data

### Example Order with Items

```sql
-- Insert an order
INSERT INTO orders (customer_name, status, total, order_date)
VALUES (
  'John Doe',
  'pending',
  59.98,
  '2024-01-15'
);

-- Insert order items
INSERT INTO order_items (order_id, product_id, variant_id, quantity, price, subtotal)
VALUES
  ('order-id-here', 'product-id-here', 'variant-id-here', 2, 29.99, 59.98),
  ('order-id-here', 'another-product-id', NULL, 1, 19.99, 19.99);
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
-- Check orders table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Check order_items table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'order_items'
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
  AND tc.table_name IN ('orders', 'order_items');
```

