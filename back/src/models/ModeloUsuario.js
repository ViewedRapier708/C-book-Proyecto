
//Funcion para iniciar sesión de un usuario usando Supabase Auth
/*
async function loginUser(boleta, password) {
  const { getClient } = require('../config/db');
  const supabase = getClient();

  // 1. Buscar el correo asociado a la boleta en la tabla usuarios_web_movil
  const { data: userData, error: userError } = await supabase
    .from('usuarios_web_movil')
    .select('correo')
    .eq('boleta', boleta)
    .maybeSingle();

  if (userError || !userData) {
    return { error: new Error('Usuario no encontrado'), data: null };
  }

  const email = userData.correo;

  // 2. Iniciar sesión en Supabase Auth con el correo y la contraseña
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (authError) {
    return { error: new Error('Contraseña incorrecta'), data: null };
  }

  // Retornar la sesión y el usuario de Supabase Auth
  return { error: null, data: authData };
}
*/
//Validacion si no hay alguna cuenta con la misma boleta
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
    return false;
  }
}

//Funcion que valide que no haya otra cuenta con la misma boleta
async function validarBoleta(boleta) {
  const { getClient } = require('../config/db');
  const supabase = getClient();
  try {
    const { data, error } = await supabase.from('auth.users').select('raw_user_meta_data').eq('raw_user_meta_data.boleta', boleta).single();
    
    console.log("Validacion de boleta en ModeloUsuario:", data);//Debug

    if (error) return "Error de nuestra parte intente mas tarde";

    if (data) {return true;}
    return false;
  } catch (err) {
    return false;
  }
}
//Validacion de confirmación de correo se necesita un bucle para verificar cada cierto tiempo si el usuario ya confirmó su correo
async function validarConfirmacion(boleta) {
  const { getClient } = require('../config/db');
  const supabase = getClient();
  try {
    const { data, error } = await supabase.from('auth.users').select('email_confirmed_at').eq('raw_user_meta_data.boleta', boleta).single();

    if (error) return false; //retorna false si hay un error

    if (data && data.email_confirmed_at) {
      return true;
    }//Inidica que el correo ya fue confirmado

    return false;//No ha confirmado su correo
    
  } catch (error) {

    return false;//Por si hay un error
  }
}
//Crear usuario en la tabla usuarios_web_movil despues de la confirmacion de correo
async function createUser(data) {
  const { getClient } = require('../config/db');
  const supabase = getClient();
  
  try {
    const { error } = await supabase.from('usuarios_web_movil').insert([{ 
      boleta: data.boleta, 
      correo: data.correo, 
      grupo: data.grupo || null,
      tiene_documentos: false 
    }]);
    
    if (error) {
      console.error("Error al crear usuario en usuarios_web_movil:", error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Error en createUser:", err);
    return false;
  }
}



module.exports = { /*loginUser,*/ RegisterUserAuth, validarBoleta, validarConfirmacion, createUser };
