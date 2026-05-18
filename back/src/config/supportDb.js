const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') }) || require('dotenv').config();

let supportClient = null;

function ensureSupportEnv() {
  const url = (process.env.SUPABASE_SUPORT_URL || process.env.SUPABASE_SUPPORT_URL || '').trim();
  const key = (
    process.env.SUPABASE_SUPORT_KEY ||
    process.env.SUPABASE_SUPPORT_KEY ||
    process.env.SUPABASE_SUPORT_SERVICE_KEY ||
    process.env.SUPABASE_SUPPORT_SERVICE_KEY ||
    ''
  ).trim();

  if (!url || !key) {
    throw new Error('SUPABASE_SUPORT_URL y SUPABASE_SUPORT_KEY deben estar configurados');
  }

  return { url, key };
}

function getSupportClient() {
  const { url, key } = ensureSupportEnv();
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function safeHost(url) {
  try {
    return new URL(url).host;
  } catch {
    return 'url-invalida';
  }
}

module.exports = { getSupportClient, safeHost };
