-- Migration 005: Media columns, campaigns redesign, admin enhancements

-- 1. Add new columns to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 2. Add 'active' column to admin_users if missing
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- 3. Drop old promotions table and create campaigns (publicidad) table
DROP TABLE IF EXISTS promotions;

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  media_type TEXT DEFAULT 'IMAGE' CHECK (media_type IN ('IMAGE', 'VIDEO')),
  image_url TEXT,
  video_url TEXT,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  promo_price NUMERIC(10,2),
  button_text TEXT DEFAULT 'PEDIR AHORA',
  button_url TEXT DEFAULT '/menu',
  active BOOLEAN DEFAULT true,
  show_modal BOOLEAN DEFAULT false,
  show_home BOOLEAN DEFAULT false,
  show_menu BOOLEAN DEFAULT false,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  priority INTEGER DEFAULT 0,
  display_frequency TEXT DEFAULT 'ONCE_PER_SESSION' CHECK (display_frequency IN ('ONCE_PER_SESSION', 'ONCE_PER_DAY', 'ALWAYS')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS on campaigns
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for campaigns
CREATE POLICY "campaigns_public_read" ON campaigns FOR SELECT USING (active = true);
CREATE POLICY "campaigns_admin_all" ON campaigns FOR ALL USING (is_admin());

-- 6. Seed initial campaign (El Box Mini-Monster)
INSERT INTO campaigns (title, subtitle, promo_price, active, show_modal, show_home, button_text, button_url, priority, display_frequency)
VALUES (
  '🔥 EL BOX QUE ESTÁ ROMPIENDO LA ESQUINA',
  '5 MINI BURGERS + PATATAS + SALSAS + COCA-COLA',
  10.50,
  true,
  true,
  true,
  'PEDIR AHORA',
  '/menu',
  100,
  'ONCE_PER_SESSION'
);

-- 7. Create storage buckets policies (descriptive comments for manual setup)
-- NOTE: Supabase Storage buckets must be created via Dashboard:
-- Bucket: product-media (public read, admin write)
-- Bucket: campaign-media (public read, admin write)
