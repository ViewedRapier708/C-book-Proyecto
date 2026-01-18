
const {getClient} = require('../config/db.js');
const supabase = getClient();
async function ObtenerRecurzos(tipo) {
  switch (tipo) {
    case 'computadora':
      console.log("Obteniendo recursos de tipo: computadora");
      return await computadoras();
    case 'restirador':
      console.log("Obteniendo recursos de tipo: restirador");
      return await restiradores();
    case 'libro':
      console.log("Obteniendo recursos de tipo: libro");
      return await libros();
    default:
      return '<div class="alert alert-danger animate__animated animate__slideInRight" style="margin: 10px;">Tipo de recurso inválido</div>' ;
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
  .from('ejemplares')
  .select(`
    id,
    numero_ejemplar,
    anio,
    estatus_item,
    "Disponible",
    coleccion,
    libros (
      titulo,
      autor,
      clasificacion,
      isbn,
      tipo_material
    )
  `);


    if (error) {
      console.error("Error obteniendo libros:", error);
      return { error: 'Error al obtener los libros' };
    }
    console.log("Libros obtenidos:", data); //debug
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


module.exports = {ObtenerRecurzos};