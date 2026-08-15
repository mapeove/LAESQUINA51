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

-- 3. RLS para order_messages
ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check si el usuario autenticado es el repartidor asignado a ese pedido
CREATE OR REPLACE FUNCTION is_order_driver(check_order_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.delivery_drivers d ON o.driver_id = d.id
    WHERE o.id = check_order_id AND d.user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

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

-- INSERT: Solo Owner, Customer, o Driver asignado
CREATE POLICY "order_messages_insert"
ON public.order_messages
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin() 
  OR 
  (SELECT user_id FROM public.orders WHERE id = order_id) = auth.uid()
  OR
  is_order_driver(order_id)
);

-- 4. RLS update para delivery_drivers (drivers necesitan leer su propio perfil)
CREATE POLICY "delivery_drivers_read_own" ON public.delivery_drivers
FOR SELECT
TO authenticated
USING ( user_id = auth.uid() );

-- 5. RLS update para orders (drivers necesitan leer y actualizar pedidos asignados)
CREATE POLICY "orders_driver_select" ON public.orders
FOR SELECT
TO authenticated
USING ( is_order_driver(id) );

CREATE POLICY "orders_driver_update" ON public.orders
FOR UPDATE
TO authenticated
USING ( is_order_driver(id) )
WITH CHECK ( is_order_driver(id) );

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

-- Helper function para vincular repartidor por email (bypasseando RLS de auth.users)
CREATE OR REPLACE FUNCTION link_driver_by_email(p_driver_id UUID, p_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Validar admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Buscar usuario por email
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RETURN FALSE; -- No encontrado
  END IF;

  -- Actualizar driver
  UPDATE public.delivery_drivers SET user_id = v_user_id WHERE id = p_driver_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
