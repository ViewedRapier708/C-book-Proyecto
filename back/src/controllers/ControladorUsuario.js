const nodemailer = require('nodemailer');

async function registro(req, res) {
  const {validarRegistro} = require('../models/ModeloUsuario.js');
  const { getClient } = require('../config/db.js');
  const supabase = getClient();

  if (!req.body) {
    return res.status(400).json({ error: 'No se recibió información' });
  }

  try {
    const { boleta, correo, password, confPsw } = req.body;

    // VALIDACIONES (igual que tu código)
    if (!boleta || !correo || !password) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    if (password !== confPsw) {
      return res.status(400).json({ error: "Las contraseñas no coinciden" });
    }

    // CREAR USUARIO EN SUPABASE
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: correo,
      password: password,
      email_confirm: false,
      user_metadata: { boleta }
    });

    if (createError) return res.status(400).json({ error: createError.message });

    // GENERAR LINK DE VERIFICACIÓN
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "signup",
      email: correo,
      options: {
        redirectTo: "http://127.0.0.1:5500/pantallasUs/confirmacionCorreo.html"
      }
    });
    if (linkError) return res.status(400).json({ error: linkError.message });
    const actionLink = linkData?.properties?.action_link;
    // CONFIGURAR SMTP (Gmail)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "cbook.uttab@gmail.com",
        pass: "yotg vlas dkfp qqbh"
      }
    });

    // ENVIAR CORREO
    await transporter.sendMail({
      from: '"Cbook" <cbook.uttab@gmail.com>',
      to: correo,
      subject: "Confirma tu correo",
      html: `<p>Hola! Haz clic <a href="${actionLink}">aquí</a> para confirmar tu correo.</p>`
    });

    return res.status(200).json({
      message: "Usuario creado. Revisa tu correo para verificar la cuenta."
    });

  } catch (err) {
    console.error("Error en registro:", err);
    res.status(500).json({ error: "Error interno" });
  }
}


//Se debe de crear una funcion la cual haga la validacion de la boleta y el codigo que se le envia al correo del alumno,y al momento de pasar la primera validacion se genera un token para que se pueda crear la cuenta
async function LoginUser(req, res) {
  const { loginUser } = require('../models/ModeloUsuario.js');
  const { boleta, password } = req.body;
  if (!boleta || !password) {
    return res.status(400).json({ error: 'Faltan boleta o contraseña' });
  }
  const result = await loginUser(boleta, password);
  console.log(result.error);
  if (result.error) {
    return res.status(400).json({ mensaje: 'Usuario o contraseña incorrectos' });
  }
  return res.status(200).json({
    mensaje: `Inicio de sesión exitoso`
  });
}
module.exports = { LoginUser, registro };