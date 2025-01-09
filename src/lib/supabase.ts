import { createClient } from '@supabase/supabase-js';

// These environment variables are automatically injected by Lovable
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Add detailed logging to help debug connection issues
console.log('Initializing Supabase client with:', {
  url: supabaseUrl ? 'Present' : 'Missing',
  key: supabaseKey ? 'Present' : 'Missing'
});

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials:', {
    url: supabaseUrl ? 'Present' : 'Missing',
    key: supabaseKey ? 'Present' : 'Missing'
  });
  throw new Error('Missing Supabase credentials. Make sure you have connected your Supabase project in Lovable.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Test the connection
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('Error connecting to Supabase:', error);
  } else {
    console.log('Successfully connected to Supabase');
  }
});