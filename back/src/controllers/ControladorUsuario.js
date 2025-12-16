const { 
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
} = require('../models/ModeloUsuario.js');

const SESSION_SAFETY_WINDOW_MS = Number(process.env.SESSION_REFRESH_THRESHOLD_MS) || 60000; // 1 min por defecto

// ==================== REGISTRO ====================
async function registro(req, res) {
  if (!req.body) {
    return res.status(400).json({ error: 'No se recibió información' });
  }

  try {
    const { boleta, correo, password, confPsw } = req.body;

    // Validaciones básicas
    if (!boleta || !correo || !password || !confPsw) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    if (!/^\d{10}$/.test(boleta)) {
      return res.status(400).json({ error: 'Boleta debe tener 10 dígitos numéricos' });
    }

    if (!/^[\w.-]+@[\w.-]+\.\w+$/.test(correo)) {
      return res.status(400).json({ error: 'Correo con formato inválido' });
    }

    if (password.length < 6 || password.length > 16) {
      return res.status(400).json({ error: 'Contraseña debe tener entre 6 y 16 caracteres' });
    }

    if (password !== confPsw) {
      return res.status(400).json({ error: 'Las contraseñas no coinciden' });
    }

    // Verificar si la boleta ya existe
    
    const boletaExiste = await validarBoletaEnTabla(boleta);


    if (boletaExiste) {
      return res.status(400).json({ error: 'Esta boleta ya tiene una cuenta registrada' });
    }

    // Verificar si el correo ya existe
     const correoExiste = await validarCorreoEnTabla(correo);
    if (correoExiste) {
      return res.status(400).json({ error: 'Este correo ya tiene una cuenta registrada' });
    }

    // Registrar en Supabase Auth
    const resultadoAuth = await registrarEnAuth(boleta, correo, password);
    
    if (!resultadoAuth.success) {
     // console.error("Error en Auth:", resultadoAuth.error);
      return res.status(400).json({ error: resultadoAuth.error || 'Error al registrar usuario' });
    }

    console.log("Usuario registrado en Auth:", resultadoAuth.user?.id); //debug

    // Guardar datos en sesión para la verificación
    req.session.registro = {
      boleta,
      correo
    };

    console.log("Datos guardados en sesión:", req.session.registro); //debug

    return res.status(200).json({
      success: true,
      message: 'Registro exitoso. Revisa tu correo para verificar la cuenta.'
    });

  } catch (err) {
    console.error("Error en registro:", err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ==================== VERIFICACIÓN DE CORREO ====================
async function verificarCorreo(req, res) {
  try {
    // Obtener datos del body (enviados desde localStorage del frontend)
    const { boleta, correo } = req.body;
    
    if (!boleta || !correo) {
      return res.status(400).json({ 
        confirmado: false, 
        error: 'Faltan datos de registro (boleta o correo)' 
      });
    }

    console.log("Verificando confirmación para boleta:", boleta); //debug

    // Verificar si el correo fue confirmado
    const resultado = await verificarConfirmacionPorBoleta(boleta);
    
    console.log("Resultado verificación:", resultado); //debug

    if (!resultado.confirmado) {
      return res.status(200).json({ 
        confirmado: false, 
        mensaje: 'Correo aún no confirmado' 
      });
    }

    // Correo confirmado - Crear usuario en la tabla
    const usuarioCreado = await crearUsuarioEnTabla(boleta, correo);
    
    if (!usuarioCreado.success) {
      console.error("Error creando usuario en tabla:", usuarioCreado.error);
      // Puede que ya exista, verificamos
      const yaExiste = await validarBoletaEnTabla(boleta);
      if (!yaExiste) {
        return res.status(400).json({ 
          confirmado: true,
          error: 'Error al crear usuario en la base de datos' 
        });
      }
    }

    console.log("Usuario verificado y creado exitosamente"); //debug

    return res.status(200).json({ 
      confirmado: true,
      mensaje: 'Correo verificado y cuenta activada exitosamente'
    });

  } catch (err) {
    console.error("Error en verificarCorreo:", err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ==================== LOGIN ====================
async function login(req, res) {
  try {
    const { boleta, password } = req.body;
    
    if (!boleta || !password) {
      return res.status(400).json({ error: 'Faltan boleta o contraseña' });
    }

    if (!/^\d{10}$/.test(boleta)) {
      return res.status(400).json({ error: "Boleta debe tener 10 dígitos" });
    }

    //console.log("Intento de login para boleta:", boleta); //debug

    // Buscar correo por boleta
    const busqueda = await buscarCorreoPorBoleta(boleta);
    
    if (!busqueda.success) {
      return res.status(400).json({ error: busqueda.error || 'Usuario no encontrado' });
    }

   // console.log("Correo encontrado:", busqueda.correo); //debug

    // Iniciar sesión con Supabase Auth
    const loginResult = await loginConAuth(busqueda.correo, password);
    
    if (!loginResult.success) {
      return res.status(400).json({ error: loginResult.error || 'Error al iniciar sesión' });
    }
    const userData = await traerUsuarioInfo(boleta);
    const nombre = (userData.data?.boletas?.nombre || '').trim();
    const grupo = userData.data?.boletas?.Grupo || '';
  //  console.log("Datos del usuario:", userData); //debug
   // console.log("Login exitoso, sesión creada"); //debug

    const supabaseSession = loginResult.session;

    if (!supabaseSession) {
      return res.status(500).json({ error: 'No se pudo crear la sesión en Supabase' });
    }

    await regenerateSession(req);

    req.session.user = {
      supabaseUserId: loginResult.user.id,
      nombre,
      email: loginResult.user.email,
      boleta,
      grupo,
      tokens: {
        accessToken: supabaseSession.access_token,
        refreshToken: supabaseSession.refresh_token,
        expiresAt: supabaseSession.expires_at ? supabaseSession.expires_at * 1000 : null,
        expiresIn: supabaseSession.expires_in
      }
    };

    await saveSession(req);

  //  console.log("Datos guardados en sesión:", req.session.user); //debug

    return res.status(200).json({
      success: true,
      mensaje: 'Inicio de sesión exitoso',
      user: sanitizeSessionUser(req.session.user)
    });
  } catch (err) {
  //  console.error("Error en login:", err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function verificarSesion(req, res) {
  try {
    const sessionUser = req.session.user;
    console.log('Verificando sesión para usuario:', sessionUser?.boleta); //debug
    if (!sessionUser) {
      // Siempre 200 para que el frontend maneje el estado con simplicidad
      return res.status(200).json({ autenticado: false, user: null });
    }

    return res.status(200).json({
      autenticado: true,
      user: sanitizeSessionUser(sessionUser)
    });
  } catch (err) {
   // console.error('Error en verificarSesion:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ==================== CERRAR SESIÓN ====================

async function cerrarSesion(req, res) {
  try {
    const accessToken = req.session?.user?.tokens?.accessToken;
//console.log('Cerrando sesión para accessToken:', accessToken); //debug
    if (accessToken) {
      const revocado = await revocarSesionesSupabase(accessToken);
      if (!revocado.success) {
       // console.warn('No se pudo revocar la sesión en Supabase:', revocado.error);
      }
    }

    await destroySession(req, res);

    return res.status(200).json({ mensaje: 'Sesión cerrada correctamente' });
  } catch (err) {
    //console.error('Error al cerrar sesión:', err);
    return res.status(500).json({ error: 'No se pudo cerrar la sesión' });
  }
}

function sanitizeSessionUser(sessionUser = {}) {
  if (!sessionUser) return null;
  const { tokens, ...publicData } = sessionUser;
  return publicData;
}

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate(err => err ? reject(err) : resolve());
  });
}

function saveSession(req) {//Garantiza el envio de la sesion actualizada y la cookie
  return new Promise((resolve, reject) => {
    req.session.save(err => err ? reject(err) : resolve());
  });
}

function destroySession(req, res) {
  return new Promise((resolve, reject) => {
    if (!req.session) {
      res.clearCookie('connect.sid');
      return resolve();
    }

    req.session.destroy(err => {
      res.clearCookie('connect.sid');
      return err ? reject(err) : resolve();
    });
  });
}



module.exports = { registro, verificarCorreo, login, cerrarSesion ,verificarSesion};