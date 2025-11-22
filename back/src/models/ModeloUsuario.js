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

  //Verifica si hubo un error en la consulta
  if (error) return { error, data: null };
  //Verifica si el usuario existe
  if (!user) return { error: new Error('Usuario no encontrado'), data: null };
  //Obtiene el hash de la contraseña del usuario
  const passwordHash = user.password;
  //Compara la contraseña ingresada con el hash almacenado
  const isValid = await bcrypt.compare(password, passwordHash || '');
  //Si la contraseña no es válida, retorna un error
  if (!isValid) return { error: new Error('Contraseña incorrecta'), data: null };
  //Elimina el hash de la contraseña antes de retornar los datos del usuario
  const { password: _, ...safeUser } = user;
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

async function validarRegistro(correo) {
  const { getClient } = require('../config/db');
  const supabase = getClient();
  try {
    const { data, error } = await supabase.from('auth.users').select('email_confirmed_at').eq('email', correo).single();

    if (error) return false;

    if (data && data.email_confirmed_at) {return true;}
    return false;
  } catch (err) {
    return false;
  }
}



<<<<<<< HEAD
module.exports = { loginUser,  verificarBoleta,validarRegistro };
=======
module.exports = { loginUser, registerUser, verificarBoleta, validarRegistro };
>>>>>>> 4fbf9ac48c91ac725764d4e348f876f1a5d5355f

