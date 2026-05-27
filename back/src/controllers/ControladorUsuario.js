const {
  validarBoletaEnTabla,
  validarCorreoEnTabla,
  registrarEnAuth,
  crearUsuarioEnTabla,
  verificarConfirmacionPorBoleta,
  confirmarRegistroConToken,
  confirmarRegistroConAccessToken,
  buscarCorreoPorBoleta,
  loginConAuth,
  traerUsuarioInfo,
  revocarSesionesSupabase,
  cambiarContrasenaRecovery,
  actualizarContrasenaConToken,
  actualizarContrasenaPropia
} = require('../models/ModeloUsuario.js');
const { revocarSesionSoporte, loginSoporte: loginSoporteModel } = require('../models/ModeloSoporte.js');
const jwt = require('jsonwebtoken');

function buildSupportSessionUser(loginResult, secret, cookieSettings) {
  const { session, user, profile } = loginResult;
  const sessionUser = {
    authProvider: 'support',
    tipoCuenta: 'soporte',
    supabaseUserId: user.id,
    userId: profile.user_id,
    nombre: profile.full_name,
    email: profile.email,
    correo: profile.email,
    telefono: profile.phone || '',
    rol: profile.role,
    estado: profile.status,
    tokens: {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at ? session.expires_at * 1000 : null,
      expiresIn: session.expires_in,
    },
  };

  const token = jwt.sign(sessionUser, secret, { expiresIn: '2h' });
  return { sessionUser, token };
}

const SESSION_SAFETY_WINDOW_MS = Number(process.env.SESSION_REFRESH_THRESHOLD_MS) || 60000; // 1 min por defecto

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,16}$/;
const CORREO_IPN_REGEX = /^[\w.-]+@alumno\.ipn\.mx$/;

function validarPassword(password) {
  if (!password || password.length < 6 || password.length > 16) {
    return 'La contraseña debe tener entre 6 y 16 caracteres';
  }
  if (!/[a-z]/.test(password)) {
    return 'La contraseña debe contener al menos una letra minúscula';
  }
  if (!/[A-Z]/.test(password)) {
    return 'La contraseña debe contener al menos una letra mayúscula';
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'La contraseña debe contener al menos un carácter especial';
  }
  return null;
}

// ==================== REGISTRO ====================
async function registro(req, res) {
  if (!req.body) {
    return res.status(400).json({ error: 'No se recibió información' });
  }

  try {
    const { boleta, correo, password, confPsw, acepta_terminos } = req.body;

    // Validaciones básicas
    if (!boleta || !correo || !password || !confPsw) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    if (!acepta_terminos) {
      return res.status(400).json({ error: 'Debes aceptar el Aviso de Privacidad y los Términos y Condiciones' });
    }

    if (!/^\d{10}$/.test(boleta)) {
      return res.status(400).json({ error: 'Boleta debe tener 10 dígitos numéricos' });
    }

    if (!CORREO_IPN_REGEX.test(correo)) {
      return res.status(400).json({ error: 'Solo se permiten correos institucionales @alumno.ipn.mx' });
    }

    const errorPsw = validarPassword(password);
    if (errorPsw) {
      return res.status(400).json({ error: errorPsw });
    }

    if (password !== confPsw) {
      return res.status(400).json({ error: 'Las contraseñas no coinciden' });
    }

    // Verificar si la boleta ya existe
    
    const boletaExiste = await validarBoletaEnTabla(boleta);
    if (boletaExiste.respuesta) {
      return res.status(400).json({ error: boletaExiste.msg });
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
    const { token, access_token, boleta, correo } = req.body || {};

    if (token) {
      const resultado = await confirmarRegistroConToken(token);

      if (!resultado.success) {
        return res.status(400).json({
          confirmado: false,
          error: resultado.error || 'No se pudo confirmar la cuenta'
        });
      }

      return res.status(200).json({
        confirmado: true,
        mensaje: resultado.alreadyConfirmed
          ? 'La cuenta ya estaba confirmada'
          : 'Correo verificado y cuenta activada exitosamente'
      });
    }

    if (access_token) {
      const resultado = await confirmarRegistroConAccessToken(access_token);

      if (!resultado.success) {
        return res.status(400).json({
          confirmado: false,
          error: resultado.error || 'No se pudo confirmar la cuenta'
        });
      }

      return res.status(200).json({
        confirmado: true,
        mensaje: resultado.alreadyConfirmed
          ? 'La cuenta ya estaba confirmada'
          : 'Correo verificado y cuenta activada exitosamente'
      });
    }

    if (!boleta || !correo) {
      return res.status(400).json({
        confirmado: false,
        error: 'Faltan datos de registro o token de confirmacion'
      });
    }

    const resultado = await verificarConfirmacionPorBoleta(boleta);
    const correoRegistro = String(correo || '').trim().toLowerCase();
    const authCorreo = String(resultado.correo || '').trim().toLowerCase();

    if (resultado.confirmado) {
      if (authCorreo !== correoRegistro) {
        return res.status(400).json({
          confirmado: false,
          error: 'El correo confirmado no coincide con la boleta registrada'
        });
      }

      const busqueda = await buscarCorreoPorBoleta(boleta);
      if (busqueda.success) {
        const correoTabla = String(busqueda.correo || '').trim().toLowerCase();
        if (correoTabla === correoRegistro) {
          return res.status(200).json({
            confirmado: true,
            mensaje: 'La cuenta ya esta confirmada'
          });
        }

        return res.status(400).json({
          confirmado: false,
          error: 'Boleta ya registrada en otra cuenta'
        });
      }

      const usuarioCreado = await crearUsuarioEnTabla(boleta, correoRegistro);

      if (!usuarioCreado.success) {
        console.error("Error creando usuario tras confirmacion legacy:", usuarioCreado.error);
        return res.status(400).json({
          confirmado: true,
          error: 'Error al crear usuario en la base de datos'
        });
      }

      return res.status(200).json({
        confirmado: true,
        mensaje: 'Correo verificado y cuenta activada exitosamente'
      });
    }

    return res.status(200).json({
      confirmado: false,
      mensaje: 'Revisa tu correo y usa el boton de confirmacion para activar la cuenta'
    });
  } catch (err) {
    console.error("Error en verificarCorreo:", err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function confirmarRegistro(req, res) {
  try {
    const { token } = req.body || {};

    if (!token) {
      return res.status(400).json({ confirmado: false, error: 'Falta el token de confirmacion' });
    }

    const resultado = await confirmarRegistroConToken(token);

    if (!resultado.success) {
      return res.status(400).json({
        confirmado: false,
        error: resultado.error || 'No se pudo confirmar la cuenta'
      });
    }

    return res.status(200).json({
      confirmado: true,
      mensaje: resultado.alreadyConfirmed
        ? 'La cuenta ya estaba confirmada'
        : 'Correo verificado y cuenta activada exitosamente'
    });
  } catch (err) {
    console.error("Error en confirmarRegistro:", err);
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

    const secret = req.app.locals.sessionSecret || process.env.SESSION_SECRET || 'dev_session_secret_change_me';

    // First try normal user login
    try {
      // Buscar correo por boleta
      const busqueda = await buscarCorreoPorBoleta(boleta);
      
      if (busqueda.success) {
        // Iniciar sesión con Supabase Auth
        const loginResult = await loginConAuth(busqueda.correo, password);
        
        if (loginResult.success) {
          const userData = await traerUsuarioInfo(boleta);

          const nombre = (userData.data?.boletas?.nombre).trim();
          const grupo = userData.data?.boletas?.Grupo;
          const rol = userData.data?.rol;
          const tiene_documentos = Boolean(userData.data?.tiene_documentos);

          const supabaseSession = loginResult.session;

          if (!supabaseSession) {
            return res.status(500).json({ error: 'No se pudo crear la sesión en Supabase' });
          }

          const sessionUser = {
            authProvider: 'main',
            tipoCuenta: 'principal',
            supabaseUserId: loginResult.user.id,
            nombre,
            email: loginResult.user.email,
            boleta,
            grupo,
            rol,
            tiene_documentos,
            tokens: {
              accessToken: supabaseSession.access_token,
              refreshToken: supabaseSession.refresh_token,
              expiresAt: supabaseSession.expires_at ? supabaseSession.expires_at * 1000 : null,
              expiresIn: supabaseSession.expires_in
            }
          };

          // Crear JWT propio con la info de sesión
          const token = jwt.sign(sessionUser, secret, { expiresIn: '2h' });
          
          // Guardar token en cookie
          res.cookie('app_session', token, req.app.locals.cookieSettings);

          return res.status(200).json({
            success: true,
            mensaje: 'Inicio de sesión exitoso',
            user: sanitizeSessionUser(sessionUser),
            rol: rol
          });
        }
      }

      if (!busqueda.success) {
        const authPendiente = await verificarConfirmacionPorBoleta(boleta);
        if (authPendiente?.usuario?.user_metadata?.rol === 'alumno') {
          return res.status(403).json({ error: 'Debes confirmar tu correo antes de iniciar sesion' });
        }
      }
    } catch (err) {
      // Normal user login failed, continue to try support login
    }

    // Try support login - lookup support user by boleta
    try {
      const supportLoginResult = await loginSoporteModel(boleta, password);
      const { sessionUser, token } = buildSupportSessionUser(supportLoginResult, secret, req.app.locals.cookieSettings);
      
      res.cookie('app_session', token, req.app.locals.cookieSettings);

      return res.status(200).json({
        success: true,
        mensaje: 'Inicio de sesión de soporte exitoso',
        user: sanitizeSessionUser(sessionUser),
        rol: sessionUser.rol,
        tipoCuenta: sessionUser.tipoCuenta,
      });
    } catch (supportErr) {
      // Support login also failed
    }

    // If both logins fail
    return res.status(400).json({ error: 'Boleta o contraseña incorrectos' });
  } catch (err) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function verificarSesion(req, res) {
  try {
    const token = req.cookies.app_session;
    if (!token) {
      return res.status(200).json({ autenticado: false, user: null });
    }

    const secret = req.app.locals.sessionSecret || process.env.SESSION_SECRET || 'dev_session_secret_change_me';
    let sessionUser;
    
    try {
      sessionUser = jwt.verify(token, secret);
    } catch (e) {
      return res.status(200).json({ autenticado: false, user: null });
    }

    if (sessionUser.authProvider === 'support' || sessionUser.tipoCuenta === 'soporte') {
      return res.status(200).json({
        autenticado: true,
        user: sanitizeSessionUser(sessionUser)
      });
    }

    const userData = await traerUsuarioInfo(sessionUser.boleta);
    const publicUser = sanitizeSessionUser({
      ...sessionUser,
      tiene_documentos: userData.success ? Boolean(userData.data?.tiene_documentos) : sessionUser.tiene_documentos
    });

    return res.status(200).json({
      autenticado: true,
      user: publicUser
    });
  } catch (err) {
   // console.error('Error en verificarSesion:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ==================== CERRAR SESIÓN ====================

async function cerrarSesion(req, res) {
  try {
    const token = req.cookies.app_session;
    if (token) {
      try {
        const secret = req.app.locals.sessionSecret || process.env.SESSION_SECRET || 'dev_session_secret_change_me';
        const sessionUser = jwt.verify(token, secret);
        const accessToken = sessionUser?.tokens?.accessToken;
        
        if (accessToken) {
          const revocado = sessionUser.authProvider === 'support'
            ? await revocarSesionSoporte(accessToken)
            : await revocarSesionesSupabase(accessToken);
          if (!revocado.success) {
           // console.warn('No se pudo revocar la sesión en Supabase:', revocado.error);
          }
        }
      } catch (e) {
        // Ignorar error si el token ya expiró
      }
    }

    res.clearCookie('app_session', req.app.locals.cookieSettings);
    return res.status(200).json({ mensaje: 'Sesión cerrada correctamente' });
  } catch (err) {
    //console.error('Error al cerrar sesión:', err);
    return res.status(500).json({ error: 'No se pudo cerrar la sesión' });
  }
}

function sanitizeSessionUser(sessionUser = {}) {
  if (!sessionUser) return null;
  const { tokens, iat, exp, ...publicData } = sessionUser;
  return publicData;
}

//Modificacion de datos del usuario (correo y contraseña)
async function CambioDatos(req , res) {
    const { boleta, nuevoCorreo, nuevaContraseña,TipoDatoACambiar } = req.body;
    if (!boleta || (!nuevoCorreo && !nuevaContraseña)) {
      return res.status(400).json({ error: 'Faltan datos para actualizar' });
    }
    switch (TipoDatoACambiar) {
      case 'correo':
        return res.status(400).json({ error: 'El cambio de correo no está disponible actualmente' });
      case 'contraseña':
        if (!boleta || !nuevaContraseña) {
          return res.status(400).json({ error: 'Faltan datos para actualizar contraseña' });
        }
        const resultadoContraseña = await cambiarContrasenaRecovery(boleta, nuevaContraseña);
        if (!resultadoContraseña.success) {
          return res.status(400).json({ error: resultadoContraseña.error || 'Error al cambiar contraseña' });
        } 
        return res.status(200).json({ success: true, message: 'Contraseña actualizada exitosamente' });
      default:
        return res.status(400).json({ error: 'Tipo de dato a cambiar no válido' });
    }
    
}



//=======================Eliminacion de la cuenta

// ==================== RECUPERACIÓN DE CONTRASEÑA ====================

async function solicitarRecuperacion(req, res) {
  try {
    const { boleta } = req.body;

    if (!boleta) {
      return res.status(400).json({ error: 'Ingresa tu número de boleta' });
    }

    if (!/^\d{10}$/.test(boleta)) {
      return res.status(400).json({ error: 'La boleta debe tener 10 dígitos' });
    }

    const busqueda = await buscarCorreoPorBoleta(boleta);
    if (!busqueda.success) {
      return res.status(400).json({ error: 'No existe ninguna cuenta con esa boleta' });
    }

    const resultado = await cambiarContrasenaRecovery(busqueda.correo);
    if (!resultado.success) {
      return res.status(500).json({ error: resultado.error || 'No se pudo enviar el correo de recuperación' });
    }

    return res.status(200).json({ success: true, message: 'Revisa tu correo para continuar con el cambio de contraseña.' });
  } catch (err) {
    console.error('Error en solicitarRecuperacion:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function actualizarContraseña(req, res) {
  try {
    const { access_token, newPassword, confPassword } = req.body;

    if (!access_token || !newPassword || !confPassword) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    const errorPsw = validarPassword(newPassword);
    if (errorPsw) {
      return res.status(400).json({ error: errorPsw });
    }

    if (newPassword !== confPassword) {
      return res.status(400).json({ error: 'Las contraseñas no coinciden' });
    }

    const resultado = await actualizarContrasenaConToken(access_token, newPassword);
    if (!resultado.success) {
      return res.status(400).json({ error: resultado.error || 'No se pudo actualizar la contraseña' });
    }

    return res.status(200).json({ success: true, message: 'Contraseña actualizada exitosamente' });
  } catch (err) {
    console.error('Error en actualizarContraseña:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ==================== CAMBIO DE CONTRASEÑA (DESDE PERFIL) ====================
async function cambiarContrasenaPropia(req, res) {
  try {
    const { correo, currentPassword, newPassword } = req.body;
    const usuario = req.session?.user;

    console.log('[cambiarContrasenaPropia] Request recibido. boleta:', usuario?.boleta, 'correo:', correo);

    if (!correo || !currentPassword || !newPassword) {
      console.error('[cambiarContrasenaPropia] Faltan datos:', { correo, currentPassword: !!currentPassword, newPassword: !!newPassword });
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    if (newPassword.length < 6 || newPassword.length > 16) {
      return res.status(400).json({ error: 'La contraseña debe tener entre 6 y 16 caracteres' });
    }

    const errorPsw = validarPassword(newPassword);
    if (errorPsw) {
      return res.status(400).json({ error: errorPsw });
    }

    // Verificar que el correo proporcionado coincida con el de la sesión
    if (correo !== usuario?.email) {
      console.error('[cambiarContrasenaPropia] El correo no coincide con la sesión. Recibido:', correo, 'Esperado:', usuario?.email);
      return res.status(400).json({ error: 'El correo no coincide con tu cuenta' });
    }

    const resultado = await actualizarContrasenaPropia(usuario.boleta, correo, usuario.supabaseUserId, newPassword);

    if (!resultado.success) {
      console.error('[cambiarContrasenaPropia] Error en actualizarContrasenaPropia:', resultado.error);
      return res.status(400).json({ error: resultado.error });
    }

    console.log('[cambiarContrasenaPropia] Éxito');
    return res.status(200).json({ success: true, message: 'Contraseña actualizada exitosamente' });
  } catch (err) {
    console.error('[cambiarContrasenaPropia] Error en catch:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function obtenerCorreoPorBoleta(req, res) {
  try {
    const { boleta } = req.body;
    if (!boleta || !/^\d{10}$/.test(boleta)) {
      return res.status(400).json({ error: 'Boleta inválida' });
    }
    const busqueda = await buscarCorreoPorBoleta(boleta);
    if (!busqueda.success) {
      return res.status(404).json({ error: 'No existe ninguna cuenta con esa boleta' });
    }
    return res.json({ correo: busqueda.correo });
  } catch (err) {
    console.error('Error en obtenerCorreoPorBoleta:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { registro, verificarCorreo, confirmarRegistro, login, cerrarSesion, verificarSesion, CambioDatos, solicitarRecuperacion, actualizarContraseña, cambiarContrasenaPropia, obtenerCorreoPorBoleta };
