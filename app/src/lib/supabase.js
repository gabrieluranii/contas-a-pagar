import { createClient } from '@supabase/supabase-js';

export const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && url !== 'your-supabase-url' && key !== 'your-anon-key');
};

export const sb = typeof window !== 'undefined' && isSupabaseConfigured()
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : isSupabaseConfigured() 
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) 
    : null;

export const getUser = async () => {
  if (!sb) return null;
  const { data: { user } } = await sb.auth.getUser();
  return user;
};
