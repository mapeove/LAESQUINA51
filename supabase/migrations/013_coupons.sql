-- 013_coupons.sql
-- Migration to add coupons support

-- 1. Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    discount_amount NUMERIC(10,2) NOT NULL CHECK (discount_amount > 0),
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    used_by UUID REFERENCES auth.users(id),
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create coupon_distribution_history table
CREATE TABLE IF NOT EXISTS coupon_distribution_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sent_at TIMESTAMPTZ DEFAULT now(),
    email TEXT
);

-- 3. Update orders table to reference coupon
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;

-- 4. Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_distribution_history ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for coupons
-- Admins can do everything
CREATE POLICY "Admins can manage coupons" ON coupons
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

-- Any authenticated user can read a coupon to validate it
CREATE POLICY "Users can view coupons" ON coupons
    FOR SELECT
    TO authenticated
    USING (true);

-- 6. RLS Policies for coupon_distribution_history
CREATE POLICY "Admins can manage coupon history" ON coupon_distribution_history
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() AND active = true
        )
    );

-- 7. RPC to atomically create order and consume coupon
CREATE OR REPLACE FUNCTION create_order_with_coupon(
  p_user_id UUID,
  p_order_number TEXT,
  p_total NUMERIC,
  p_subtotal NUMERIC,
  p_delivery_fee NUMERIC,
  p_status TEXT,
  p_payment_method TEXT,
  p_payment_status TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_address TEXT,
  p_delivery_zone_id UUID,
  p_notes TEXT,
  p_items JSONB,
  p_coupon_code TEXT
) RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_coupon_id UUID;
  v_discount_amount NUMERIC := 0;
  v_item JSONB;
BEGIN
  -- Handle coupon if provided
  IF p_coupon_code IS NOT NULL AND p_coupon_code != '' THEN
    -- Try to lock and get the coupon
    SELECT id, discount_amount INTO v_coupon_id, v_discount_amount
    FROM coupons
    WHERE code = p_coupon_code 
      AND used = false 
      AND expires_at > now()
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cupón inválido, expirado o ya utilizado';
    END IF;

    -- Verify math (subtotal + delivery_fee - discount = total)
    IF p_total != GREATEST(0, (p_subtotal + p_delivery_fee - v_discount_amount)) THEN
      RAISE EXCEPTION 'El total calculado no coincide con el descuento del cupón';
    END IF;

    -- Mark coupon as used
    UPDATE coupons
    SET used = true,
        used_by = p_user_id,
        used_at = now()
    WHERE id = v_coupon_id;
  END IF;

  -- Insert order
  INSERT INTO orders (
    user_id,
    order_number,
    total,
    subtotal,
    delivery_fee,
    status,
    payment_method,
    payment_status,
    customer_name,
    customer_phone,
    customer_address,
    delivery_zone_id,
    notes,
    coupon_id,
    discount_amount
  ) VALUES (
    p_user_id,
    p_order_number,
    p_total,
    p_subtotal,
    p_delivery_fee,
    p_status,
    p_payment_method,
    p_payment_status,
    p_customer_name,
    p_customer_phone,
    p_customer_address,
    p_delivery_zone_id,
    p_notes,
    v_coupon_id,
    v_discount_amount
  ) RETURNING id INTO v_order_id;

  -- Insert order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      unit_price,
      options_snapshot
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unit_price')::NUMERIC,
      v_item->'options_snapshot'
    );
  END LOOP;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
