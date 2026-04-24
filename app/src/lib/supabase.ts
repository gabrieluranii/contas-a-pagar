import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

export const isSupabaseConfigured = (): boolean => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && url !== 'your-supabase-url' && key !== 'your-anon-key');
};

export const sb: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    )
  : null;

export const getUser = async (): Promise<User | null> => {
  if (!sb) return null;
  const { data: { user } } = await sb.auth.getUser();
  return user;
};
