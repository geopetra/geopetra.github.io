import { createClient } from '@supabase/supabase-js'

// Get environment variables from the appropriate source
// For Node.js scripts (process.env) or Astro components (import.meta.env)
const supabaseUrl = typeof process !== 'undefined' && process.env ? 
  process.env.SUPABASE_URL : 
  import.meta.env.PUBLIC_SUPABASE_URL;

const supabaseAnonKey = typeof process !== 'undefined' && process.env ? 
  process.env.SUPABASE_ANON_KEY : 
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
