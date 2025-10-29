
const { getClient } = require('../config/db');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../config/.env' });


async function loginUser(boleta, password) {
  const supabase = getClient();
  const { data: user, error } = await supabase
    .from('usuarios_web_movil')
    .select('boleta, nombre, apellido, correo, tiene_documentos,password')
    .eq('boleta', boleta)
    .maybeSingle();
  const passwordHash = user ? user.password : null;
  if (error) return { error, data: null };
  if (!user) return { error: new Error('Usuario no encontrado'), data: null };

  const isValid = await bcrypt.compare(password, passwordHash || '');
  console.log(isValid)
  if (!isValid) return { error: new Error('Contraseña incorrecta'), data: null };

  const { passwordHash: _, ...safeUser } = user;
  return { error: null, data: safeUser };
}

async function registerUser({ boleta, nombre, apellido, correo, password, tiene_documentos = false }) {
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
