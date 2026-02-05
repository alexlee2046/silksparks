-- Create Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  expert_id UUID REFERENCES public.experts(id) ON DELETE SET NULL,
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE SET NULL,
  booked_at TIMESTAMP WITH TIME ZONE NOT NULL, -- The time of the appointment
  duration_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'noshow'
  meeting_link TEXT, -- Zoom/Google Meet link
  notes TEXT, -- Private notes for the expert
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can see their own appointments
CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT USING (auth.uid() = user_id);

-- Admins (and ostensibly Experts, simplified here) can view all
CREATE POLICY "Admins can view all appointments" ON public.appointments FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
);

-- Insert some dummy data for development
-- (Assuming we have at least one user and one expert from previous seeds, but IDs might be tricky to guess. 
--  Safest to insert via app or fetch IDs first, but for a migration script we might skip dummy data 
--  or try to select generic ones if possible.)

-- Let's try to insert a sample appointment if likely candidates exist
DO $$
DECLARE
  v_user_id UUID;
  v_expert_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM public.profiles LIMIT 1;
  SELECT id INTO v_expert_id FROM public.experts LIMIT 1;
  
  IF v_user_id IS NOT NULL AND v_expert_id IS NOT NULL THEN
    INSERT INTO public.appointments (user_id, expert_id, booked_at, status, meeting_link, notes)
    VALUES (v_user_id, v_expert_id, NOW() + INTERVAL '2 days', 'scheduled', 'https://meet.google.com/abc-defg-hij', 'Initial consultation');
  END IF;
END $$;
