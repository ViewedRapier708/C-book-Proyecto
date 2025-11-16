
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

}
//Validacion de la boleta
function validarBoleta(boleta) {
  const {verificarBoleta}=require('../models/ModeloUsuario.js');
  return verificarBoleta(boleta);
}
const enviarCorreo =()=>{
  const {} = require('nodemailer');
  const correo=req.body.boleta;
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