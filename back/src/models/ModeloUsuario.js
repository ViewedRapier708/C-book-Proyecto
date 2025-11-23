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

//Validacion si no hay alguna cuenta con la misma boleta
async function validarBoleta(boleta) {
  const { getClient } = require('../config/db');
  const supabase = getClient();
  try {
    const { data, error } = await supabase.from('auth.users').select('raw_user_meta_data').eq('raw_user_meta_data.boleta', boleta).single();

    if (error) return false;

    if (data && data.email_confirmed_at) {return true;}
    return false;
  } catch (err) {
    return false;
  }
}

async function RegisterUserAuth(boleta,correo,password) {
  const { getClient } = require('../config/db');
  const supabase = getClient();
  try {
      const { data, error } = await supabase.auth.signUp({
      email: correo,
      password: password,
      options: {
       emailRedirectTo: "https://viewedrapier708.github.io/C-book-Proyecto/pantallasUs/confirmacionCorreo.html",
        data: { boleta } // metadata
      }
    });
    if (error) {
      return false;
    }
  if (data) {
      return true;
  }  
  } catch (error) {
    
  }
}
async function validarConfirmacion(boleta) {
  const { getClient } = require('../config/db');
  const supabase = getClient();
  try {
    const { data, error } = await supabase.from('auth.users').select('email_confirmed_at').eq('raw_user_meta_data.boleta', boleta).single();
    if (error) return false;

    if (data && data.email_confirmed_at) {
      return true;
    }
    
  } catch (error) {

    return false;
  }
}

function createUser(boleta, correo) {
  const { getClient } = require('../config/db');
  const supabase = getClient();
  supabase.from('usuarios_web_movil').insert([{ boleta: boleta, correo: correo, tiene_documentos: false }]);
}

module.exports = { loginUser, RegisterUserAuth, validarBoleta, validarConfirmacion, createUser };
