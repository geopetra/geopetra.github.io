import { createClient } from '@supabase/supabase-js'

// Hard-coded credentials for development
// These should match your .env file values
const SUPABASE_URL = "https://asswafzcwlijbmpujslf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzc3dhZnpjd2xpamJtcHVqc2xmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMTI4MzEsImV4cCI6MjA1NzU4ODgzMX0.KQeypYeYRjayckR3UEhAzfiiWxzIxC4Uc4gywBW2ZbM";

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

  // Use environment variables or fall back to hard-coded values
  supabaseUrl = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || SUPABASE_URL;
  supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;
  
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
  
  // Fall back to hard-coded values if needed
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log("Falling back to hard-coded Supabase credentials");
    supabaseUrl = SUPABASE_URL;
    supabaseAnonKey = SUPABASE_ANON_KEY;
  }
}

console.log("Supabase URL available:", !!supabaseUrl);
console.log("Supabase Anon Key available:", !!supabaseAnonKey);

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
