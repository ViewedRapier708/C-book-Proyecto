const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

let client = null;

function ensureEnv() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_URL y SUPABASE_[ANON|SERVICE]_KEY deben estar configurados en el archivo .env');
  }

  return { url, key };
}

function connect() {
  if (!client) {
    const { url, key } = ensureEnv();
    client = createClient(url, key);
    console.log('✅ Conexión a Supabase inicializada correctamente');
  }
  return client;
}

function getClient() {
  return client || connect();
}

module.exports = { connect, getClient };