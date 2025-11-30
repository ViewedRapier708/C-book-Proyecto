const { 
  validarBoletaEnTabla, 
  validarCorreoEnTabla, 
  registrarEnAuth, 
  crearUsuarioEnTabla,
  verificarConfirmacionPorBoleta,
  buscarCorreoPorBoleta,
  loginConAuth,
  traerUsuarioInfo
} = require('../models/ModeloUsuario.js');

// ==================== REGISTRO ====================
async function registro(req, res) {
  if (!req.body) {
    return res.status(400).json({ error: 'No se recibió información' });
  }

  try {
    const { boleta, correo, password, confPsw } = req.body;

    // Validaciones básicas
    if (!boleta || !correo || !password || !confPsw) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    if (!/^\d{10}$/.test(boleta)) {
      return res.status(400).json({ error: "Boleta debe tener 10 dígitos numéricos" });
    }

    if (!/^[\w.-]+@[\w.-]+\.\w+$/.test(correo)) {
      return res.status(400).json({ error: "Correo con formato inválido" });
    }

    if (password.length < 6 || password.length > 16) {
      return res.status(400).json({ error: "Contraseña debe tener entre 6 y 16 caracteres" });
    }

    if (password !== confPsw) {
      return res.status(400).json({ error: "Las contraseñas no coinciden" });
    }

    // Verificar si la boleta ya existe
    const boletaExiste = await validarBoletaEnTabla(boleta);
    if (boletaExiste) {
      return res.status(400).json({ error: "Esta boleta ya tiene una cuenta registrada" });
    }

    // Verificar si el correo ya existe
    const correoExiste = await validarCorreoEnTabla(correo);
    if (correoExiste) {
      return res.status(400).json({ error: "Este correo ya tiene una cuenta registrada" });
    }

    // Registrar en Supabase Auth
    const resultadoAuth = await registrarEnAuth(boleta, correo, password);
    
    if (!resultadoAuth.success) {
      console.error("Error en Auth:", resultadoAuth.error);
      return res.status(400).json({ error: resultadoAuth.error || "Error al registrar usuario" });
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
      message: "Registro exitoso. Revisa tu correo para verificar la cuenta."
    });

  } catch (err) {
    console.error("Error en registro:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
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

    console.log("Intento de login para boleta:", boleta); //debug

    // Buscar correo por boleta
    const busqueda = await buscarCorreoPorBoleta(boleta);
    
    if (!busqueda.success) {
      return res.status(400).json({ error: busqueda.error || 'Usuario no encontrado' });
    }

    console.log("Correo encontrado:", busqueda.correo); //debug

    // Iniciar sesión con Supabase Auth
    const loginResult = await loginConAuth(busqueda.correo, password);
    
    if (!loginResult.success) {
      return res.status(400).json({ error: loginResult.error });
    }
    const userData = await traerUsuarioInfo(boleta);
    console.log("Datos del usuario:", userData); //debug
    console.log("Login exitoso, sesión creada"); //debug

    // Guardar info en sesión del servidor (opcional)
    req.session.user = {
      id: loginResult.user.id,
      nombre: userData.data?.nombre || '',
      email: loginResult.user.email,
      boleta: boleta,
      grupo: userData.data?.Grupo || ''
    };


    console.log("Datos guardados en sesión:", req.session.user); //debug
    console.log("Sesión del servidor:", req.session); //debug
    

    return res.status(200).json({ 
      success: true,
      mensaje: 'Inicio de sesión exitoso',
      session: loginResult.session,
      user: {
        id: loginResult.user.id,
        email: loginResult.user.email,
        boleta: boleta
      }
    });

  } catch (err) {
    console.error("Error en login:", err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { registro, verificarCorreo, login };