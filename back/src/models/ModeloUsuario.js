

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

//Funcion para registrar a un nuevo usuario en base a la existencia de la boleta
async function registerUser({ boleta, nombre, apellido, correo, password, tiene_documentos = false }) {
  const bcrypt = require('bcryptjs');
  const { getClient } = require('../config/db');
  const supabase = getClient();
  try {
    // Verificar que la boleta no exista
    const { data: existing, error: checkError } = await supabase
      .from('usuarios_web_movil')
      .select('boleta')
      .eq('boleta', boleta)
      .maybeSingle();

    if (checkError) return { error: checkError, data: null };
    if (existing) return { error: new Error('Boleta ya registrada'), data: null };

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('usuarios_web_movil')
      .insert([{
        boleta,
        nombre,
        apellido,
        correo,
        password: hashedPassword,
        tiene_documentos
      }])
      .select('boleta, nombre, apellido, correo, tiene_documentos')
      .single();

    if (error) return { error, data: null };
    return { error: null, data };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error('Error interno'), data: null };
  }
}




module.exports = { loginUser, registerUser };
// ✅ Esto imprime el resultado real
