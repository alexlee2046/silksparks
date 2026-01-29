-- Newsletter subscribers table
-- Stores email subscriptions from footer and other sources

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ,
  source TEXT DEFAULT 'footer' CHECK (source IN ('footer', 'checkout', 'signup', 'popup')),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for email lookup
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email
  ON newsletter_subscribers(email);

-- Index for active subscribers
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active
  ON newsletter_subscribers(subscribed_at)
  WHERE unsubscribed_at IS NULL;

-- RLS policies
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (insert)
CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscribers
  FOR INSERT
  WITH CHECK (true);

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON newsletter_subscribers
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Users can update their own subscription (unsubscribe)
CREATE POLICY "Users can unsubscribe"
  ON newsletter_subscribers
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON newsletter_subscribers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

COMMENT ON TABLE newsletter_subscribers IS 'Newsletter email subscriptions';
COMMENT ON COLUMN newsletter_subscribers.source IS 'Where the subscription originated from';
COMMENT ON COLUMN newsletter_subscribers.is_verified IS 'Whether the email has been verified via double opt-in';
