-- Enable RLS on order_items and clean up orphan tables
-- CRITICAL: order_items had no RLS, allowing anonymous access to purchase data

-- ============================
-- 1. Enable RLS on order_items
-- ============================
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Users can view order items belonging to their own orders
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Authenticated users can insert order items for their own orders
CREATE POLICY "Authenticated users can insert own order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Admins can manage all order items
CREATE POLICY "Admins can manage all order items" ON public.order_items
  FOR ALL USING (is_admin());

-- ============================
-- 2. Drop orphan test tables
-- ============================
DROP TABLE IF EXISTS public.t_id1;
DROP TABLE IF EXISTS public.t_id2;
DROP TABLE IF EXISTS public.zone_id;
