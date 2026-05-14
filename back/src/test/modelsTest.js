const loginUser = require('../models/ModeloUsuario.js').loginUser;
const registerUser = require('../models/ModeloUsuario.js').registerUser;

//Test de modelo para el registro de usuario 
async function testRegisterUser() {
  const registerResult = await registerUser({
    boleta: 2024090191,
    nombre: 'test',
    apellido: 'test',
    correo: 'ae@example.com',
    password: 'test123'
  });
}

//Test de modelo para el login de usuario
async function testLoginUser() {
  require('dotenv').config();
  const loginResult = await loginUser(2024090191, 'test123');
}