const { verificarExistenciaBoleta } = require('../middleware/verificarExistenciaBoleta');
async function testMidlewareBoleta() {
  const verificar = await  verificarExistenciaBoleta({body: {boleta: 2024090191}});
}
testMidlewareBoleta();

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
