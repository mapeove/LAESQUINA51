-- ============================================================
-- LA ESQUINA 51
-- Migration 006
-- Customer accounts + secure order ownership + realtime tracking
-- ============================================================

BEGIN;

-- ============================================================
-- 1. RELACIONAR PEDIDOS CON auth.users
-- ============================================================

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS user_id UUID
REFERENCES auth.users(id)
ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_user_id
ON public.orders(user_id);

CREATE INDEX IF NOT EXISTS idx_orders_user_created_at
ON public.orders(user_id, created_at DESC);


-- ============================================================
-- 2. AMPLIAR PERFIL DEL CLIENTE SI FALTA
-- ============================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS default_address TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS postal_code TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS neighborhood TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS floor TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS door TEXT;


-- ============================================================
-- 3. RLS ORDERS
-- ============================================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_read_own" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
DROP POLICY IF EXISTS "orders_update_own" ON public.orders;

-- El cliente autenticado solamente puede leer SUS pedidos.
CREATE POLICY "orders_read_own"
ON public.orders
FOR SELECT
TO authenticated
USING (
    (SELECT auth.uid()) = user_id
);

-- El cliente solamente puede crear un pedido asociado a sí mismo.
CREATE POLICY "orders_insert_own"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT auth.uid()) = user_id
);

-- IMPORTANTE:
-- NO crear policy UPDATE para clientes.
-- El estado, repartidor, total y demás información operativa
-- solamente deben ser modificados por el backend/admin.


-- ============================================================
-- 4. ORDER ITEMS
-- ============================================================

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_read_own" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_own" ON public.order_items;

-- Cliente puede leer líneas exclusivamente de sus pedidos.
CREATE POLICY "order_items_read_own"
ON public.order_items
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.orders o
        WHERE o.id = order_items.order_id
          AND o.user_id = (SELECT auth.uid())
    )
);

-- Cliente puede insertar líneas solamente dentro de su propio pedido.
CREATE POLICY "order_items_insert_own"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.orders o
        WHERE o.id = order_items.order_id
          AND o.user_id = (SELECT auth.uid())
    )
);


-- ============================================================
-- 5. PROFILES
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_read_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_read_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    id = (SELECT auth.uid())
);

CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
    id = (SELECT auth.uid())
);

CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    id = (SELECT auth.uid())
)
WITH CHECK (
    id = (SELECT auth.uid())
);


-- ============================================================
-- 6. REALTIME
-- ============================================================

-- Añadir orders a la publicación Realtime si aún no está incluida.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime
        ADD TABLE public.orders;
    END IF;
END $$;


COMMIT;