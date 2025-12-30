-- Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create Policy: Admins have full access
CREATE POLICY "Admins can perform all actions on system_settings"
ON public.system_settings
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE is_admin = true
  )
);

-- Note: No policy for public/authenticated non-admins means they have NO access (Implicit Deny).
-- If the frontend needs to read specific non-sensitive settings (like payment_mode), 
-- we would need a separate policy or a specific DB function. 
-- For now, we assume strict security is creating a firewall around these settings.