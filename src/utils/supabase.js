import { createClient } from '@supabase/supabase-js'

// Get Supabase credentials from environment variables with fallbacks
// This works in both Node.js scripts and Astro components
const supabaseUrl = 
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PUBLIC_SUPABASE_URL) || 
  (typeof process !== 'undefined' && process.env && process.env.PUBLIC_SUPABASE_URL) || 
  (typeof process !== 'undefined' && process.env && process.env.SUPABASE_URL) || 
  'https://asswafzcwlijbmpujslf.supabase.co';

const supabaseAnonKey = 
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PUBLIC_SUPABASE_ANON_KEY) || 
  (typeof process !== 'undefined' && process.env && process.env.PUBLIC_SUPABASE_ANON_KEY) || 
  (typeof process !== 'undefined' && process.env && process.env.SUPABASE_ANON_KEY) || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzc3dhZnpjd2xpamJtcHVqc2xmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMTI4MzEsImV4cCI6MjA1NzU4ODgzMX0.KQeypYeYRjayckR3UEhAzfiiWxzIxC4Uc4gywBW2ZbM';

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
