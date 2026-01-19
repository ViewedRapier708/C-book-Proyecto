async function testUserRegistration(req, res) {
  const registerResult = await registerUser({
    boleta: 2024090191,
    nombre: 'test',
    apellido: 'test',
    correo: 'ae@example.com',
    password: 'test123'
  });
}

async function testUserLogin(req, res) {
  const {loginUser}=require('../models/authModel');
  const loginResult = await loginUser(2024090191, 'test123');
}
testUserLogin(); // ✅ Esto imprime el resultado real