const { getClient } = require('../config/db.js');

const supabase = getClient();
const DEFAULT_LIMIT = 25;
const FETCH_BATCH_SIZE = 1000;

function resolvePagination({ page = 1, limit = 0, all = false } = {}) {
  const fetchAll = all || limit === 0;
  const safePage = fetchAll ? 1 : (Number.isFinite(page) && page > 0 ? page : 1);
  const safeLimit = fetchAll ? 0 : (Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_LIMIT);
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;

  return { page: safePage, limit: safeLimit, from, to, all: fetchAll };
}

async function getMatchingLibroIds({ q = '', tipo_material = '' } = {}) {
  const search = String(q || '').trim();
  const tipo = String(tipo_material || '').trim();

  if (!search && !tipo) {
    return null;
  }

  const buildQuery = (options) => {
    let query = supabase
      .from('libros')
      .select('id', options);

    if (search) {
      const term = `%${search}%`;
      query = query.or(`titulo.ilike.${term},autor.ilike.${term},isbn.ilike.${term},clasificacion.ilike.${term}`);
    }

    if (tipo) {
      query = query.eq('tipo_material', tipo);
    }

    return query;
  };

  const { count, error: countError } = await buildQuery({ count: 'exact', head: true });

  if (countError) {
    console.error('Error contando busqueda de libros:', countError);
    return { error: 'Error al buscar libros' };
  }

  const result = await fetchRowsInBatches(buildQuery, count || 0);

  if (!result.success) {
    console.error('Error buscando libros:', result.error);
    return { error: 'Error al buscar libros' };
  }

  return { ids: result.data.map((row) => row.id) };
}

async function tiposLibros() {
  const buildQuery = (options) => supabase
    .from('libros')
    .select('tipo_material', options)
    .not('tipo_material', 'is', null)
    .order('tipo_material', { ascending: true });

  const { count, error: countError } = await buildQuery({ count: 'exact', head: true });

  if (countError) {
    console.error('Error contando tipos de libros:', countError);
    return { error: 'Error al obtener tipos de libros' };
  }

  const result = await fetchRowsInBatches(buildQuery, count || 0);

  if (!result.success) {
    console.error('Error obteniendo tipos de libros:', result.error);
    return { error: 'Error al obtener tipos de libros' };
  }

  const data = [...new Set(result.data.map((row) => row.tipo_material).filter(Boolean))]
    .map((tipo_material) => ({ tipo_material }));

  return { data, total: data.length, page: 1, limit: data.length };
}

function applyEjemplarFilters(query, { libroIds, disponible } = {}) {
  if (Array.isArray(libroIds)) {
    query = query.in('libro_id', libroIds);
  }

  if (disponible !== undefined && disponible !== '') {
    query = query.eq('Disponible', disponible === true || disponible === 'true' || disponible === 'si');
  }

  return query;
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
    if (pagination.only_tipos) {
      return tiposLibros();
    }

    const { page, limit, from, to, all } = resolvePagination(pagination);
    const matching = await getMatchingLibroIds(pagination);

    if (matching?.error) {
      return { error: matching.error };
    }

    const libroIds = matching?.ids;

    if (Array.isArray(libroIds) && libroIds.length === 0) {
      return { data: [], total: 0, page: 1, limit: all ? 0 : limit };
    }

    const { count, error: countError } = await applyEjemplarFilters(supabase
      .from('ejemplares')
      .select('*', { count: 'exact', head: true }), {
        libroIds,
        disponible: pagination.disponible,
      });

    if (countError) {
      console.error('Error contando libros:', countError);
      return { error: 'Error al obtener los libros' };
    }

    const buildQuery = () => applyEjemplarFilters(supabase
      .from('ejemplares')
      .select(`
        id,
        libro_id,
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
      .order('id', { ascending: true }), {
        libroIds,
        disponible: pagination.disponible,
      });

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
