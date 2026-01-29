-- BaZi Charts Table
-- Stores calculated BaZi (Four Pillars) data for users

CREATE TABLE IF NOT EXISTS bazi_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Birth data
  birth_date TIMESTAMPTZ NOT NULL,
  birth_hour INTEGER NOT NULL CHECK (birth_hour >= 0 AND birth_hour <= 23),
  timezone TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_name TEXT,

  -- Four Pillars (四柱)
  four_pillars JSONB NOT NULL,
  -- Structure: {
  --   year: { stem: "甲", branch: "子" },
  --   month: { stem: "丙", branch: "寅" },
  --   day: { stem: "戊", branch: "午" },
  --   hour: { stem: "庚", branch: "申" }
  -- }

  -- Day Master Analysis (日主分析)
  day_master JSONB NOT NULL,
  -- Structure: {
  --   stem: "甲",
  --   element: "木",
  --   yinYang: "阳",
  --   strength: "旺",
  --   strengthScore: 35,
  --   seasonalInfluence: { inSeason: true, seasonElement: "木", bonus: 30 },
  --   supportCount: 3,
  --   drainingCount: 2
  -- }

  -- Wu Xing Distribution (五行分布)
  wu_xing_distribution JSONB NOT NULL,
  -- Structure: { "木": 25, "火": 20, "土": 15, "金": 20, "水": 20 }

  -- Ten Gods Analysis (十神分析)
  ten_gods JSONB NOT NULL,
  -- Structure: {
  --   gods: [{ god: "比肩", stem: "甲", position: "year", isHidden: false }],
  --   distribution: { "比肩": 1, "劫财": 0, ... },
  --   dominant: "比肩",
  --   missing: ["偏财", "正财"]
  -- }

  -- Element Preferences (喜忌)
  element_preferences JSONB NOT NULL,
  -- Structure: {
  --   favorable: ["木", "水"],
  --   unfavorable: ["金", "火"],
  --   neutral: ["土"]
  -- }

  -- Cached Fusion Analysis (缓存的融合分析)
  fusion_analysis JSONB,
  -- Structure: {
  --   westernSigns: { sun: "Aries", moon: "Cancer", ... },
  --   fusionInsights: [ ... ],
  --   literatureQuotes: [ ... ],
  --   generatedAt: "2026-01-30T..."
  -- }

  -- Metadata
  version TEXT NOT NULL DEFAULT '1.0.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,

  -- Ensure one chart per user (can be updated)
  CONSTRAINT unique_user_bazi UNIQUE (user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bazi_charts_user_id ON bazi_charts(user_id);
CREATE INDEX IF NOT EXISTS idx_bazi_charts_day_master_element
  ON bazi_charts((day_master->>'element'));

-- RLS Policies
ALTER TABLE bazi_charts ENABLE ROW LEVEL SECURITY;

-- Users can read their own charts
CREATE POLICY "Users can view own bazi chart"
  ON bazi_charts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own charts
CREATE POLICY "Users can create own bazi chart"
  ON bazi_charts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own charts
CREATE POLICY "Users can update own bazi chart"
  ON bazi_charts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own charts
CREATE POLICY "Users can delete own bazi chart"
  ON bazi_charts FOR DELETE
  USING (auth.uid() = user_id);

-- Admin can read all charts
CREATE POLICY "Admin can view all bazi charts"
  ON bazi_charts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_bazi_charts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_bazi_charts_updated_at ON bazi_charts;
CREATE TRIGGER trigger_bazi_charts_updated_at
  BEFORE UPDATE ON bazi_charts
  FOR EACH ROW
  EXECUTE FUNCTION update_bazi_charts_updated_at();

-- Comments
COMMENT ON TABLE bazi_charts IS 'Stores BaZi (Four Pillars) astrology data for users';
COMMENT ON COLUMN bazi_charts.four_pillars IS 'Year, Month, Day, Hour pillars with stem and branch';
COMMENT ON COLUMN bazi_charts.day_master IS 'Day Master analysis including strength and seasonal influence';
COMMENT ON COLUMN bazi_charts.fusion_analysis IS 'Cached East-West fusion analysis results';
