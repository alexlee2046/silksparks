-- 修复产品表的 RLS 策略
-- 添加 UPDATE 和 DELETE 保护策略

-- 只有管理员可以更新产品（目前阻止所有更新）
CREATE POLICY "禁止匿名更新产品" ON public.products 
  FOR UPDATE USING (false);

-- 只有管理员可以删除产品（目前阻止所有删除）  
CREATE POLICY "禁止匿名删除产品" ON public.products 
  FOR DELETE USING (false);

-- 只有管理员可以插入产品
CREATE POLICY "禁止匿名插入产品" ON public.products 
  FOR INSERT WITH CHECK (false);

-- 专家表同样需要保护
CREATE POLICY "禁止匿名更新专家" ON public.experts 
  FOR UPDATE USING (false);

CREATE POLICY "禁止匿名删除专家" ON public.experts 
  FOR DELETE USING (false);

CREATE POLICY "禁止匿名插入专家" ON public.experts 
  FOR INSERT WITH CHECK (false);

-- 货币表保护
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "所有人可查看货币" ON public.currencies 
  FOR SELECT USING (true);

CREATE POLICY "禁止匿名修改货币" ON public.currencies 
  FOR UPDATE USING (false);

CREATE POLICY "禁止匿名删除货币" ON public.currencies 
  FOR DELETE USING (false);

CREATE POLICY "禁止匿名插入货币" ON public.currencies 
  FOR INSERT WITH CHECK (false);

-- 运费区域保护
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "所有人可查看运费区域" ON public.shipping_zones 
  FOR SELECT USING (true);

CREATE POLICY "禁止匿名修改运费区域" ON public.shipping_zones 
  FOR UPDATE USING (false);

-- 运费费率保护  
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "所有人可查看运费费率" ON public.shipping_rates 
  FOR SELECT USING (true);

CREATE POLICY "禁止匿名修改运费费率" ON public.shipping_rates 
  FOR UPDATE USING (false);
