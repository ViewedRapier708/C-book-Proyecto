
let client = null;
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
// Carga .env siempre desde la raíz de 'back', sin depender del cwd
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') }) || require('dotenv').config();

function ensureEnv() {
  const url = (process.env.SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '').trim();

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
  return connect();
}

module.exports = { connect, getClient };