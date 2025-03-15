import { createClient } from '@supabase/supabase-js'

// Determine if we're in a Node.js environment or browser/Astro environment
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

let supabaseUrl;
let supabaseAnonKey;

if (isNode) {
  // In Node.js environment, use process.env
  // Make sure these are set in your .env file
  try {
    // Try to load from .env file if dotenv is available
    require('dotenv').config();
  } catch (e) {
    // dotenv might not be installed, which is fine
  }

  supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
} else {
  // In browser/Astro environment, use import.meta.env
  try {
    supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  } catch (e) {
    console.error("Error accessing import.meta.env:", e);
  }
  
  // Fallback to hardcoded values for development only
  // IMPORTANT: Replace these with your actual Supabase credentials
  // and remove before deploying to production
  if (!supabaseUrl) {
    console.warn("Using fallback Supabase URL - replace with your actual URL");
    supabaseUrl = "https://asswafzcwlijbmpujslf.supabase.co";
  }
  
  if (!supabaseAnonKey) {
    console.warn("Using fallback Supabase Anon Key - replace with your actual key");
    supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzc3dhZnpjd2xpamJtcHVqc2xmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMTI4MzEsImV4cCI6MjA1NzU4ODgzMX0.KQeypYeYRjayckR3UEhAzfiiWxzIxC4Uc4gywBW2ZbM";
  }
}

// Log the environment for debugging
console.log("Environment:", isNode ? "Node.js" : "Browser/Astro");
console.log("Supabase URL available:", !!supabaseUrl);
console.log("Supabase Anon Key available:", !!supabaseAnonKey);

// Throw a more helpful error if the keys are missing
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL and Anon Key are required. ' +
    'In Astro, set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY in .env file. ' +
    'In Node.js scripts, set SUPABASE_URL and SUPABASE_ANON_KEY in .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
