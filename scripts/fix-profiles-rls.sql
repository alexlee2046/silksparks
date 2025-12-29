-- 修复 profiles 表的 RLS 策略
-- 问题：缺少 INSERT 策略，导致新用户无法创建自己的 profile

-- 添加 INSERT 策略：用户只能为自己创建 profile
CREATE POLICY "用户只能创建自己的资料" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 验证策略是否创建成功
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';
