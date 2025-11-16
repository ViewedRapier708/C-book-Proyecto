const { verificarExistenciaBoleta } = require('../middleware/verificarExistenciaBoleta');
async function testMidlewareBoleta() {
  console.log('--- Verificando existencia de boleta ---');
  const verificar = await  verificarExistenciaBoleta({body: {boleta: 2024090191}});
  console.log(verificar);
}
testMidlewareBoleta();

//Test de modelo para el registro de usuario 
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
