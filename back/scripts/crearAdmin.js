/**
 * Script para convertir un usuario existente en administrador
 * Uso: node scripts/crearAdmin.js <boleta>
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan variables de entorno SUPABASE_URL o SUPABASE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function crearAdmin(boleta) {
  try {
    console.log(`🔍 Buscando usuario con boleta: ${boleta}...`);

    // Verificar que el usuario existe
    const { data: usuario, error: errorBusqueda } = await supabase
      .from('usuarios_web_movil')
      .select('*')
      .eq('boleta', boleta)
      .single();

    if (errorBusqueda || !usuario) {
      console.error('❌ Error: No se encontró usuario con esa boleta');
      console.error('Asegúrate de que el usuario esté registrado primero');
      return;
    }

    console.log('✅ Usuario encontrado:', {
      boleta: usuario.boleta,
      nombre: usuario.nombre,
      email: usuario.email,
      tipo_actual: usuario.tipo_usuario || 'estudiante'
    });

    // Actualizar a administrador
    const { data: actualizado, error: errorActualizar } = await supabase
      .from('usuarios_web_movil')
      .update({ tipo_usuario: 'administrador' })
      .eq('boleta', boleta)
      .select();

    if (errorActualizar) {
      console.error('❌ Error al actualizar:', errorActualizar);
      return;
    }

    console.log('✅ Usuario actualizado exitosamente a ADMINISTRADOR');
    console.log('Ahora puedes iniciar sesión con esta boleta en: http://127.0.0.1:5500/index.html');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Obtener boleta de los argumentos
const boleta = process.argv[2];

if (!boleta) {
  console.error('❌ Error: Debes proporcionar una boleta');
  console.log('Uso: node scripts/crearAdmin.js <boleta>');
  console.log('Ejemplo: node scripts/crearAdmin.js 2020123456');
  process.exit(1);
}

if (!/^\d{10}$/.test(boleta)) {
  console.error('❌ Error: La boleta debe tener exactamente 10 dígitos');
  process.exit(1);
}

crearAdmin(boleta);
