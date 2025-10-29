async function testUserRegistration(req, res) {
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

async function testUserLogin(req, res) {
  const {loginUser}=require('../models/authModel');
    console.log('--- Probando login de usuario controller---');
  const loginResult = await loginUser(2024090191, 'test123');
  console.log(loginResult);
}
testUserLogin(); // ✅ Esto imprime el resultado real