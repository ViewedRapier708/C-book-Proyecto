const { getClient } = require('../config/db');
const jwt = require('jsonwebtoken');
const { enviarCorreo } = require('../utils/servicioCorreo');

const RESET_TOKEN_TTL = '30m';
const REGISTRATION_CONFIRM_TOKEN_TTL = '2h';

function getFrontendBaseUrl() {
  const fallback = process.env.NODE_ENV === 'production'
    ? 'https://c-book-proyecto.vercel.app'
    : 'http://localhost:5173';

  return (process.env.FRONTEND_URL || fallback).replace(/\/+$/, '');
}

function getResetTokenSecret() {
  return process.env.RESET_PASSWORD_SECRET || process.env.SESSION_SECRET || 'dev_session_secret_change_me';
}

function getRegistrationConfirmSecret() {
  return process.env.REGISTRATION_CONFIRM_SECRET || getResetTokenSecret();
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

async function buscarUsuarioAuthPorBoleta(boleta) {
  const supabase = getClient();
  const normalizedBoleta = String(boleta || '').trim();
  let page = 1;

  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });

    if (error) {
      throw error;
    }

    const usuario = (data?.users || []).find((u) => String(u.user_metadata?.boleta || '').trim() === normalizedBoleta);
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
async function registrarEnAuthSupabaseLegacy(boleta, correo, password) {
  const supabase = getClient();
  try {
    const { data, error } = await supabase.auth.signUp({
      email: correo,
      password: password,
      options: {
        emailRedirectTo: `${getFrontendBaseUrl()}/verificar`,
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

function construirCorreoConfirmacionRegistro({ boleta, correo, confirmUrl }) {
  const safeBoleta = escapeHtml(boleta);
  const safeCorreo = escapeHtml(correo);
  const safeConfirmUrl = escapeHtml(confirmUrl);

  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Roboto,Arial,sans-serif">
<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <div style="background:#6366f1;padding:28px 32px;text-align:center">
    <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">C-Book</h1>
  </div>
  <div style="padding:28px 32px">
    <h2 style="margin:0 0 8px;font-size:18px;color:#111827">Confirma tu cuenta</h2>
    <p style="margin:0 0 18px;color:#4b5563;font-size:14px;line-height:1.6">
      Recibimos tu registro en C-Book. Confirma tu cuenta para activar el acceso con tu boleta y contrasena.
    </p>
    <div style="background:#f9fafb;border-radius:8px;padding:14px 16px;margin-bottom:18px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:4px 0;color:#6b7280;font-size:13px;width:80px">Boleta</td><td style="padding:4px 0;font-weight:600;font-size:13px">${safeBoleta}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;font-size:13px">Correo</td><td style="padding:4px 0;font-weight:600;font-size:13px">${safeCorreo}</td></tr>
      </table>
    </div>
    <p style="text-align:center;margin:28px 0">
      <a href="${safeConfirmUrl}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">
        Confirmar cuenta
      </a>
    </p>
    <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.5">
      Este enlace expira en 2 horas. Si no solicitaste este registro, ignora este correo.
    </p>
  </div>
  <div style="padding:16px 32px;background:#f9fafb;text-align:center;border-top:1px solid #e5e7eb">
    <p style="margin:0;font-size:11px;color:#9ca3af">Este correo fue generado automaticamente por C-Book.</p>
  </div>
</div>
</body></html>`;
}

async function enviarCorreoConfirmacionRegistro(boleta, correo, authUserId) {
  const token = jwt.sign(
    {
      purpose: 'registration_confirm',
      boleta: String(boleta),
      correo: String(correo).trim().toLowerCase(),
      authUserId
    },
    getRegistrationConfirmSecret(),
    { expiresIn: process.env.REGISTRATION_CONFIRM_TTL || REGISTRATION_CONFIRM_TOKEN_TTL }
  );

  const confirmUrl = `${getFrontendBaseUrl()}/verificar?token=${encodeURIComponent(token)}`;
  const html = construirCorreoConfirmacionRegistro({ boleta, correo, confirmUrl });
  return enviarCorreo(correo, 'Confirma tu cuenta - C-Book', html);
}

// Registrar usuario en Supabase Auth sin usar el correo de confirmacion de Supabase
async function registrarEnAuth(boleta, correo, password) {
  const supabase = getClient();
  const normalizedCorreo = String(correo || '').trim().toLowerCase();
  let authUser = null;
  let createdNewUser = false;

  try {
    const existingAuthUser = await buscarUsuarioAuthPorCorreo(normalizedCorreo);

    if (existingAuthUser) {
      const authBoleta = String(existingAuthUser.user_metadata?.boleta || '').trim();
      if (authBoleta && authBoleta !== String(boleta)) {
        return { success: false, error: 'Este correo ya esta registrado con otra boleta' };
      }

      const { data, error } = await supabase.auth.admin.updateUserById(existingAuthUser.id, {
        password,
        email_confirm: true,
        user_metadata: {
          ...(existingAuthUser.user_metadata || {}),
          boleta: String(boleta),
          rol: 'alumno',
          registration_provider: 'nodemailer',
          pending_nodemailer_confirmation: true
        }
      });

      if (error) {
        console.error("Error actualizando usuario Auth pendiente:", error);
        return { success: false, error: error.message };
      }

      authUser = data?.user || existingAuthUser;
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: normalizedCorreo,
        password,
        email_confirm: true,
        user_metadata: {
          boleta: String(boleta),
          rol: 'alumno',
          registration_provider: 'nodemailer',
          pending_nodemailer_confirmation: true
        }
      });

      if (error) {
        let mensaje = error.message;
        if (error.message && error.message.toLowerCase().includes('already')) {
          mensaje = 'Este correo ya esta registrado. Intenta iniciar sesion o usa otro correo.';
        }
        console.error("Error registrando en Auth:", error);
        return { success: false, error: mensaje };
      }

      authUser = data.user;
      createdNewUser = true;
    }

    if (!authUser?.id) {
      return { success: false, error: 'No se pudo crear el usuario en autenticacion' };
    }

    const enviado = await enviarCorreoConfirmacionRegistro(boleta, normalizedCorreo, authUser.id);
    if (!enviado.success) {
      if (createdNewUser) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(authUser.id);
        if (deleteError) {
          console.error('No se pudo eliminar el usuario Auth tras fallo de correo:', deleteError);
        }
      }
      return { success: false, error: 'No se pudo enviar el correo de confirmacion' };
    }

    return { success: true, user: authUser };
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
    const usuario = await buscarUsuarioAuthPorBoleta(boleta);

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

async function confirmarRegistroConToken(token) {
  const supabase = getClient();

  try {
    const payload = jwt.verify(token, getRegistrationConfirmSecret());
    const boleta = String(payload?.boleta || '').trim();
    const correo = String(payload?.correo || '').trim().toLowerCase();
    const authUserId = String(payload?.authUserId || '').trim();

    if (payload?.purpose !== 'registration_confirm' || !boleta || !correo || !authUserId) {
      return { success: false, error: 'El enlace de confirmacion es invalido' };
    }

    const usuarioAuth = await buscarUsuarioAuthPorCorreo(correo);
    if (!usuarioAuth?.id || usuarioAuth.id !== authUserId) {
      return { success: false, error: 'Usuario no encontrado en autenticacion' };
    }

    const { data: boletaData, error: errorBoleta } = await supabase
      .from('boletas')
      .select('boleta')
      .eq('boleta', boleta)
      .maybeSingle();

    if (errorBoleta) {
      console.error('Error validando boleta al confirmar registro:', errorBoleta);
      return { success: false, error: 'No se pudo validar la boleta' };
    }

    if (!boletaData) {
      return { success: false, error: 'Boleta no encontrada verifique su boleta' };
    }

    const { data: usuarioExistente, error: errorUsuario } = await supabase
      .from('usuarios_web_movil')
      .select('boleta, correo')
      .eq('boleta', boleta)
      .maybeSingle();

    if (errorUsuario) {
      console.error('Error buscando usuario al confirmar registro:', errorUsuario);
      return { success: false, error: 'No se pudo validar la cuenta' };
    }

    if (usuarioExistente) {
      if (String(usuarioExistente.correo || '').trim().toLowerCase() === correo) {
        return { success: true, alreadyConfirmed: true };
      }
      return { success: false, error: 'Boleta ya registrada en otra cuenta' };
    }

    const { data: correoExistente, error: errorCorreo } = await supabase
      .from('usuarios_web_movil')
      .select('boleta, correo')
      .eq('correo', correo)
      .maybeSingle();

    if (errorCorreo) {
      console.error('Error buscando correo al confirmar registro:', errorCorreo);
      return { success: false, error: 'No se pudo validar el correo' };
    }

    if (correoExistente) {
      return { success: false, error: 'Este correo ya tiene una cuenta registrada' };
    }

    const { error: confirmError } = await supabase.auth.admin.updateUserById(authUserId, {
      email_confirm: true,
      user_metadata: {
        ...(usuarioAuth.user_metadata || {}),
        boleta,
        rol: 'alumno',
        registration_provider: 'nodemailer',
        pending_nodemailer_confirmation: false,
        registration_confirmed_at: new Date().toISOString()
      }
    });

    if (confirmError) {
      console.error('Error confirmando usuario Auth:', confirmError);
      return { success: false, error: 'No se pudo confirmar el usuario en autenticacion' };
    }

    const usuarioCreado = await crearUsuarioEnTabla(boleta, correo);
    if (!usuarioCreado.success) {
      return { success: false, error: usuarioCreado.error || 'Error al crear usuario en la base de datos' };
    }

    return { success: true };
  } catch (err) {
    console.error('Error en confirmarRegistroConToken:', err);
    return { success: false, error: 'El enlace de confirmacion es invalido o ha expirado' };
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
async function cambiarContrasenaRecovery(correo) {
  try {
    const token = jwt.sign(
      {
        purpose: 'password_recovery',
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
    <h2 style="margin:0 0 8px;font-size:18px;color:#111827">Recuperacion de contrasena</h2>
    <p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.6">
      Recibimos una solicitud para cambiar la contrasena de tu cuenta. Usa el siguiente boton para crear una nueva contrasena.
    </p>
    <p style="text-align:center;margin:28px 0">
      <a href="${resetUrl}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">
        Cambiar contrasena
      </a>
    </p>
    <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.5">
      Este enlace expira en 30 minutos. Si no solicitaste el cambio, ignora este correo.
    </p>
  </div>
  <div style="padding:16px 32px;background:#f9fafb;text-align:center;border-top:1px solid #e5e7eb">
    <p style="margin:0;font-size:11px;color:#9ca3af">Este correo fue generado automaticamente por C-Book.</p>
  </div>
</div>
</body></html>`;

    const enviado = await enviarCorreo(correo, 'Recuperacion de contrasena - C-Book', html);
    console.log('Resultado de enviarCorreo en cambiarContrasenaRecovery:', enviado);
    
    if (!enviado.success) {
      return { success: false, error: 'No se pudo enviar el correo de recuperacion' };
    }

    return { success: true };
  } catch (err) {
    console.error('Error en cambiarContrasenaRecovery:', err);
    return { success: false, error: 'Error interno' };
  }
}

async function actualizarContrasenaConToken(accessToken, newPassword) {
  const supabase = getClient();
  try {
    const payload = jwt.verify(accessToken, getResetTokenSecret());

    if (!payload?.email || payload.purpose !== 'password_recovery') {
      return { success: false, error: 'Token invalido o expirado' };
    }

    const usuarioAuth = await buscarUsuarioAuthPorCorreo(payload.email);

    if (!usuarioAuth?.id) {
      return { success: false, error: 'Usuario no encontrado en autenticacion' };
    }

    const { error } = await supabase.auth.admin.updateUserById(usuarioAuth.id, {
      password: newPassword
    });

    if (error) {
      console.error('Error actualizando contrasena:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error('Error en actualizarContrasenaConToken:', err);
    return { success: false, error: 'El enlace de recuperacion es invalido o ha expirado' };
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
  confirmarRegistroConToken,
  buscarCorreoPorBoleta,
  loginConAuth,
  traerUsuarioInfo,
  refrescarSesionSupabase,
  revocarSesionesSupabase,
  cambiarContrasenaRecovery,
  actualizarContrasenaConToken,
  actualizarContrasenaPropia
};
