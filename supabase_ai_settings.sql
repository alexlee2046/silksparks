-- Insert AI Configuration Settings

-- AI Model Configuration
INSERT INTO public.system_settings (key, value)
VALUES 
    ('ai_config', '{
        "provider": "google",
        "model": "gemini-pro",
        "temperature": 0.7,
        "max_tokens": 2048
    }'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- AI Prompts
INSERT INTO public.system_settings (key, value)
VALUES 
    ('ai_prompts', '{
        "daily_spark": "Act as a mystical astrology expert. Give me a short, one-sentence daily spark or horoscope insight for today. Make it sound profound but modern. Target audience: {{sign}}. Max 20 words.",
        "tarot_interpretation": "You are an expert Tarot reader. The user asks: {{question}}. The card drawn is {{cardName}}. Provide a concise, 3-sentence interpretation. 1. The cards core meaning. 2. How it relates to the question. 3. A one-sentence actionable advice. Tone: Mystical, empowering, supportive.",
        "birth_chart_analysis": "Act as a master astrologer. Analyze the birth chart for {{name}}. Planets: {{planets}}. Five Elements: {{elements}}. Provide a 2-paragraph insight. Paragraph 1: Core identity analysis based on Sun/Moon and dominant elements. Paragraph 2: Current life theme or advice. Tone: Profound, mystical, yet grounded and modern. Avoid generic horoscopes."
    }'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
