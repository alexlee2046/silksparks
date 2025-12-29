import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wmippjaacispjsltjfof.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtaXBwamFhY2lzcGpzbHRqZm9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NTQ0MDIsImV4cCI6MjA4MjUzMDQwMn0.R97-dN_1KkwPcA9hgKyciMPMGGQnimIty9iy9PHWDkI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
