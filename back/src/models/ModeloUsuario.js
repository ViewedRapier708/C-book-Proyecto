const { getClient } = require('../config/db');
const jwt = require('jsonwebtoken');
const { enviarCorreo } = require('../utils/servicioCorreo');

const RESET_TOKEN_TTL = '30m';

function getFrontendBaseUrl() {
  const fallback = process.env.NODE_ENV === 'production'
    ? 'https://c-book-proyecto.vercel.app'
    : 'http://localhost:5173';

  return (process.env.FRONTEND_URL || fallback).replace(/\/+$/, '');
}

function getResetTokenSecret() {
  return process.env.RESET_PASSWORD_SECRET || process.env.SESSION_SECRET || 'dev_session_secret_change_me';
}

async function buscarUsuarioAuthPorCorreo(correo) {
  const supabase = getClient();
  const normalizedEmail = String(correo || '').trim().toLowerCase();
  let page = 1;

  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });

    if (error) {
      throw error;
    }

    const usuario = (data?.users || []).find((u) => String(u.email || '').toLowerCase() === normalizedEmail);
    if (usuario) {
      return usuario;
    }

    if (!data?.users?.length || data.users.length < 1000) {
      break;
    }

    page += 1;
  }

  return null;
}

// ==================== REGISTRO ====================

// Verificar si la boleta ya existe en usuarios_web_movil
async function validarBoletaEnTabla(boleta) {
  const supabase = getClient();
  try {
 

const { data: boletaData, error: errorBoleta } = await supabase
  .from('boletas')
  .select('boleta')
  .eq('boleta', boleta)
  .maybeSingle();

if (errorBoleta) {
  console.error("Error validando boleta boletas:", errorBoleta);
  return false;
}
if (!boletaData) {
  return {respuesta:true,msg:"Boleta no encontrada verifique su boleta"};
}
 const { data: usuario, error } = await supabase
  .from('usuarios_web_movil')
  .select('boleta')
  .eq('boleta', boleta)
  .maybeSingle();

if (error) {
  console.error("Error validando boleta usuarios:", error);
  return false;
}

if (usuario) {
  return {respuesta:true,msg:"Boleta ya registrada en otra cuenta"};
}
return {respuesta:false,msg:"Registro de boleta disponible"};
  } catch (err) {
    console.error("Error en validarBoletaEnTabla:", err);
    return {respuesta:true,msg:"Error interno"};
  }
}

// Verificar si el correo ya existe en usuarios_web_movil
async function validarCorreoEnTabla(correo) {
  const supabase = getClient();
  try {
    const { data, error } = await supabase
      .from('usuarios_web_movil')
      .select('correo')
      .eq('correo', correo)
      .maybeSingle();

    if (error) {
      console.error("Error validando correo:", error);
      return false;
    }
    return !!data; // true si existe
  } catch (err) {
    console.error("Error en validarCorreoEnTabla:", err);
    return false;
  }
}

// Registrar usuario en Supabase Auth
async function registrarEnAuth(boleta, correo, password) {
  const supabase = getClient();
  try {
    const { data, error } = await supabase.auth.signUp({
      email: correo,
      password: password,
      options: {
        emailRedirectTo: "https://viewedrapier708.github.io/C-book-Proyecto/pantallasUs/confirmacionCorreo.html",
        data: { 
          boleta: boleta,
          rol: 'alumno'
        }
      }
    });


    if (error) {
      let mensaje = error.message;
      // Supabase suele devolver "Database error saving new user" cuando el correo ya existe en Auth
      if (error.message && error.message.toLowerCase().includes('database error saving new user')) {
        mensaje = 'Este correo ya está registrado. Intenta iniciar sesión o usa otro correo.';
      }
      console.error("Error registrando en Auth:", error);
      return { success: false, error: mensaje };
    }

    return { success: true, user: data.user };
  } catch (err) {
    console.error("Error en registrarEnAuth:", err);
    return { success: false, error: 'Error interno del servidor' };
  }
}

// Crear usuario en la tabla usuarios_web_movil
async function crearUsuarioEnTabla(boleta, correo) {
  const supabase = getClient();
  try {
    const { data, error } = await supabase
      .from('usuarios_web_movil')
      .insert([{
        boleta: parseInt(boleta),
        correo: correo,
        tiene_documentos: false
      }])
      .select();

    if (error) {
      console.error("Error insertando usuario:", error.message, error.details);
      return { success: false, error: error.message };
    }

    return { success: true, data: data };
  } catch (err) {
    console.error("Error en crearUsuarioEnTabla:", err);
    return { success: false, error: 'Error interno' };
  }
}

// ==================== VERIFICACIÓN ====================
// Verificar si el correo fue confirmado por boleta
async function verificarConfirmacionPorBoleta(boleta) {
  const supabase = getClient();
  try {
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error("Error listando usuarios:", error);
      return { confirmado: false, error: error.message };
    }

    const usuario = data.users.find(u => u.user_metadata?.boleta === boleta);

    if (!usuario) {
      return { confirmado: false, error: 'Usuario no encontrado' };
    }

    const confirmado = !!usuario.email_confirmed_at;
    return { 
      confirmado: confirmado, 
      usuario: usuario,
      correo: usuario.email 
    };
  } catch (err) {
    console.error("Error en verificarConfirmacionPorBoleta:", err);
    return { confirmado: false, error: 'Error interno' };
  }
}

// ==================== LOGIN ====================

// Buscar correo por boleta
async function buscarCorreoPorBoleta(boleta) {
  const supabase = getClient();
  try {
    const { data, error } = await supabase
      .from('usuarios_web_movil')
      .select('correo')
      .eq('boleta', boleta)
      .maybeSingle();

    if (error) {
      console.error("Error buscando correo:", error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    return { success: true, correo: data.correo };
  } catch (err) {
    console.error("Error en buscarCorreoPorBoleta:", err);
    return { success: false, error: 'Error interno' };
  }
}

// Iniciar sesión con Supabase Auth
async function loginConAuth(correo, password) {
  const supabase = getClient();
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: correo,
      password: password
    });

    if (error) {
      let mensaje = 'Error al iniciar sesión';
      if (error.message.includes('Invalid login credentials')) {
        mensaje = 'Contraseña incorrecta';
      } else if (error.message.includes('Email not confirmed')) {
        mensaje = 'Debes confirmar tu correo antes de iniciar sesión';
      }
      return { success: false, error: mensaje };
    }
 
    return { 
      success: true, 
      session: data.session,
      user: data.user,
      nombre: data.user.user_metadata?.nombre || '',
      grupo: data.user.user_metadata?.grupo || ''
    };
  } catch (err) {
    console.error("Error en loginConAuth:", err);
    return { success: false, error: 'Error interno del servidor' };
  }
}

async function traerUsuarioInfo(boleta) {
  const supabase = getClient();
  try {
    const { data, error } = await supabase
      .from('usuarios_web_movil')
      .select(`
        boleta,
        correo,
        tiene_documentos,rol,
        boletas (
          boleta,
          nombre,
          Grupo
        )
      `)
      .eq('boleta', boleta)
      .single(); // Opcional si solo esperas un resultado

    if (error) {
      console.error("Error trayendo usuarios:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Error en traerUsuarios:", err);
    return { success: false, error: 'Error interno' };
  }
}

async function refrescarSesionSupabase(refreshToken) {
  const supabase = getClient();
  try {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

    if (error) {
      console.error('Error refrescando sesión Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true, session: data.session, user: data.user };
  } catch (err) {
    console.error('Error en refrescarSesionSupabase:', err);
    return { success: false, error: 'Error interno' };
  }
}

async function revocarSesionesSupabase(accessToken) {
  const supabase = getClient();
  try {
    if (!accessToken) {
      return { success: false, error: 'Access token inválido' };
    }

    const { error } = await supabase.auth.admin.signOut(accessToken);

    if (error) {
      console.error('Error revocando sesión Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Error en revocarSesionesSupabase:', err);
    return { success: false, error: 'Error interno' };
  }
}
//Cambio de contraseña y recuperación de contraseña
async function CambiarContraseña(correo) {
  try {
    const usuarioAuth = await buscarUsuarioAuthPorCorreo(correo);

    if (!usuarioAuth?.id) {
      return { success: false, error: 'Usuario no encontrado en autenticación' };
    }

    const token = jwt.sign(
      {
        purpose: 'password_recovery',
        sub: usuarioAuth.id,
        email: correo
      },
      getResetTokenSecret(),
      { expiresIn: RESET_TOKEN_TTL }
    );

    const resetUrl = `${getFrontendBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Roboto,Arial,sans-serif">
<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <div style="background:#6366f1;padding:28px 32px;text-align:center">
    <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">C-Book</h1>
  </div>
  <div style="padding:28px 32px">
    <h2 style="margin:0 0 8px;font-size:18px;color:#111827">Recuperación de contraseña</h2>
    <p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.6">
      Recibimos una solicitud para cambiar la contraseña de tu cuenta. Usa el siguiente botón para crear una nueva contraseña.
    </p>
    <p style="text-align:center;margin:28px 0">
      <a href="${resetUrl}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">
        Cambiar contraseña
      </a>
    </p>
    <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.5">
      Este enlace expira en 30 minutos. Si no solicitaste el cambio, ignora este correo.
    </p>
  </div>
  <div style="padding:16px 32px;background:#f9fafb;text-align:center;border-top:1px solid #e5e7eb">
    <p style="margin:0;font-size:11px;color:#9ca3af">Este correo fue generado automáticamente por C-Book.</p>
  </div>
</div>
</body></html>`;

    const enviado = await enviarCorreo(correo, 'Recuperación de contraseña - C-Book', html);

    if (!enviado.success) {
      return { success: false, error: 'No se pudo enviar el correo de recuperación' };
    }

    return { success: true };
  } catch (err) {
    console.error('Error en CambiarContraseña:', err);
    return { success: false, error: 'Error interno' };
  }
}

async function ActualizarContraseñaConToken(accessToken, newPassword) {
  const supabase = getClient();
  try {
    const payload = jwt.verify(accessToken, getResetTokenSecret());
    const userId = payload.sub;

    if (!userId || payload.purpose !== 'password_recovery') {
      return { success: false, error: 'Token inválido o expirado' };
    }

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (error) {
      console.error('Error actualizando contraseña:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error('Error en ActualizarContraseñaConToken:', err);
    return { success: false, error: 'El enlace de recuperación es inválido o ha expirado' };
  }
}
async function actualizarContrasenaPropia(boleta, correo, supabaseUserId, newPassword) {
  const supabase = getClient();
  try {
    console.log('[actualizarContrasenaPropia] Cambiando contraseña para boleta:', boleta, 'supabaseUserId:', supabaseUserId);

    if (!supabaseUserId) {
      console.error('[actualizarContrasenaPropia] No hay supabaseUserId disponible');
      return { success: false, error: 'Error de autenticación' };
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(supabaseUserId, {
      password: newPassword
    });

    if (updateError) {
      console.error('[actualizarContrasenaPropia] Error en admin.updateUserById:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('[actualizarContrasenaPropia] Contraseña actualizada exitosamente');
    return { success: true };
  } catch (err) {
    console.error('[actualizarContrasenaPropia] Error en catch:', err);
    return { success: false, error: 'Error interno del servidor' };
  }
}





module.exports = {
  validarBoletaEnTabla,
  validarCorreoEnTabla,
  registrarEnAuth,
  crearUsuarioEnTabla,
  verificarConfirmacionPorBoleta,
  buscarCorreoPorBoleta,
  loginConAuth,
  traerUsuarioInfo,
  refrescarSesionSupabase,
  revocarSesionesSupabase,
  CambiarContraseña,
  ActualizarContraseñaConToken,
  actualizarContrasenaPropia
};
