// config/supabaseClient.js

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// ✅ Cargar las variables del archivo .env
dotenv.config()

// 🔹 Leer las variables de entorno
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY
console.log( SUPABASE_URL, SUPABASE_KEY )
// 🚨 Verificar si existen (para evitar errores)
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ ERROR: No se encontraron las variables SUPABASE_URL o SUPABASE_KEY en el archivo .env')
  process.exit(1) // Detiene la ejecución si faltan datos
}

// ✅ Crear el cliente de conexión
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

console.log('✅ Conexión a Supabase inicializada correctamente')
