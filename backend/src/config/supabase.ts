import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './index';

// Create Supabase client with service role (for server-side operations)
export const supabase: SupabaseClient = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Create client for user authentication (with anon key)
export const supabaseAuth: SupabaseClient = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

export default supabase;