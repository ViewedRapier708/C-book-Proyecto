
// Tarea programada para crear usuarios en usuarios_web_movil desde Auth
// Revisa todos los usuarios de Auth que hayan confirmado correo
// y crea su cuenta en usuarios_web_movil si no existe

let getClient;
try {
    ({ getClient } = require('../src/config/db'));
} catch (e) {
    ({ getClient } = require('../config/db'));
}

/**
 * Función programada que revisa todos los usuarios de Auth
 * y crea cuentas en usuarios_web_movil para aquellos que:
 * 1. Ya confirmaron su correo
 * 2. No existen en usuarios_web_movil
 */
async function verificarCorreo() {
  const supabase = getClient();
  
  try {
    console.log('[VerificaciónCorreo] Iniciando verificación de usuarios...');

    // 1. Obtener todos los usuarios de Auth
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('[VerificaciónCorreo] Error listando usuarios de Auth:', authError);
      return;
    }

    if (!authData || !authData.users || authData.users.length === 0) {
      console.log('[VerificaciónCorreo] No hay usuarios en Auth');
      return;
    }

    console.log(`[VerificaciónCorreo] ${authData.users.length} usuarios encontrados en Auth`);

    // 2. Obtener todos los usuarios ya registrados en usuarios_web_movil
    const { data: usuariosExistentes, error: errorExistentes } = await supabase
      .from('usuarios_web_movil')
      .select('boleta, correo');

    if (errorExistentes) {
      console.error('[VerificaciónCorreo] Error obteniendo usuarios existentes:', errorExistentes);
      return;
    }

    const boletasExistentes = new Set(usuariosExistentes?.map(u => String(u.boleta)) || []);
    console.log(`[VerificaciónCorreo] ${boletasExistentes.size} usuarios ya registrados en tabla`);

    // 3. Procesar cada usuario de Auth
    let usuariosCreados = 0;
    let usuariosIgnorados = 0;

    for (const usuario of authData.users) {
      const boleta = usuario.user_metadata?.boleta;
      const correo = usuario.email;
      const confirmado = !!usuario.email_confirmed_at;

      // Validar que tenga boleta y correo
      if (!boleta || !correo) {
        continue;
      }

      // Si no está confirmado, ignorar
      if (!confirmado) {
        continue;
      }

      // Si ya existe en usuarios_web_movil, ignorar
      if (boletasExistentes.has(String(boleta))) {
        usuariosIgnorados++;
        continue;
      }

      // Usuario confirmado pero no registrado en tabla -> Crear
      console.log(`[VerificaciónCorreo] Creando usuario en tabla: boleta=${boleta}, correo=${correo}`);

      const { error: insertError } = await supabase
        .from('usuarios_web_movil')
        .insert([{
          boleta: parseInt(boleta),
          correo: correo,
          tiene_documentos: false
        }]);

      if (insertError) {
        console.error(`[VerificaciónCorreo] Error creando usuario boleta=${boleta}:`, insertError.message);
      } else {
        usuariosCreados++;
        console.log(`[VerificaciónCorreo] ✅ Usuario creado exitosamente: boleta=${boleta}`);
      }
    }

    console.log(`[VerificaciónCorreo] Proceso completado: ${usuariosCreados} creados, ${usuariosIgnorados} ya existían`);

  } catch (err) {
    console.error('[VerificaciónCorreo] Error en verificación automática:', err);
  }
}

module.exports = { verificarCorreo };