
// Crear usuario en la tabla usuarios_web_movilte

//Funcion que obtenga el correo y boleta y el estado de la confirmacion del correo para crear la cuenta en la tabla de usuario 

// const { getClient } = require('../config/db');
let getClient;
try {
    ({ getClient } = require('../src/config/db'));
} catch (e) {
    ({ getClient } = require('../config/db'));
}
const supabase = getClient();
async function VerificarCorreo() {
    try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
            console.error("Error obteniendo usuario autenticado:", error);
            return null;
        }
    } catch (error) {
        
    }

}


async function crearUsuarioEnTabla(boleta, correo) {
  const supabase = getClient();
  try {
    console.log("Creando usuario en tabla:", { boleta, correo }); //debug
    
    const { data, error } = await supabase
      .from('usuarios_web_movil')
      .insert([{
        boleta: parseInt(boleta),
        correo: correo,
        tiene_documentos: false
      }])
      .select();

    if (error) {
      console.error("Error insertando usuario:", error.message, error.details);
      return { success: false, error: error.message };
    }

    console.log("Usuario creado:", data); //debug
    return { success: true, data: data };
  } catch (err) {
    console.error("Error en crearUsuarioEnTabla:", err);
    return { success: false, error: 'Error interno' };
  }
}