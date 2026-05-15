import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

function normalizeSupabaseUrl(value) {
  if (!value) {
    throw new Error('Falta configurar VITE_SUPABASE_URL');
  }

  const normalizedValue = /^https?:\/\//i.test(value) ? value : `https://${value.replace(/^\/+/, '')}`;

  let parsedUrl;
  try {
    parsedUrl = new URL(normalizedValue);
  } catch {
    throw new Error(`VITE_SUPABASE_URL no es una URL valida: ${value}`);
  }

  if (!/\.supabase\.co$/i.test(parsedUrl.hostname)) {
    throw new Error(`VITE_SUPABASE_URL debe apuntar a tu proyecto de Supabase, no a ${parsedUrl.hostname}`);
  }

  return parsedUrl.origin;
}

if (!supabaseAnonKey) {
  throw new Error('Falta configurar VITE_SUPABASE_ANON_KEY');
}

const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
