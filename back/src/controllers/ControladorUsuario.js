
async function RegisterUser(req,res) {
    const {registerUser}=require('../models/ModeloUsuario.js');
    const {boleta, nombre, apellido, correo, password} = req.body;
    const result = await registerUser({ boleta, nombre, apellido, correo, password });
    if (result.error) {
        return res.status(400).json({ error: result.error.message });
    }
    return res.status(201).json({ user: result.data });
}


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