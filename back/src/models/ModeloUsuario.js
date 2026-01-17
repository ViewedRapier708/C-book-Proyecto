const { getClient } = require('../config/db');

// ==================== REGISTRO ====================

// Verificar si la boleta ya existe en usuarios_web_movil
async function validarBoletaEnTabla(boleta) {
  const supabase = getClient();
  try {
    const { data, error } = await supabase
      .from('usuarios_web_movil')
      .select('boleta')
      .eq('boleta', boleta)
      .maybeSingle();

    if (error) {
      console.error("Error validando boleta:", error);
      return false;
    }
    return !!data; // true si existe
  } catch (err) {
    console.error("Error en validarBoletaEnTabla:", err);
    return false;
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
  
        }
      }
    });

    console.log("Registro Auth:", data?.user?.id, error?.message); //debug

    if (error) {
      console.error("Error registrando en Auth:", error);
      return { success: false, error: error.message };
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
    console.log("Creando usuario en tabla:", { boleta, correo }); //debug
    
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

    console.log("Usuario creado:", data); //debug
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

    console.log("Login Auth:", data?.session ? 'Sesión creada' : 'Sin sesión', error?.message); //debug

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
        tiene_documentos,
        tipo_usuario,
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

async function revocarSesionesSupabase(userId) {
  const supabase = getClient();
  try {
    if (!userId) {
      return { success: false, error: 'ID de usuario inválido' };
    }

    const { error } = await supabase.auth.admin.signOut(userId);

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
  revocarSesionesSupabase
};
