import { createClient } from '@supabase/supabase-js';

// These environment variables are automatically injected by Lovable
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure you have connected your Supabase project in Lovable.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);