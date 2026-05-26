const { getClient } = require('../config/db.js');

const supabase = getClient();
const DEFAULT_LIMIT = 25;
const FETCH_BATCH_SIZE = 1000;

function resolvePagination({ page = 1, limit = 0 } = {}) {
  const all = limit === 0;
  const safePage = all ? 1 : (Number.isFinite(page) && page > 0 ? page : 1);
  const safeLimit = all ? 0 : (Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_LIMIT);
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;

  return { page: safePage, limit: safeLimit, from, to, all };
}

async function fetchRowsInBatches(buildQuery, total) {
  if (!total || total <= 0) {
    return { success: true, data: [] };
  }

  const rows = [];

  for (let start = 0; start < total; start += FETCH_BATCH_SIZE) {
    const end = Math.min(start + FETCH_BATCH_SIZE - 1, total - 1);
    const { data, error } = await buildQuery().range(start, end);

    if (error) {
      return { success: false, error };
    }

    rows.push(...(data || []));
  }

  return { success: true, data: rows };
}

async function ObtenerRecurzos(tipo, pagination = {}) {
  switch (tipo) {
    case 'libro':
      return libros(pagination);
    default:
      return { error: 'Tipo de recurso invalido' };
  }
}

const libros = async (pagination = {}) => {
  try {
    const { page, limit, from, to, all } = resolvePagination(pagination);

    const { count, error: countError } = await supabase
      .from('ejemplares')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error contando libros:', countError);
      return { error: 'Error al obtener los libros' };
    }

    const buildQuery = () => supabase
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
      `)
      .order('id', { ascending: true });

    let data = [];

    if (all) {
      const result = await fetchRowsInBatches(buildQuery, count || 0);

      if (!result.success) {
        console.error('Error obteniendo libros:', result.error);
        return { error: 'Error al obtener los libros' };
      }

      data = result.data;
    } else {
      const { data: pagedData, error } = await buildQuery().range(from, to);

      if (error) {
        console.error('Error obteniendo libros:', error);
        return { error: 'Error al obtener los libros' };
      }

      data = pagedData || [];
    }

    return {
      data,
      total: count || 0,
      page: all ? 1 : page,
      limit: all ? (count || 0) : limit,
    };
  } catch (error) {
    console.error('Error interno obteniendo libros:', error);
    return { error: 'Error al obtener los libros' };
  }
};

async function librosMasSolicitados(limite = 5) {
  try {
    const { data: solicitudes, error: solError } = await supabase
      .from('solicitudes_libros')
      .select('ejemplar_id');

    if (solError) {
      console.error('Error obteniendo solicitudes:', solError);
      return [];
    }

    const counts = {};
    solicitudes.forEach((s) => {
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
      console.error('Error obteniendo ejemplares:', ejError);
      return [];
    }

    return ejemplares.map((e) => ({
      ...e,
      solicitudes_count: counts[e.id]
    })).sort((a, b) => b.solicitudes_count - a.solicitudes_count);
  } catch (err) {
    console.error('Error en librosMasSolicitados:', err);
    return [];
  }
}

module.exports = { ObtenerRecurzos, librosMasSolicitados };
