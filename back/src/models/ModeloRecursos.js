const {getClient} = require('../config/db.js');
const supabase = getClient();
async function ObtenerRecurzos(tipo) {
  switch (tipo) {
    case 'libro':
      return await libros();
    default:
      return '<div class="alert alert-danger animate__animated animate__slideInRight" style="margin: 10px;">Tipo de recurso inválido</div>' ;
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
    return data;
  } catch (error) {
    
  }

}

async function librosMasSolicitados(limite = 5) {
  try {
    const { data: solicitudes, error: solError } = await supabase
      .from('solicitudes_libros')
      .select('ejemplar_id');

    if (solError) {
      console.error("Error obteniendo solicitudes:", solError);
      return [];
    }

    const counts = {};
    solicitudes.forEach(s => {
      if (s.ejemplar_id) {
        counts[s.ejemplar_id] = (counts[s.ejemplar_id] || 0) + 1;
      }
    });

    const topIds = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limite)
      .map(([id]) => Number(id));

    if (topIds.length === 0) return [];

    const { data: ejemplares, error: ejError } = await supabase
      .from('ejemplares')
      .select(`
        id, numero_ejemplar, anio, "Disponible", coleccion,
        libros ( titulo, autor, clasificacion, isbn, tipo_material )
      `)
      .in('id', topIds);

    if (ejError) {
      console.error("Error obteniendo ejemplares:", ejError);
      return [];
    }

    return ejemplares.map(e => ({
      ...e,
      solicitudes_count: counts[e.id]
    })).sort((a, b) => b.solicitudes_count - a.solicitudes_count);

  } catch (err) {
    console.error("Error en librosMasSolicitados:", err);
    return [];
  }
}

module.exports = {ObtenerRecurzos, librosMasSolicitados};