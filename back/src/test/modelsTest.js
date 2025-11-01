const loginUser = require('../models/ModeloUsuario.js').loginUser;
const registerUser = require('../models/ModeloUsuario.js').registerUser;

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

//Test de modelo para el login de usuario
async function testLoginUser() {
  require('dotenv').config();
  console.log('--- Probando login de usuario ---');
  const loginResult = await loginUser(2024090191, 'test123');
  console.log(loginResult);
}

async function modelComputadoras(){
  const { obtenerRecursosPorTipo } = require('../models/ModeloRecursos.js');
  obtenerRecursosPorTipo().then(result => {
    console.log(result);
  }).catch(error => {
    console.error('Error al obtener recursos:', error);
  });
}



modelComputadoras(); // ✅ Esto imprime el resultado real
