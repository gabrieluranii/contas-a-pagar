import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () =>
  Boolean(supabaseUrl && supabaseKey &&
    supabaseUrl !== 'your-supabase-url' &&
    supabaseKey !== 'your-anon-key');

export const sb = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const getUser = async () => {
  if (!sb) return null;
  const { data: { user } } = await sb.auth.getUser();
  return user;
};
