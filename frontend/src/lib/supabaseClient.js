import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseUrl =
  rawSupabaseUrl && /^https?:\/\//i.test(rawSupabaseUrl)
    ? rawSupabaseUrl
    : `https://${(rawSupabaseUrl || '').replace(/^\/+/, '')}`;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
