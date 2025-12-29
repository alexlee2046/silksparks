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
