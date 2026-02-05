-- 1. 用户资料表 (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  birth_date TIMESTAMP WITH TIME ZONE,
  birth_place TEXT,
  lat NUMERIC,
  lng NUMERIC,
  points INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'Star Walker',
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 系统设置表 (System Settings)
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 币种设置 (Currencies)
CREATE TABLE IF NOT EXISTS public.currencies (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  rate NUMERIC NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 运费模板 (Shipping Zones & Rates)
CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shipping_rates (
  id SERIAL PRIMARY KEY,
  zone_id INTEGER REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 产品表 (Products)
CREATE TABLE IF NOT EXISTS public.products (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  price NUMERIC NOT NULL,
  element TEXT,
  image_url TEXT,
  badge TEXT,
  category TEXT,
  description TEXT,
  vibe TEXT,
  ritual TEXT,
  wisdom TEXT,
  rating NUMERIC DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 专家表 (Experts)
CREATE TABLE IF NOT EXISTS public.experts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  rating NUMERIC DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  price_per_min NUMERIC NOT NULL,
  image_url TEXT,
  is_online BOOLEAN DEFAULT TRUE,
  tags TEXT[],
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 咨询服务表 (Consultations)
CREATE TABLE IF NOT EXISTS public.consultations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expert_id UUID REFERENCES public.experts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  duration INTEGER, -- 分钟
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 订单表 (Orders)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  total NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. 订单明细 (Order Items)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES public.products(id),
  consultation_id UUID REFERENCES public.consultations(id),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  image_url TEXT,
  type TEXT NOT NULL, -- 'product' or 'service'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. 档案/日志表 (Archives)
CREATE TABLE IF NOT EXISTS public.archives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'Astrology' or 'Tarot'
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 安全策略 (Row Level Security - RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能查看自己的资料" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "用户只能创建自己的资料" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "用户只能更新自己的资料" ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.archives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能查看自己的档案" ON public.archives FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户只能创建自己的档案" ON public.archives FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能查看自己的订单" ON public.orders FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "所有人可查看产品" ON public.products FOR SELECT USING (true);

ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "所有人可查看专家" ON public.experts FOR SELECT USING (true);

-- 示例数据导入 (部分)
INSERT INTO public.currencies (name, code, rate, is_default) VALUES
('United States Dollar', 'USD', 1.0, true),
('Euro', 'EUR', 0.92, false),
('British Pound', 'GBP', 0.79, false),
('Chinese Yuan', 'CNY', 7.24, false);

INSERT INTO public.system_settings (key, value) VALUES
('payment_mode', '{"mode": "live", "stripe_connected": true, "paypal_connected": true}');

-- 示例专家数据
INSERT INTO public.experts (name, title, rating, review_count, price_per_min, image_url, is_online, tags, bio) VALUES
('Madame Luna', 'Vedic Astrologer', 5.0, 124, 4.99, 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZ3QcnzwRBOcqrDirRwX-55X8MrEPSe9cmK7bcZCcgdWLgTy8ei-ZTccTrYTk29pUG1J_9nGewTpAa9cFVoZdUT8F1l4A5l0qp-zXz4KeMlfccSqmZuJfkBNddUs37QmmV97qc57JV5G5bmhzrDFjryW6-FmCCvTPnAmms_UaV9dbbAVqILt7GoVChJGRKfMaHxuH3Jb4tqBXEq1zGmpUzsTPkzLMWjeFed37h5GDhg23VS4Qe2hltjMKnHjGgM0wUDzEkvO25cfuW', true, ARRAY['Vedic', 'Career', 'Love'], 'Master Vedic Astrologer with 20+ years of experience.'),
('Dr. Orion Star', 'Numerologist & Guide', 4.8, 89, 3.50, 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxw22VgA5Cvl-A6GU7xjeBDwwUFB5axXfjKNC-U-8MzCH-p6_xaLq5Cwm_KpA4WQIL8U3T2Meus356t2g9O_P4YkFJH1_6078o5d2ED_-hE1QY7nwZ8CuqczQlYzm9C4g-nDmKcPVDIsJTN1e6XdBXplNI9mUWCeFGKbVmPfYKMA0kYDv2n062E9Vkyk0CABEnw8XcmZFzr5sr6ArY2gjzWMFLm7UXpkByGE22pydE1GTp5C_5p2wEzgSZtk3TR0GUVk8R9g3e2MIf', true, ARRAY['Numerology', 'Life Path'], 'PhD in Metaphysical Sciences, blending ancient wisdom with modern understanding.'),
('Selene Mystic', 'Intuitive Tarot Reader', 4.9, 210, 5.25, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfu8drFjzFAoN_gw744HmZL1_-4gTbuQmaXzsVGwaw1xF2zN9xBve3D7WYrniEqwvU9svW_jqyislzCVgnjlpThmLCEsk6aGTCijwpluCjNNmHp7YEzMUpO3FPBRLTxFFvbhBE5LV6Cjx7GjYjg_DpsYBRvAw5EmPEWzXYdqhJ_crpzC7EHmKpTfjqZjW9Te4k4BnWFMnTp5FAVXykzSNopdipnaHqdE9WDoXVSlCkMzbtmh1nFfe4HViX8FgiS1-EQdy7cGwguDvO', false, ARRAY['Tarot', 'Relationships', 'Clarity'], 'Third-generation tarot reader with a gift for intuitive guidance.'),
('Elena Starweaver', 'Master Vedic Astrologer', 5.0, 342, 6.00, 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZqThemyIec2Fl5d3Dygwq3Y_pYTTz1Lif8pojUCBG7I44AquGF_jiX3IVXwFAJNWpqZQfe60u1LX9HgMVqhS5IlTMPtJfI7iNVplUWU76_6JMTxgiy04O6Ks1ncFk5mY45SClnc9IHg7elAd9qj_L9Fqs5ipGl1XjiUOmCRIgfJ_etCORnWW8bciDBe--GQKvcJuS1uLa-4cVNwksw1fSfQF681eMJzaYiKT_kyQP6_VoN4kL_hk_opdyZuqRnbXQcn4m5m3uGHtO', true, ARRAY['Vedic', 'Tarot', 'Karma'], 'Master Vedic Astrologer & Tarot Reader with 15+ years of experience guiding souls to clarity.');

-- 示例产品数据
INSERT INTO public.products (title, price, element, image_url, badge, category, description) VALUES
('Amethyst Cluster', 45.00, 'Spirit', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDP_bOhhc4Qhi372N4ioSuuVYgGCi6TW47C5lsipQPgu03yvsFASSxchHfbCkDmGCLoiu47AnTebH1rd07SeZodgMZ95G-MCC98JvDG6bfqv8P7_wdBgl69J6uoLEe9Iu5N3CfEck0yH_5z7qJDoiG0LxKpUdT04CuIXJxzOIWaMP0jX8F3MYq6uetECncxUOI3qmruDpTcuQYyacZWCct9xUq89A_N6YubdHPiEEe0Q7jElnj1O3YXVeT2tOsB3qGi2H4hvvJ-EWat', 'Bestseller', 'Crystals', 'Beautiful natural amethyst cluster for spiritual clarity and protection.'),
('Golden Tarot Deck', 32.00, 'Fire', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjitvq9kRFe5CuRifKd6XQXh1LXQRr1fXoy_IKJveYKScvcD9_AniPcIvWpjno-w6JeQCpEryUuQpR_37v-bRA1hbg3YaUEz0PhOnw4zRrDMFcJzdeTDsvHWQWHRP1youUaRsJySNHBdlTYNUId5J99pskk7aoezdWY927fJ8zuJX_UPwjONUocANU29YLZGcr8QLx6fTJN8t66UTLNjMc7tcokl_WVh0Zi5CNS9w7ENRBTxJnefOf7_b7TXJL4PP3JhuOn1VaZApA', 'Limited Edition', 'Tarot', 'Limited edition golden tarot deck for divination.'),
('Sage Bundle', 12.00, 'Air', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBk3poV6quSXOoNErUgmqhtfis7nYaRN_n2urnfm51EGatpRyUph1c9O-semyeWwN_zV3RSmfoWPee_WhODcfQPMXJ6_wunKWjRteFm8kd-5pzmrtB9dhjHDzoTguzysDjEYcf6_SqRqF7UG7QgEn8ZeU06HRRMccexpzMqJgwUlIQ5DMK0TkYEwU6jRPTW9vVuvqg', NULL, 'Cleansing', 'White sage bundle for cleansing and purification rituals.'),
('Moonstone Pendant', 55.00, 'Water', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAzd5B9TSFjJHvoO2Ugw-WTMlOpKYfopG8DNLyqr7Q4EG7ETvB4U2G4mTB12Ym8Ez3UzokdE8NrM1GRyRl7KCLTkoGPDyGUps5fFY13m-73YX2yAlgFUegofFABEZ5UAuLdh-kigNKDvfT0ZUqQ2_RFH6l4M_daBpt2v3QAV47hTroa8GKmzJ4TrFcgzYqVxBVUUWTKQFTruqdmSXHWT_Ii5o0rL6fBAm0Y8DZqc25PqoyipKx66LdfOCaPK0W5G4pl_2e_yqQmWzUY', 'New', 'Jewelry', 'Genuine moonstone pendant for enhancing intuition and dreams.'),
('The Mystic Oud Candle', 45.00, 'Earth', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBVcw7kCDLa8cjlN-Cpv6lAWzfEKIStgYXZZteeoIzSDzdGYs_4qE1K5BMv79WJjraNSNzy5Ve0xJ_6HPtAlsBEaAjFS7U0f6NUTXjKyZVOV665EBdL_YGpoGgqzCCOHOFX3u8lUx8KzrhSVuQ4X0Kz601UNyhTIJH_l0WTUT9ARN0BwH1Mbcyl3_osD7AcvrCABsSERr8ZXfANvM0tGO1Hp_Ko68cqEyz8hdGfmpcbKHyhUbzMBT6rhqhc0Gkem4K148akYmdosJ1', 'Sacred Series', 'Candles', 'Hand-poured soy wax blended with rare Oud wood essence.'),
('Rose Quartz Heart', 28.00, 'Water', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDP_bOhhc4Qhi372N4ioSuuVYgGCi6TW47C5lsipQPgu03yvsFASSxchHfbCkDmGCLoiu47AnTebH1rd07SeZodgMZ95G-MCC98JvDG6bfqv8P7_wdBgl69J6uoLEe9Iu5N3CfEck0yH_5z7qJDoiG0LxKpUdT04CuIXJxzOIWaMP0jX8F3MYq6uetECncxUOI3qmruDpTcuQYyacZWCct9xUq89A_N6YubdHPiEEe0Q7jElnj1O3YXVeT2tOsB3qGi2H4hvvJ-EWat', NULL, 'Crystals', 'Polished rose quartz heart stone for love and emotional healing.');

-- 示例运费区域和费率数据
INSERT INTO public.shipping_zones (name, region) VALUES
('Domestic US', 'United States'),
('International', 'Worldwide'),
('Express', 'Worldwide');

INSERT INTO public.shipping_rates (zone_id, name, price, description) VALUES
(1, 'Standard Shipping', 5.99, '5-7 business days'),
(1, 'Express Shipping', 12.99, '2-3 business days'),
(1, 'Free Shipping', 0.00, 'Orders over $75'),
(2, 'International Standard', 15.99, '10-14 business days'),
(2, 'International Express', 29.99, '5-7 business days'),
(3, 'Priority Express', 24.99, '1-2 business days');

-- 11. 塔罗牌库 (Tarot Cards)
CREATE TABLE IF NOT EXISTS public.tarot_cards (
  id TEXT PRIMARY KEY, -- e.g. 'm00', 'w01'
  name TEXT NOT NULL,
  arcana TEXT NOT NULL, -- 'Major' or 'Minor'
  suit TEXT, -- 'Wands', 'Cups', etc.
  image_url TEXT NOT NULL,
  keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.tarot_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "所有人可查看塔罗牌" ON public.tarot_cards FOR SELECT USING (true);

INSERT INTO public.tarot_cards (id, name, arcana, suit, image_url, keywords) VALUES
('m00', 'The Fool', 'Major', NULL, '/assets/tarot/tarot-major-0-42043244c79fc1b1.jpg', ARRAY['New beginnings', 'Optimism', 'Faith']),
('m01', 'The Magician', 'Major', NULL, '/assets/tarot/tarot-major-1-6476367511504b5f.jpg', ARRAY['Action', 'Manifestation', 'Power']),
('m02', 'The High Priestess', 'Major', NULL, '/assets/tarot/tarot-major-2-a6def1e2445cdf9f.jpg', ARRAY['Intuition', 'Mystery', 'Wisdom']),
('m03', 'The Empress', 'Major', NULL, '/assets/tarot/tarot-major-3-85cd590a7e0e6ec7.jpg', ARRAY['Abundance', 'Nurturing', 'Creativity']),
('m04', 'The Emperor', 'Major', NULL, '/assets/tarot/tarot-major-4-7380b1904f48ffd0.jpg', ARRAY['Structure', 'Authority', 'Stability']),
('m05', 'The Hierophant', 'Major', NULL, '/assets/tarot/tarot-major-5-98e0942b64b895b5.jpg', ARRAY['Tradition', 'Guidance', 'Wisdom']),
('m06', 'The Lovers', 'Major', NULL, '/assets/tarot/tarot-major-6-3baa3420cca38224.jpg', ARRAY['Love', 'Harmony', 'Choices']),
('m07', 'The Chariot', 'Major', NULL, '/assets/tarot/tarot-major-7-6731bdd32ad34906.jpg', ARRAY['Victory', 'Willpower', 'Direction']),
('m08', 'Strength', 'Major', NULL, '/assets/tarot/tarot-major-8-7cf26f5fbe905cd4.jpg', ARRAY['Courage', 'Inner Strength', 'Compassion']),
('m09', 'The Hermit', 'Major', NULL, '/assets/tarot/tarot-major-9-6f1f533055ff354a.jpg', ARRAY['Wisdom', 'Solitude', 'Introspection']),
('m10', 'Wheel of Fortune', 'Major', NULL, '/assets/tarot/tarot-major-10-6600306b7ecf8a76.jpg', ARRAY['Cycles', 'Luck', 'Change']),
('m11', 'Justice', 'Major', NULL, '/assets/tarot/tarot-major-11-4fc0a82e38a5972a.jpg', ARRAY['Fairness', 'Truth', 'Balance']),
('m12', 'The Hanged Man', 'Major', NULL, '/assets/tarot/tarot-major-12-3a8ccf98db7d04a8.jpg', ARRAY['Surrender', 'New Perspective', 'Patience']),
('m13', 'Death', 'Major', NULL, '/assets/tarot/tarot-major-13-23b8be15633f8945.jpg', ARRAY['Transformation', 'Endings', 'Rebirth']),
('m14', 'Temperance', 'Major', NULL, '/assets/tarot/tarot-major-14-0aed89c9e8b7108d.jpg', ARRAY['Balance', 'Moderation', 'Harmony']),
('m15', 'The Devil', 'Major', NULL, '/assets/tarot/tarot-major-15-b311203f411df750.jpg', ARRAY['Addiction', 'Shadow Self', 'Materialism']),
('m16', 'The Tower', 'Major', NULL, '/assets/tarot/tarot-major-16-826d59a7b1468820.jpg', ARRAY['Upheaval', 'Revelation', 'Collapse']),
('m17', 'The Star', 'Major', NULL, '/assets/tarot/tarot-major-17-5fb78a5f37a972db.jpg', ARRAY['Hope', 'Inspiration', 'Healing']),
('m18', 'The Moon', 'Major', NULL, '/assets/tarot/tarot-major-18-2364d8ac56751bf1.jpg', ARRAY['Illusion', 'Dreams', 'Mystery']),
('m19', 'The Sun', 'Major', NULL, '/assets/tarot/tarot-major-19-d40d8ea7f0c0c263.jpg', ARRAY['Success', 'Happiness', 'Vitality']),
('m20', 'Judgement', 'Major', NULL, '/assets/tarot/tarot-major-20-db753a49ab7633ea.jpg', ARRAY['Awakening', 'Judgment', 'Renewal']),
('m21', 'The World', 'Major', NULL, '/assets/tarot/tarot-major-21-734e52338d055159.jpg', ARRAY['Completion', 'Achievement', 'Travel']),
('w01', 'Ace of Wands', 'Minor', 'Wands', '/assets/tarot/tarot-wands-1-e65bc5ba30713d17.jpg', ARRAY['Creativity', 'Inspiration', 'Spark']),
('w02', 'Two of Wands', 'Minor', 'Wands', '/assets/tarot/tarot-wands-2-c53d8db32b75d99f.jpg', ARRAY['Planning', 'Future', 'Discovery']),
('w03', 'Three of Wands', 'Minor', 'Wands', '/assets/tarot/tarot-wands-3-263680b54479fb61.jpg', ARRAY['Expansion', 'Growth', 'Achievement']),
('w04', 'Four of Wands', 'Minor', 'Wands', '/assets/tarot/tarot-wands-4-7b6f3c47d0bd91a4.jpg', ARRAY['Celebration', 'Stability', 'Harmony']),
('w05', 'Five of Wands', 'Minor', 'Wands', '/assets/tarot/tarot-wands-5-be3e44530c03e68e.jpg', ARRAY['Competition', 'Conflict', 'Struggle']),
('w06', 'Six of Wands', 'Minor', 'Wands', '/assets/tarot/tarot-wands-6-6f0f6951c033eadd.jpg', ARRAY['Victory', 'Success', 'Recognition']),
('w07', 'Seven of Wands', 'Minor', 'Wands', '/assets/tarot/tarot-wands-7-e6e2507530b17dd9.jpg', ARRAY['Courage', 'Persistence', 'Defense']),
('w08', 'Eight of Wands', 'Minor', 'Wands', '/assets/tarot/tarot-wands-8-2705aa8da47e46bc.jpg', ARRAY['Speed', 'Action', 'Movement']),
('w09', 'Nine of Wands', 'Minor', 'Wands', '/assets/tarot/tarot-wands-9-e6658378c0b1a109.jpg', ARRAY['Resilience', 'Persistence', 'Strength']),
('w10', 'Ten of Wands', 'Minor', 'Wands', '/assets/tarot/tarot-wands-10-c8127457564eb842.jpg', ARRAY['Burden', 'Responsibility', 'Stress']),
('w11', 'Page of Wands', 'Minor', 'Wands', '/assets/tarot/tarot-wands-page-f46491339b2fd87f.jpg', ARRAY['Enthusiasm', 'Exploration', 'New Ideas']),
('w12', 'Knight of Wands', 'Minor', 'Wands', '/assets/tarot/tarot-wands-knight-90a605be684f6379.jpg', ARRAY['Action', 'Adventure', 'Fearlessness']),
('w13', 'Queen of Wands', 'Minor', 'Wands', '/assets/tarot/tarot-wands-queen-08b3b5bd681695d5.jpg', ARRAY['Confidence', 'Independence', 'Caring']),
('w14', 'King of Wands', 'Minor', 'Wands', '/assets/tarot/tarot-wands-king-177d091d45642b29.jpg', ARRAY['Leadership', 'Vision', 'Honesty']),
('c01', 'Ace of Cups', 'Minor', 'Cups', '/assets/tarot/tarot-cups-1-d8e46960f2d01cef.jpg', ARRAY['Love', 'Emotions', 'Intuition']),
('c02', 'Two of Cups', 'Minor', 'Cups', '/assets/tarot/tarot-cups-2-5c16b1eee7be3a85.jpg', ARRAY['Partnership', 'Unity', 'Connection']),
('c03', 'Three of Cups', 'Minor', 'Cups', '/assets/tarot/tarot-cups-3-b45bfaf88420f08d.jpg', ARRAY['Friendship', 'Community', 'Joy']),
('c04', 'Four of Cups', 'Minor', 'Cups', '/assets/tarot/tarot-cups-4-0b3423ddf359d29a.jpg', ARRAY['Apathy', 'Introspection', 'Reevaluation']),
('c05', 'Five of Cups', 'Minor', 'Cups', '/assets/tarot/tarot-cups-5-d63660523a5bcc14.jpg', ARRAY['Loss', 'Grief', 'Regret']),
('c06', 'Six of Cups', 'Minor', 'Cups', '/assets/tarot/tarot-cups-6-35074e29b815389e.jpg', ARRAY['Nostalgia', 'Childhood', 'Innocence']),
('c07', 'Seven of Cups', 'Minor', 'Cups', '/assets/tarot/tarot-cups-7-cd1a33ccd50675a0.jpg', ARRAY['Choices', 'Illusion', 'Fantasy']),
('c08', 'Eight of Cups', 'Minor', 'Cups', '/assets/tarot/tarot-cups-8-7ffb70edf13aea94.jpg', ARRAY['Abandonment', 'Seeking Truth', 'Withdrawal']),
('c09', 'Nine of Cups', 'Minor', 'Cups', '/assets/tarot/tarot-cups-9-13550c8d73cf9316.jpg', ARRAY['Contentment', 'Satisfaction', 'Wishes']),
('c10', 'Ten of Cups', 'Minor', 'Cups', '/assets/tarot/tarot-cups-10-916a3c6dc2dc65a5.jpg', ARRAY['Happiness', 'Peace', 'Family']),
('c11', 'Page of Cups', 'Minor', 'Cups', '/assets/tarot/tarot-cups-page-4bb3c5ed72a7237b.jpg', ARRAY['Creativity', 'Intuition', 'Idealism']),
('c12', 'Knight of Cups', 'Minor', 'Cups', '/assets/tarot/tarot-cups-knight-d07f26d2681a7e25.jpg', ARRAY['Romance', 'Charm', 'Imagination']),
('c13', 'Queen of Cups', 'Minor', 'Cups', '/assets/tarot/tarot-cups-queen-5ae87d65330a6302.jpg', ARRAY['Compassion', 'Nurturing', 'Calm']),
('c14', 'King of Cups', 'Minor', 'Cups', '/assets/tarot/tarot-cups-king-360de400f73f60c9.jpg', ARRAY['Control', 'Balance', 'Diplomacy']),
('s01', 'Ace of Swords', 'Minor', 'Swords', '/assets/tarot/tarot-swords-1-3bebb8eeba6e380e.jpg', ARRAY['Clarity', 'Truth', 'Breakthrough']),
('s02', 'Two of Swords', 'Minor', 'Swords', '/assets/tarot/tarot-swords-2-baada4175898facc.jpg', ARRAY['Indecision', 'Stalemate', 'Truce']),
('s03', 'Three of Swords', 'Minor', 'Swords', '/assets/tarot/tarot-swords-3-7769531aa9f1c61e.jpg', ARRAY['Heartbreak', 'Sorrow', 'Pain']),
('s04', 'Four of Swords', 'Minor', 'Swords', '/assets/tarot/tarot-swords-4-25d9de390a29de87.jpg', ARRAY['Rest', 'Recuperation', 'Solitude']),
('s05', 'Five of Swords', 'Minor', 'Swords', '/assets/tarot/tarot-swords-5-cd19407493650ef3.jpg', ARRAY['Conflict', 'Defeat', 'Betrayal']),
('s06', 'Six of Swords', 'Minor', 'Swords', '/assets/tarot/tarot-swords-6-9b49b2d0df8fd94c.jpg', ARRAY['Transition', 'Change', 'Journey']),
('s07', 'Seven of Swords', 'Minor', 'Swords', '/assets/tarot/tarot-swords-7-0012ca665760cc00.jpg', ARRAY['Deception', 'Strategy', 'Theft']),
('s08', 'Eight of Swords', 'Minor', 'Swords', '/assets/tarot/tarot-swords-8-66463d63544d0b04.jpg', ARRAY['Restriction', 'Powerlessness', 'Prison']),
('s09', 'Nine of Swords', 'Minor', 'Swords', '/assets/tarot/tarot-swords-9-b4641fcbe203aaac.jpg', ARRAY['Anxiety', 'Worry', 'Nightmares']),
('s10', 'Ten of Swords', 'Minor', 'Swords', '/assets/tarot/tarot-swords-10-e3e1dcc9a0cd3831.jpg', ARRAY['Ruin', 'Betrayal', 'Hitting Rock Bottom']),
('s11', 'Page of Swords', 'Minor', 'Swords', '/assets/tarot/tarot-swords-page-3969579bdf9f3487.jpg', ARRAY['Curiosity', 'Truth', 'Vigilance']),
('s12', 'Knight of Swords', 'Minor', 'Swords', '/assets/tarot/tarot-swords-knight-1834928f1e0a2c37.jpg', ARRAY['Ambition', 'Drive', 'Impulsive']),
('s13', 'Queen of Swords', 'Minor', 'Swords', '/assets/tarot/tarot-swords-queen-094d119544105d0e.jpg', ARRAY['Honesty', 'Independence', 'Sharp Wit']),
('s14', 'King of Swords', 'Minor', 'Swords', '/assets/tarot/tarot-swords-king-4730912676aa261e.jpg', ARRAY['Intellect', 'Authority', 'Truth']),
('p01', 'Ace of Pentacles', 'Minor', 'Pentacles', '/assets/tarot/tarot-pentacles-1-c9717ee444f022c8.jpg', ARRAY['Opportunity', 'Prosperity', 'Security']),
('p02', 'Two of Pentacles', 'Minor', 'Pentacles', '/assets/tarot/tarot-pentacles-2-fecc845d1b47cae3.jpg', ARRAY['Balance', 'Adaptability', 'Priorities']),
('p03', 'Three of Pentacles', 'Minor', 'Pentacles', '/assets/tarot/tarot-pentacles-3-564b52d68b30af6f.jpg', ARRAY['Teamwork', 'Skill', 'Collaboration']),
('p04', 'Four of Pentacles', 'Minor', 'Pentacles', '/assets/tarot/tarot-pentacles-4-4539fa68ac06a0ee.jpg', ARRAY['Security', 'Conservation', 'Control']),
('p05', 'Five of Pentacles', 'Minor', 'Pentacles', '/assets/tarot/tarot-pentacles-5-d71b72fea7ad7ef1.jpg', ARRAY['Hardship', 'Loss', 'Isolation']),
('p06', 'Six of Pentacles', 'Minor', 'Pentacles', '/assets/tarot/tarot-pentacles-6-c9deebe03464bc89.jpg', ARRAY['Generosity', 'Charity', 'Sharing']),
('p07', 'Seven of Pentacles', 'Minor', 'Pentacles', '/assets/tarot/tarot-pentacles-7-7d6a771308e7653c.jpg', ARRAY['Patience', 'Investment', 'Harvest']),
('p08', 'Eight of Pentacles', 'Minor', 'Pentacles', '/assets/tarot/tarot-pentacles-8-b9042623182f81ee.jpg', ARRAY['Diligence', 'Mastery', 'Craftsmanship']),
('p09', 'Nine of Pentacles', 'Minor', 'Pentacles', '/assets/tarot/tarot-pentacles-9-9f7887ee1d7a3d5a.jpg', ARRAY['Luxury', 'Independence', 'Abundance']),
('p10', 'Ten of Pentacles', 'Minor', 'Pentacles', '/assets/tarot/tarot-pentacles-10-3edd405c64ee5ac6.jpg', ARRAY['Wealth', 'Legacy', 'Stability']),
('p11', 'Page of Pentacles', 'Minor', 'Pentacles', '/assets/tarot/tarot-pentacles-page-2bc9a735017ce3a1.jpg', ARRAY['Opportunity', 'Ambition', 'Learning']),
('p12', 'Knight of Pentacles', 'Minor', 'Pentacles', '/assets/tarot/tarot-pentacles-knight-c4402bd564aa8470.jpg', ARRAY['Hard Work', 'Patience', 'Reliable']),
('p13', 'Queen of Pentacles', 'Minor', 'Pentacles', '/assets/tarot/tarot-pentacles-queen-1efbbba3b2e5785a.jpg', ARRAY['Nurturing', 'Practical', 'Abundance']),
('p14', 'King of Pentacles', 'Minor', 'Pentacles', '/assets/tarot/tarot-pentacles-king-6ca7fff779642736.jpg', ARRAY['Success', 'Security', 'Ambitious']);

