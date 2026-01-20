
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
		// 1. Obtener todos los usuarios de Auth
		const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
		if (authError) {
			console.error('[VerificaciónCorreo] Error listando usuarios de Auth:', authError);
			return;
		}

		if (!authData || !authData.users || authData.users.length === 0) {
			return;
		}

		// 2. Obtener todos los usuarios ya registrados en usuarios_web_movil
		const { data: usuariosExistentes, error: errorExistentes } = await supabase
			.from('usuarios_web_movil')
			.select('boleta, correo');

		if (errorExistentes) {
			console.error('[VerificaciónCorreo] Error obteniendo usuarios existentes:', errorExistentes);
			return;
		}

		const boletasExistentes = new Set(usuariosExistentes?.map(u => String(u.boleta)) || []);

		// 3. Procesar cada usuario de Auth
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
				continue;
			}

			// Usuario confirmado pero no registrado en tabla -> Crear
			const { error: insertError } = await supabase
				.from('usuarios_web_movil')
				.insert([{
					boleta: parseInt(boleta, 10),
					correo: correo,
					tiene_documentos: false
				}]);

			if (insertError) {
				console.error(`[VerificaciónCorreo] Error creando usuario boleta=${boleta}:`, insertError.message);
			}
		}
	} catch (err) {
		console.error('[VerificaciónCorreo] Error en verificación automática:', err);
	}
}

module.exports = { verificarCorreo };