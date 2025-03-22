import { createClient } from '@supabase/supabase-js'

// Debug environment variables
console.log('Environment check:');
console.log('- import.meta.env available:', typeof import.meta !== 'undefined' && !!import.meta.env);
console.log('- process.env available:', typeof process !== 'undefined' && !!process.env);

// Try all possible environment variable names
const supabaseUrl = 
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PUBLIC_SUPABASE_URL) || 
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_PUBLIC_SUPABASE_URL) || 
  (typeof process !== 'undefined' && process.env && process.env.PUBLIC_SUPABASE_URL) || 
  (typeof process !== 'undefined' && process.env && process.env.SUPABASE_URL) || 
  'https://asswafzcwlijbmpujslf.supabase.co'; // Fallback to hardcoded value

const supabaseAnonKey = 
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PUBLIC_SUPABASE_ANON_KEY) || 
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY) || 
  (typeof process !== 'undefined' && process.env && process.env.PUBLIC_SUPABASE_ANON_KEY) || 
  (typeof process !== 'undefined' && process.env && process.env.SUPABASE_ANON_KEY) || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzc3dhZnpjd2xpamJtcHVqc2xmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMTI4MzEsImV4cCI6MjA1NzU4ODgzMX0.KQeypYeYRjayckR3UEhAzfiiWxzIxC4Uc4gywBW2ZbM'; // Fallback to hardcoded value

console.log('Supabase URL found:', !!supabaseUrl);
console.log('Supabase Key found:', !!supabaseAnonKey);

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
