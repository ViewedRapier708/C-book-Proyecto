async function obtenerRecursosPorTipo() {
  // Obtener cliente de Supabase
  const { getClient } = require('../config/db.js');
  const supabase = getClient();

  const { data: recursos, error } = await supabase
    .from('computadoras')
    .select('*');

  if (error) {
    return { error, data: null };
  }
  return { error: null, data: recursos };
}

module.exports = { obtenerRecursosPorTipo };