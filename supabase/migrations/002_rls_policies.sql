-- Enable RLS on all tables
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE opening_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- store_settings: public read, admin write
CREATE POLICY "store_settings_public_read" ON store_settings FOR SELECT USING (true);
CREATE POLICY "store_settings_admin_write" ON store_settings FOR ALL USING (is_admin());

-- opening_hours: public read, admin write
CREATE POLICY "opening_hours_public_read" ON opening_hours FOR SELECT USING (true);
CREATE POLICY "opening_hours_admin_write" ON opening_hours FOR ALL USING (is_admin());

-- delivery_zones: public read active zones, admin all
CREATE POLICY "delivery_zones_public_read" ON delivery_zones FOR SELECT USING (active = true);
CREATE POLICY "delivery_zones_admin_all" ON delivery_zones FOR ALL USING (is_admin());

-- categories: public read active, admin all
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (active = true);
CREATE POLICY "categories_admin_all" ON categories FOR ALL USING (is_admin());

-- products: public read active, admin all
CREATE POLICY "products_public_read" ON products FOR SELECT USING (active = true);
CREATE POLICY "products_admin_all" ON products FOR ALL USING (is_admin());

-- product_option_groups: public read, admin all
CREATE POLICY "option_groups_public_read" ON product_option_groups FOR SELECT USING (true);
CREATE POLICY "option_groups_admin_all" ON product_option_groups FOR ALL USING (is_admin());

-- product_options: public read, admin all
CREATE POLICY "options_public_read" ON product_options FOR SELECT USING (true);
CREATE POLICY "options_admin_all" ON product_options FOR ALL USING (is_admin());

-- product_extras: public read active, admin all
CREATE POLICY "extras_public_read" ON product_extras FOR SELECT USING (active = true);
CREATE POLICY "extras_admin_all" ON product_extras FOR ALL USING (is_admin());

-- orders: anyone can insert (guest checkout); read own by phone or email; admin all
CREATE POLICY "orders_insert_public" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_admin_all" ON orders FOR ALL USING (is_admin());

-- order_items: insert with order, admin read
CREATE POLICY "order_items_insert_public" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "order_items_admin_all" ON order_items FOR ALL USING (is_admin());

-- profiles: own profile
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);

-- admin_users: only admins can read
CREATE POLICY "admin_users_only_admins" ON admin_users FOR SELECT USING (is_admin());
