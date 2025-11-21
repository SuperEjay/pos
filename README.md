# POS (Point of Sale) System

A modern, full-featured Point of Sale (POS) system built with React, TypeScript, and Supabase. This application provides a complete solution for managing products, categories, and orders with a tablet-optimized POS interface.

## 🚀 Features

- **Product Management**
  - Create, read, update, and delete products
  - Product variants and variant options support
  - Category-based organization
  - Stock management
  - Product search and filtering

- **Category Management**
  - Full CRUD operations for product categories
  - Category-based product filtering

- **Order Management**
  - Create orders through POS interface or manual entry
  - View, edit, and delete orders
  - Advanced filtering (by status, date, customer, product, category)
  - Order status tracking (pending, processing, completed, cancelled, refunded)
  - Payment method tracking (Cash, GCash)
  - Additional notes/remarks field

- **POS Interface**
  - Tablet-optimized touch-friendly interface
  - Real-time cart management
  - Product search and category filtering
  - Variant selection with options
  - Automatic order completion on checkout
  - Payment method selection
  - Notes/remarks support

## 🛠️ Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Routing**: TanStack Router (file-based routing)
- **State Management**: TanStack Query (React Query)
- **UI Components**: Shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form + Zod validation
- **Database**: Supabase (PostgreSQL)
- **Build Tool**: Vite
- **Package Manager**: Bun

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Bun** (v1.0.0 or higher) - [Install Bun](https://bun.sh/docs/installation)
- **Node.js** (v20.19+ or v22.12+) - Required by Vite
- **Supabase Account** - [Sign up for free](https://supabase.com)

## 🔧 Setup Instructions

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd pos
```

### Step 2: Install Dependencies

```bash
bun install
```

### Step 3: Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Or create a new `.env` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**How to get your Supabase credentials:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project or select an existing one
3. Go to **Settings** → **API**
4. Copy the **Project URL** and **anon/public key**
5. Paste them into your `.env` file

### Step 4: Set Up the Database

1. **Create Tables in Supabase**

   Go to your Supabase project dashboard → **SQL Editor** and run the following SQL scripts:

   #### Categories Table
   ```sql
   CREATE TABLE IF NOT EXISTS categories (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     name text NOT NULL,
     description text,
     is_active boolean NOT NULL DEFAULT true,
     created_at timestamp with time zone NOT NULL DEFAULT now(),
     updated_at timestamp with time zone
   );

   CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
   CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
   ```

   #### Products Table
   ```sql
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

   CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
   CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
   CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
   ```

   #### Product Variants Table
   ```sql
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

   CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
   ```

   #### Product Variant Options Table
   ```sql
   CREATE TABLE IF NOT EXISTS product_variant_options (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
     name text NOT NULL,
     value text NOT NULL,
     created_at timestamp with time zone NOT NULL DEFAULT now(),
     updated_at timestamp with time zone
   );

   CREATE INDEX IF NOT EXISTS idx_product_variant_options_variant_id ON product_variant_options(variant_id);
   ```

   #### Orders Table
   ```sql
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

   CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
   CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
   CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON orders(customer_name);
   CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
   ```

   #### Order Items Table
   ```sql
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

   CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
   CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
   CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items(variant_id);
   ```

2. **Set Up Row Level Security (RLS) - Optional**

   If you want to enable RLS, run these policies:

   ```sql
   -- Enable RLS on all tables
   ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
   ALTER TABLE products ENABLE ROW LEVEL SECURITY;
   ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
   ALTER TABLE product_variant_options ENABLE ROW LEVEL SECURITY;
   ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
   ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

   -- Create policies (adjust based on your authentication needs)
   CREATE POLICY "Allow all for authenticated users" ON categories
     FOR ALL USING (auth.role() = 'authenticated');

   CREATE POLICY "Allow all for authenticated users" ON products
     FOR ALL USING (auth.role() = 'authenticated');

   CREATE POLICY "Allow all for authenticated users" ON product_variants
     FOR ALL USING (auth.role() = 'authenticated');

   CREATE POLICY "Allow all for authenticated users" ON product_variant_options
     FOR ALL USING (auth.role() = 'authenticated');

   CREATE POLICY "Allow all for authenticated users" ON orders
     FOR ALL USING (auth.role() = 'authenticated');

   CREATE POLICY "Allow all for authenticated users" ON order_items
     FOR ALL USING (auth.role() = 'authenticated');
   ```

   **Note**: For development, you can disable RLS or use the anon key with appropriate policies.

### Step 5: Run the Development Server

```bash
bun --bun run dev
```

The application will be available at `http://localhost:3000`

### Step 6: Access the Application

- **Main Dashboard**: `http://localhost:3000`
- **POS Interface**: `http://localhost:3000/pos`
- **Orders Management**: `http://localhost:3000/orders`
- **Products Management**: `http://localhost:3000/products`
- **Categories Management**: `http://localhost:3000/categories`

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/            # Shadcn/ui components
│   ├── layout/        # Layout components
│   ├── navigation/    # Navigation components
│   └── headers/       # Header components
├── features/          # Feature modules
│   ├── categories/   # Category management
│   ├── products/      # Product management
│   └── orders/        # Order management & POS
├── routes/            # TanStack Router routes
├── hooks/             # Custom React hooks
├── lib/               # Utility functions
├── utils/             # Helper utilities (Supabase client)
└── integrations/      # Third-party integrations
```

## 🧪 Available Scripts

- `bun --bun run dev` - Start development server
- `bun --bun run build` - Build for production
- `bun --bun run serve` - Preview production build
- `bun --bun run test` - Run tests
- `bun --bun run lint` - Run ESLint
- `bun --bun run format` - Format code with Prettier
- `bun --bun run check` - Format and lint code

## 🎨 Adding New Components

This project uses Shadcn/ui. To add new components:

```bash
pnpx shadcn@latest add <component-name>
```

Example:
```bash
pnpx shadcn@latest add card
```

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key | Yes |

## 📝 Key Features Explained

### Product Variants
Products can have multiple variants (e.g., sizes, colors) with their own prices, stock, and SKUs. Each variant can have options (e.g., "Size: Large", "Color: Red").

### POS Interface
The POS interface is optimized for tablet use with:
- Large, touch-friendly buttons
- Real-time cart updates
- Variant selection dialogs
- Payment method selection
- Automatic order completion

### Order Status Flow
- **Pending**: Order created but not yet processed
- **Processing**: Order is being prepared
- **Completed**: Order is finished (default for POS checkout)
- **Cancelled**: Order was cancelled
- **Refunded**: Order was refunded

## 🐛 Troubleshooting

### Build Errors
- Ensure Node.js version is 20.19+ or 22.12+
- Clear `node_modules` and reinstall: `rm -rf node_modules && bun install`

### Database Connection Issues
- Verify your Supabase credentials in `.env`
- Check that your Supabase project is active
- Ensure RLS policies allow your operations (or disable RLS for development)

### Port Already in Use
- Change the port in `package.json` or use: `bun --bun run dev --port 3001`

## 📚 Additional Resources

- [TanStack Router Docs](https://tanstack.com/router)
- [TanStack Query Docs](https://tanstack.com/query)
- [Supabase Docs](https://supabase.com/docs)
- [Shadcn/ui Docs](https://ui.shadcn.com)
- [Tailwind CSS Docs](https://tailwindcss.com)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run `bun --bun run check` to ensure code quality
4. Submit a pull request

## 📄 License

[Add your license here]

---

**Happy Coding! 🚀**
