const { json } = require('express');


//Funcion para iniciar sesión de un usuario
async function loginUser(boleta, password) {

//Obtiene el acceso a la base de datos
const { getClient } = require('../config/db');
//Importa bcrypt para el hash de contraseñas
const bcrypt = require('bcryptjs');
//Carga las variables de entorno

  
//Conecta con la base de datos
const supabase = getClient();
  const { data: user, error } = await supabase
    .from('usuarios_web_movil')
    .select('boleta, nombre, apellido, correo, tiene_documentos,password')
    .eq('boleta', boleta)
    .maybeSingle();

  //Obtiene el hash de la contraseña del usuario
  const passwordHash = user ? user.password : null;
  //Verifica si hubo un error en la consulta
  if (error) return { error, data: null };
  //Verifica si el usuario existe
  if (!user) return { error: new Error('Usuario no encontrado'), data: null };
//Compara la contraseña ingresada con el hash almacenado
  const isValid = await bcrypt.compare(password, passwordHash || '');
  //Si la contraseña no es válida, retorna un error
  if (!isValid) return { error: new Error('Contraseña incorrecta'), data: null };
  //Elimina el hash de la contraseña antes de retornar los datos del usuario
  const { passwordHash: _, ...safeUser } = user;
  return { error: null, data: safeUser };
}

//Este modelo se aplica al momento de hacer la solicitud de la creacion de la cuenta para que el sistema pueda mandar el codigo de verificacion al correo del alumno
async function verificarBoleta(boleta) {
  const { getClient } = require('../config/db');
  const supabase = getClient();
  const { data, error } = await supabase
    .from('usuarios_web_movil')
    .select('boleta')
    .eq('boleta', boleta)
    .maybeSingle();

  if (error) {
    return false;
  } 
  return true;

}

async function validarRegistro(boleta) {
  const { getClient } = require('../config/db');
  const supabase = getClient();
  
  try {
    const { data, error } = await supabase
      .from('usuarios_web_movil')
      .select('boleta')
      .eq('boleta', boleta)
      .maybeSingle();
    console.log(data);
    console.log(error);
    // Si hay error en la consulta
    if (error) {
      console.error('Error al validar registro:', error);
      return { existe: false, error };
    }
    
    // Si data existe, la boleta ya está registrada
    if (data) {
      return { existe: true, error: null };
    }
    
    // Si data es null, la boleta NO está registrada
    return { existe: false, error: null };
    
  } catch (err) {
    console.error('Error en validarRegistro:', err);
    return { existe: false, error: err };
  }
}



module.exports = { loginUser,  verificarBoleta,validarRegistro };

