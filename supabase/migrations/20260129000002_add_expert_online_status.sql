-- Add online status fields to experts table
-- Supports both explicit online flag and activity-based detection

ALTER TABLE experts
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- Create index for efficient online expert queries
CREATE INDEX IF NOT EXISTS idx_experts_is_online ON experts (is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_experts_last_active ON experts (last_active_at DESC NULLS LAST);

-- Add comments for documentation
COMMENT ON COLUMN experts.is_online IS 'Whether the expert is currently online and available';
COMMENT ON COLUMN experts.last_active_at IS 'Timestamp of expert last activity, used for computing online status if is_online is not set';

-- Function to update last_active_at (can be called from frontend or backend)
CREATE OR REPLACE FUNCTION update_expert_activity(p_expert_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE experts
  SET last_active_at = NOW()
  WHERE id = p_expert_id;
END;
$$;
