// Direct connection to Supabase for scripts (not using environment variables)
import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase URL and anon key
const supabaseUrl = 'https://your-project-url.supabase.co';
const supabaseKey = 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);
