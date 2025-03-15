import { createClient } from '@supabase/supabase-js'

// Default placeholder values - these will be replaced by environment variables
const DEFAULT_URL = "https://your-project.supabase.co";
const DEFAULT_KEY = "your-anon-key";

// Determine if we're in a Node.js environment or browser/Astro environment
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

let supabaseUrl;
let supabaseAnonKey;

if (isNode) {
  // In Node.js environment, use process.env
  try {
    // Try to load from .env file if dotenv is available
    require('dotenv').config();
  } catch (e) {
    // dotenv might not be installed, which is fine
  }

  // Use environment variables with fallbacks
  supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_URL;
  supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_KEY;
  
  console.log("Node.js environment detected");
} else {
  // In browser/Astro environment
  try {
    // Try to use import.meta.env first
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
      supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
      console.log("Using import.meta.env variables");
    }
  } catch (e) {
    console.log("Error accessing import.meta.env:", e.message);
  }
  
  // Fall back to default values if needed
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log("Falling back to default Supabase credentials - please set environment variables");
    supabaseUrl = DEFAULT_URL;
    supabaseAnonKey = DEFAULT_KEY;
  }
}

console.log("Supabase URL available:", !!supabaseUrl);
console.log("Supabase Anon Key available:", !!supabaseAnonKey);

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
