-- 010_driver_workflow.sql
BEGIN;

-- 1. Añadir user_id a delivery_drivers para vincular cuentas
ALTER TABLE public.delivery_drivers
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE;

-- 2. Crear tabla order_messages para el chat
CREATE TABLE IF NOT EXISTS public.order_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indices para rendimiento
CREATE INDEX IF NOT EXISTS idx_order_messages_order_id ON public.order_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_order_messages_created_at ON public.order_messages(created_at ASC);

-- 3. Helper functions
-- Helper function to check si el usuario autenticado es el repartidor asignado a ese pedido
CREATE OR REPLACE FUNCTION is_order_driver(check_order_id UUID)
RETURNS BOOLEAN
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.delivery_drivers d ON o.driver_id = d.id
    WHERE o.id = check_order_id AND d.user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. RLS para order_messages
ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

-- SELECT: Owner, Customer, o Driver asignado
CREATE POLICY "order_messages_select"
ON public.order_messages
FOR SELECT
TO authenticated
USING (
  is_admin() 
  OR 
  (SELECT user_id FROM public.orders WHERE id = order_messages.order_id) = auth.uid()
  OR
  is_order_driver(order_messages.order_id)
);

-- INSERT: Solo Owner, Customer, o Driver asignado. 
-- Comprobar estado del pedido y autenticidad del remitente.
CREATE POLICY "order_messages_insert"
ON public.order_messages
FOR INSERT
TO authenticated
WITH CHECK (
  -- Comprobar que no hace spoofing
  sender_user_id = auth.uid()
  AND
  -- Comprobar status del pedido
  (SELECT status FROM public.orders WHERE id = order_id) IN ('READY', 'OUT_FOR_DELIVERY', 'ARRIVED')
  AND
  (
    -- Comprobar permisos por rol o propiedad
    is_admin() 
    OR 
    (SELECT user_id FROM public.orders WHERE id = order_id) = auth.uid()
    OR
    is_order_driver(order_id)
  )
);

-- 5. RLS para delivery_drivers y orders (SELECT)
CREATE POLICY "delivery_drivers_read_own" ON public.delivery_drivers
FOR SELECT
TO authenticated
USING ( user_id = auth.uid() );

CREATE POLICY "orders_driver_select" ON public.orders
FOR SELECT
TO authenticated
USING ( is_order_driver(id) );

-- ELIMINAMOS la policy "orders_driver_update" por completo, usamos RPCs

-- 6. Añadir order_messages a realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'order_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime
        ADD TABLE public.order_messages;
    END IF;
END $$;

-- 7. RPCs Administrativas y de Flujo
-- Helper function para vincular repartidor por email
CREATE OR REPLACE FUNCTION link_driver_by_email(p_driver_id UUID, p_email TEXT)
RETURNS BOOLEAN
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Validar admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Buscar usuario por email en auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RETURN FALSE; -- No encontrado
  END IF;

  -- Actualizar driver
  UPDATE public.delivery_drivers SET user_id = v_user_id WHERE id = p_driver_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RPC driver_mark_arrived
CREATE OR REPLACE FUNCTION driver_mark_arrived(p_order_id UUID)
RETURNS VOID
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
BEGIN
  -- Verificar sesión
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verificar si es el conductor asignado
  IF NOT is_order_driver(p_order_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Obtener status
  SELECT status INTO v_status FROM public.orders WHERE id = p_order_id;
  
  -- Exigir transición correcta
  IF v_status != 'OUT_FOR_DELIVERY' THEN
    RAISE EXCEPTION 'Invalid status transition. Order must be OUT_FOR_DELIVERY.';
  END IF;

  -- Actualizar únicamente el status
  UPDATE public.orders SET status = 'ARRIVED' WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RPC driver_mark_delivered
CREATE OR REPLACE FUNCTION driver_mark_delivered(p_order_id UUID)
RETURNS VOID
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
BEGIN
  -- Verificar sesión
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verificar si es el conductor asignado
  IF NOT is_order_driver(p_order_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Obtener status
  SELECT status INTO v_status FROM public.orders WHERE id = p_order_id;
  
  -- Exigir transición correcta
  IF v_status != 'ARRIVED' THEN
    RAISE EXCEPTION 'Invalid status transition. Order must be ARRIVED.';
  END IF;

  -- Actualizar únicamente el status
  UPDATE public.orders SET status = 'DELIVERED' WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
