const loginUser = require('../models/authModel').loginUser;
const registerUser = require('../models/authModel').registerUser;
require('dotenv').config({ path: '../config/.env' });

async function testRegisterUser() {
  console.log('--- Probando registro de usuario ---');
  const registerResult = await registerUser({
    boleta: 2024090191,
    nombre: 'test',
    apellido: 'test',
    correo: 'ae@example.com',
    password: 'test123'
  });
  console.log(registerResult);
}
async function testLoginUser() {
  console.log('--- Probando login de usuario ---');
  const loginResult = await loginUser(2024090191, 'test123');
  console.log(loginResult);
}

testLoginUser(); // ✅ Esto imprime el resultado real
