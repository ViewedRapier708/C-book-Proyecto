const { getClient } = require('../config/db.js');
//Se hace la verificacion y la creacion de usuario en base al correo confirmado
function verifyUser(req, res) {
  const {createUser} = require('../models/ModeloUsuario');
  const {boleta} = req.body;
  if (!boleta) {
    return res.status(400).json({ error: 'Falta ingresar alguna boleta' });
  }
  if(!/^\d{10}$/.test(boleta)){
    return res.status(400).json({ error: 'Boleta con formato invalido (solo 10 números)' });
  }
  const {validarConfirmacion} =require('../models/ModeloUsuario.js');
  const emailConfirmed = validarConfirmacion(boleta);
  if (!emailConfirmed) {
    return res.status(200).json({confirmado: false });
  }
<<<<<<< HEAD
  if (emailConfirmed) {
    crearUsuario(boleta);
  }
 
} 
function crearUsuario(boleta) {

}

=======
  //Crear usuario en la tabla usuarios_web_movil despues de la confirmacion de correo
  createUser(boleta).then(() => {
    return res.status(200).json({ mensaje: 'Usuario creado exitosamente', confirmado: true });
  }).catch((error) => {
    console.error("Error al crear usuario en usuarios_web_movil:", error);
    return res.status(400).json({ error: 'Error al crear usuario en la base de datos' });
  });
} 
>>>>>>> 09f1c79810e999d44e87ec669893548c95e6bff3

async function RegisterUserAuth(req, res) {
  const supabase = getClient();

  if (!req.body) {
    return res.status(400).json({ error: 'No se recibió información en el cuerpo de la petición' });
  }

  try {
    const { boleta, correo, password, confPsw } = req.body;
   const {RegisterUserAuth} = require('../models/ModeloUsuario.js');

    // VALIDACIONES
    if (!boleta || !correo || !password || !confPsw) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    if (boleta.length !== 10 || !/^\d{10}$/.test(boleta)) {
      return res.status(400).json({ error: "Boleta con formato invalido (solo 10 números)" });
    }
    // Verificar si la boleta ya está registrada en otra cuenta 
    if ((await validarBoleta(boleta)).existe) {
      return res.status(400).json({ error: "Boleta ya registrada en otra cuenta contacte al administrador en caso de problemas" });
    }

    if (!/^[\w.-]+@[\w.-]+\.\w+$/.test(correo)) {
      return res.status(400).json({ error: "Correo con formato invalido" });
    }

    if (password.length < 6 || password.length > 16) {
      return res.status(400).json({ error: "Contraseña debe tener entre 6 y 16 caracteres" });
    }

    if (password !== confPsw) {
      return res.status(400).json({ error: "Las contraseñas no coinciden" });
    }

    //crear usuario en supabase auth y se envia al correo de confirmacion
   const resultadoRegistro = await RegisterUserAuth(boleta, correo, password);

   console.log("Resultado del registro:", resultadoRegistro); // Debug
   
   if (!resultadoRegistro) {
      return res.status(400).json({ error: "Error al registrar usuario" });
    }
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
    return res.status(200).json({
      message: "Usuario creado. Revisa tu correo para verificar la cuenta."
    });

  } catch (err) {
    console.error("Error en registro:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}
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
module.exports = {  /*LoginUser,*/ RegisterUserAuth, verifyUser };