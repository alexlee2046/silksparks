-- Admin Audit Logs Migration
-- Track sensitive admin operations for compliance and debugging

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,              -- 'delete_product', 'update_price', 'change_role', etc.
  target_type TEXT NOT NULL,         -- 'product', 'order', 'user', 'setting', etc.
  target_id TEXT,                    -- ID of the affected resource
  old_value JSONB,                   -- Value before change
  new_value JSONB,                   -- Value after change
  metadata JSONB DEFAULT '{}',       -- Additional context (reason, notes, etc.)
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.admin_audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

-- Composite index for admin activity timeline
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_timeline
  ON public.admin_audit_logs(admin_id, created_at DESC);

-- RLS Policies
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Only service role can insert (via Edge Functions or server-side)
-- This prevents admins from manually inserting fake logs
CREATE POLICY "Service role can insert audit logs"
  ON public.admin_audit_logs FOR INSERT
  WITH CHECK (false); -- Blocked for all authenticated users, only service_role bypasses RLS

-- No one can update or delete audit logs (immutable)
-- This is enforced by not having UPDATE/DELETE policies

-- Add comment for documentation
COMMENT ON TABLE public.admin_audit_logs IS 'Immutable audit trail for admin actions';
COMMENT ON COLUMN public.admin_audit_logs.action IS 'Action type: delete_product, update_price, change_role, update_setting, export_data, etc.';
COMMENT ON COLUMN public.admin_audit_logs.target_type IS 'Resource type: product, order, user, appointment, setting, etc.';
