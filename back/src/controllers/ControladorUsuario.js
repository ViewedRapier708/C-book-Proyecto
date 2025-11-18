
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
async function registro(req, res) {
  const { getClient } = require('../config/db.js');
  const supabase = getClient();
  function validarBoleta(boleta) {
    const {verificarBoleta}=require('../models/ModeloUsuario.js');
    return true; // Placeholder
  }

  try {
    const { boleta, correo, password, confPsw } = req.body;

    // VALIDACIONES
    if (!boleta || !correo || !password) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    if (!validarBoleta(boleta)) {
      return res.status(400).json({
        error: "Boleta no registrada, verifica nuevamente que esté bien escrita"
      });
    }

    if (password !== confPsw) {
      return res.status(400).json({ error: "Las contraseñas no coinciden" });
    }

    // CREAR USUARIO EN SUPABASE
    const { data: userData, error: createError } =
      await supabase.auth.admin.createUser({
        email: correo,
        password: password,
        email_confirm: false,
        user_metadata: { boleta }
      });

    if (createError) {
      return res.status(400).json({ error: createError.message });
    }

    // ENVIAR CORREO DE VERIFICACIÓN
    const { error: emailError } = await supabase.auth.admin.generateLink({
      type: "signup",
      email: correo,
      options: {
        redirectTo: "http://localhost:3000/verificado" // ← PON AQUÍ TU URL REAL
      }
    });

    if (emailError) {
      return res.status(400).json({ error: emailError.message });
    }

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
module.exports = { RegisterUser, LoginUser };