const { getClient } = require('../config/db.js');
const { validarBoleta, RegisterUserAuth, validarConfirmacion, createUser } = require('../models/ModeloUsuario.js');
// Registro de usuario en Supabase Auth (guarda datos en sesión)
async function registro(req, res) {
  if (!req.body) {
    return res.status(400).json({ error: 'No se recibió información en el cuerpo de la petición' });
  }

  try {
    const { boleta, correo, password, confPsw, grupo } = req.body;

    // VALIDACIONES
    if (!boleta || !correo || !password || !confPsw || !grupo ) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    if (boleta.length !== 10 || !/^\d{10}$/.test(boleta)) {
      return res.status(400).json({ error: "Boleta con formato inválido (solo 10 números)" });
    }

    // Verificar si la boleta ya está registrada
    const boletaExiste = await validarBoleta(boleta);
    console.log("Boleta existe:", boletaExiste);
    if (boletaExiste === true) {
      return res.status(400).json({ error: "Esta boleta ya tiene una cuenta registrada" });
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

    // Crear usuario en Supabase Auth
    const resultado = await RegisterUserAuth(boleta, correo, password);
    
    console.log("Resultado del registro:", resultado);
    
    if (!resultado) {
      return res.status(400).json({ error: "Error al registrar usuario. El correo puede estar en uso." });
    }

    // Guardar datos en sesión para usarlos después de la verificación
    req.session.usuario = {
      boleta,
      correo,
      grupo: grupo || null
    };

    console.log("Datos guardados en sesión:", req.session.usuario);

    return res.status(200).json({
      message: "Usuario creado. Revisa tu correo para verificar la cuenta."
    });

  } catch (err) {
    console.error("Error en registro:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}
// Verificar usuario después de confirmar correo y crear en usuarios_web_movil
async function verifyUser(req, res) {
  try {
    // Obtener datos de la sesión
    const datosUsuario = req.session?.usuario;
    
    if (!datosUsuario || !datosUsuario.boleta) {
      return res.status(400).json({ error: 'No hay datos de registro en sesión. Registra nuevamente.' });
    }
    
    const { boleta, correo, grupo } = datosUsuario;

    // Verificar si el correo fue confirmado
    const emailConfirmed = await validarConfirmacion(boleta);
    
    if (!emailConfirmed) {
      return res.status(200).json({ confirmado: false, mensaje: 'Correo aún no confirmado' });
    }

    // Crear usuario en la tabla usuarios_web_movil
    const usuarioCreado = await createUser({ boleta, correo, grupo });
    
    if (!usuarioCreado) {
      return res.status(400).json({ error: 'Error al crear usuario en la base de datos' });
    }

    // Limpiar sesión después de crear usuario
    req.session.usuario = null;

    return res.status(200).json({ 
      mensaje: 'Usuario verificado y creado exitosamente', 
      confirmado: true 
    });

  } catch (err) {
    console.error("Error en verifyUser:", err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Login de usuario (opcional, se puede hacer desde frontend)
async function LoginUser(req, res) {
  const supabase = getClient();
  const { boleta, password } = req.body;
  
  if (!boleta || !password) {
    return res.status(400).json({ error: 'Faltan boleta o contraseña' });
  }

  try {
    // Buscar correo asociado a la boleta
    const { data: userData, error: userError } = await supabase
      .from('usuarios_web_movil')
      .select('correo')
      .eq('boleta', boleta)
      .maybeSingle();

    if (userError || !userData) {
      return res.status(400).json({ mensaje: 'Usuario no encontrado' });
    }

    // Iniciar sesión con Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: userData.correo,
      password: password
    });

    if (error) {
      console.error("Login error:", error);
      return res.status(400).json({ mensaje: 'Usuario o contraseña incorrectos' });
    }

    return res.status(200).json({ 
      mensaje: 'Inicio de sesión exitoso',
      session: data.session,
      user: data.user
    });

  } catch (err) {
    console.error("Error en LoginUser:", err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { LoginUser, registro, verifyUser };
/*
Codigo para enviar el correos 
    // CONFIGURAR SMTP (Gmail)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "cbook.uttab@gmail.com", // Tu correo Gmail
        pass: "yotg vlas dkfp qqbh"    // Contraseña de aplicación
      }
    });

    // ENVIAR CORREO
    await transporter.sendMail({
      from: '"Cbook" <cbook.uttab@gmail.com>',
      to: correo,
      subject: "Confirma tu correo",
      html: `
        <p>Hola! Haz clic <a href="${actionLink}">aquí</a> para confirmar tu correo.</p>
        <p>Si no solicitaste esta cuenta, ignora este correo.</p>
      `
    });
*/  
//Se debe de crear una funcion la cual haga la validacion de la boleta y el codigo que se le envia al correo del alumno,y al momento de pasar la primera validacion se genera un token para que se pueda crear la cuenta
/*
async function LoginUser(req, res) {
  const { loginUser } = require('../models/ModeloUsuario.js');
  const { boleta, password } = req.body;
  if (!boleta || !password) {
    return res.status(400).json({ error: 'Faltan boleta o contraseña' });
  }
  
  const result = await loginUser(boleta, password);
  
  if (result.error) {
    console.error("Login error:", result.error);
    return res.status(400).json({ mensaje: 'Usuario o contraseña incorrectos' });
  }

  // result.data contiene { user, session } de Supabase Auth
  return res.status(200).json({ 
    mensaje: 'Inicio de sesión exitoso',
    session: result.data.session,
    user: result.data.user
  });
}\
*/