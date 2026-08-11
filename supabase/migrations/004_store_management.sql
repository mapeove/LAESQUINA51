-- Migration 004: Store Management (Promotions, Delivery Drivers, Special Hours, Bizum & Cash Change)

-- 1. promotions
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  image_url TEXT,
  promo_price NUMERIC(10,2),
  active BOOLEAN DEFAULT true,
  show_modal BOOLEAN DEFAULT true,
  show_home BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. delivery_drivers
CREATE TABLE IF NOT EXISTS delivery_drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle_type TEXT DEFAULT 'MOTO',
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. special_opening_hours
CREATE TABLE IF NOT EXISTS special_opening_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  special_date DATE NOT NULL UNIQUE,
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_closed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Alter orders table for driver assignment & cash change
ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES delivery_drivers(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cash_change_for NUMERIC(10,2);

-- 5. Enable RLS
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_opening_hours ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Promotions: public read active, admin all
CREATE POLICY "promotions_public_read" ON promotions FOR SELECT USING (active = true);
CREATE POLICY "promotions_admin_all" ON promotions FOR ALL USING (is_admin());

-- Delivery drivers: admin all, no public access
CREATE POLICY "delivery_drivers_admin_all" ON delivery_drivers FOR ALL USING (is_admin());

-- Special hours: public read, admin all
CREATE POLICY "special_hours_public_read" ON special_opening_hours FOR SELECT USING (true);
CREATE POLICY "special_hours_admin_all" ON special_opening_hours FOR ALL USING (is_admin());

-- Seed default bizum_phone setting if not exists
INSERT INTO store_settings (key, value)
VALUES ('bizum_phone', '633184354')
ON CONFLICT (key) DO NOTHING;

-- Seed initial promotion for El Box Mini-Monster
INSERT INTO promotions (title, subtitle, promo_price, active, show_modal, show_home)
VALUES (
  '🔥 EL BOX QUE ESTÁ ROMPIENDO LA ESQUINA',
  '5 MINI BURGERS + PATATAS + SALSAS + COCA-COLA',
  10.50,
  true,
  true,
  true
)
ON CONFLICT DO NOTHING;
