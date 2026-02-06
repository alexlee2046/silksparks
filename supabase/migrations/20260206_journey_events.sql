CREATE TABLE journey_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_journey_events_session ON journey_events(session_id);
CREATE INDEX idx_journey_events_type ON journey_events(event_type);
CREATE INDEX idx_journey_events_created ON journey_events(created_at);

ALTER TABLE journey_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert journey events"
  ON journey_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Users read own events"
  ON journey_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin read all events"
  ON journey_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
