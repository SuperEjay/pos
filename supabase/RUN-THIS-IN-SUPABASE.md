# Create the `events` table in Supabase

The error **"Could not find the table 'public.events' in the schema cache"** means the `events` table does not exist in your database yet.

## Steps

1. Open your Supabase project: https://supabase.com/dashboard  
2. Go to **SQL Editor** (left sidebar).  
3. Click **New query**.  
4. Paste the SQL below and click **Run** (or press Cmd/Ctrl + Enter).

```sql
-- Ensure UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Events table
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);

-- Comments
COMMENT ON TABLE events IS 'Portfolio events for Deja Bros website (displayed on /events)';
COMMENT ON COLUMN events.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN events.images IS 'Array of image URLs (JSON)';
COMMENT ON COLUMN events.featured_image_index IS 'Index in images array for the featured/cover image';
COMMENT ON COLUMN events.flavors IS 'Array of flavor names (JSON)';
```

5. After it runs successfully, the `public.events` table will exist and the schema cache will pick it up (you may need to refresh the app or wait a moment).
