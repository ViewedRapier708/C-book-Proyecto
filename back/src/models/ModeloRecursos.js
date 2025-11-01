
const modelosRecursos = { 
  obtenerComputadoras: async () => { // Obtener cliente de Supabase
  const { getClient } = require('../config/db.js');
  const supabase = getClient();

  const { data: recursos, error } = await supabase
    .from('computadoras')
    .select('id,procesador,programas,carrera,ocupado');

  if (error) {
    return { error, data: null };
  }
  return { error: null, data: recursos };
}, obtenerRestiradores: async () => { // Obtener cliente de Supabase
  const { getClient } = require('../config/db.js');
  const supabase = getClient();

  const { data: recursos, error } = await supabase
    .from('restiradores')
    .select('*');

  if (error) {
    return { error, data: null };
  }
  return { error: null, data: recursos };
}, obtenerLibros: async () => { // Obtener cliente de Supabase

  const { data: recursos, error } = await supabase
    .from('libros')
    .select('*');
  if (error) {
    return { error, data: null };
  }
  return { error: null, data: recursos };
}


};


module.exports = modelosRecursos;