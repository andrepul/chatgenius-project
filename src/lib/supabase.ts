import { supabase } from '@/integrations/supabase/client';

// Re-export the supabase client from the integrations folder
export { supabase };

// Test the connection
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('Error connecting to Supabase:', error);
  } else {
    console.log('Successfully connected to Supabase');
  }
});