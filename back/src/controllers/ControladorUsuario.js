
async function RegisterUser(req,res) {
    const {boleta,correo, password} = req.body;  
    
    //Verificacion de la existencia de la boleta en la base de datos

//En caso que no exista la boleta manda un error
  if(validarBoleta(boleta)===false){
    return res.status(400).json({ error: 'Boleta no registrada, verifica nuevamente que este bien escrita' });
  }
    const { registerUser } = require('../models/ModeloUsuario.js');
    const result = await registerUser({ boleta,correo, password });
    if (result.error) {
        return res.status(400).json({ error: result.error.message });
    }
    return res.status(201).json({ user: result.data });

  }
async function ValidacionCodigo(req, res) {
  try {
    const { correo, codigo } = req.body;
    
    if (!correo || !codigo) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const esValido = await validarCodigoVerificacion(correo, codigo);
    if (!esValido) {
      return res.status(400).json({ error: "Código de verificación incorrecto" });
    }

    // Generar token para creación de cuenta


    return res.json({ message: "Código verificado", token });

  } catch (err) {
    console.error("Error en ValidacionCodigo:", err);
    res.status(500).json({ error: "Error interno" });
  }
}
//Validacion de la boleta
async function validarBoleta(req, res) {
  try {
    const { boleta, correo, password } = req.body;

    if (!boleta || !correo || !password) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    // Validar boleta en BD
    if (verificarBoleta(boleta) === false) {
      return res.status(400).json({
        error: "Boleta no registrada, verifica nuevamente que esté bien escrita"
      });
    }

    // Enviar correo
    await enviarCorreo(correo);
    return res.json({ message: "Código enviado al correo" });

  } catch (err) {
    console.error("Error en validarBoleta:", err);
    res.status(500).json({ error: "Error interno" });
  }
}


// ======================================================
//   FUNCIÓN QUE GENERA Y ENVÍA EL CÓDIGO
// ======================================================
const enviarCorreo = async (correo) => {
  const transporter = createTransport({
    service: "gmail",
    auth: {
      user: "TU_CORREO@gmail.com",
      pass: "TU_CONTRASEÑA_APP"
    }
  });

  const codigoVerificacion = Math.floor(100000 + Math.random() * 900000); // 6 dígitos
  const expiracion = Date.now() + 15 * 60 * 1000; // 15 minutos
  // Guardar el código en BD
  await guardarCodigoVerificacion(correo, codigoVerificacion, expiracion);

  const mailOptions = {
    from: "C-book <TU_CORREO@gmail.com>",
    to: correo,
    subject: "Código de verificación",
    html: `
      <div style="font-family: Arial; color: #333;">
        <h2 style="color:#2b6cb0;">Código de Verificación</h2>
        <p>Tu código es:</p>
        <h1 style="color:#e53e3e;">${codigoVerificacion}</h1>
        <p>Ingresa este código en la aplicación.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};


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
module.exports = { RegisterUser, LoginUser };