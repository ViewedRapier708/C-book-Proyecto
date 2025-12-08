
const {getClient} = require('../config/db.js');
const supabase = getClient();
async function ObtenerRecurzos(tipo) {
  switch (tipo) {
    case 'computadora':
      return await computadoras();
    case 'restirador':
      return await restiradores();
    case 'libro':
      return await libros();
    default:
      return { error: 'Tipo de recurso inválido' };
  }
}

const restiradores = async () => {
    try {
      const { data, error } = await supabase
        .from('restiradores')
        .select('no_restirador,Observacion,Disponible,estado_de_material,estado_de_material')

      if (error) {
        console.error("Error obteniendo restiradores:", error);
        return { error: 'Error al obtener los restiradores' };
      }
      return data;
    } catch (error) {
      return { error: 'Error al obtener los restiradores' };
    }
}
const libros = async () => {
  try {
    const { data, error } = await supabase
      .from('ejemplares_libros')
      .select('libros(titulo, autores(nombre),tipo_material),numero_ejemplar,anio,Disponibilidad,estatus_item')

    if (error) {
      console.error("Error obteniendo libros:", error);
      return { error: 'Error al obtener los libros' };
    }
    return data;
  } catch (error) {
    
  }

}
const computadoras = async () => {
  try {
    const { data, error } = await supabase
      .from('computadoras')
      .select('no_computadora,Observacion,procesador,programas,carrera,Disponible,En_funcionamiento')
    if (error) {
      console.error("Error obteniendo computadoras:", error);
      return { error: 'Error al obtener las computadoras' };
    }
    return data;
  } catch (error) {
    return { error: 'Error al obtener las computadoras' };
  }
}


module.exports = ObtenerRecurzos;