const { getClient } = require('../config/db');

/**
 * Obtiene estadísticas generales del sistema
 */
async function obtenerEstadisticasGenerales() {
  const supabase = getClient();

  const [
    { count: totalUsuarios },
    { count: totalLibros },
    { count: totalComputadoras },
    { count: totalRestiradores },
    { data: solicitudesComp },
    { data: solicitudesRest },
    { data: solicitudesLibros },
    { data: prestamosLibros },
    { data: compDisponibles },
    { data: restDisponibles },
    { data: librosDisponibles },
  ] = await Promise.all([
    supabase.from('usuarios_web_movil').select('*', { count: 'exact', head: true }),
    supabase.from('ejemplares').select('*', { count: 'exact', head: true }),
    supabase.from('computadoras').select('*', { count: 'exact', head: true }),
    supabase.from('restiradores').select('*', { count: 'exact', head: true }),
    supabase.from('solicitudes_computadora').select('id, estado_asistencia_id, fecha_solicitud'),
    supabase.from('solicitudes_restirador').select('id, estado_asistencia_id, fecha_solicitud'),
    supabase.from('solicitudes_libros').select('id, estado_asistencia_id, fecha_solicitud'),
    supabase.from('prestamos_libros').select('id, estado_prestamo_id, fecha_inicio_prestamo'),
    supabase.from('computadoras').select('id').eq('Disponible', true),
    supabase.from('restiradores').select('id').eq('Disponible', true),
    supabase.from('ejemplares').select('id').eq('Disponible', true),
  ]);

  // Calcular solicitudes por estado
  const allSolicitudes = [
    ...(solicitudesComp || []).map(s => ({ ...s, tipo: 'computadora' })),
    ...(solicitudesRest || []).map(s => ({ ...s, tipo: 'restirador' })),
    ...(solicitudesLibros || []).map(s => ({ ...s, tipo: 'libro' })),
  ];

  const pendientes = allSolicitudes.filter(s => s.estado_asistencia_id === 1).length;
  const aprobadas = allSolicitudes.filter(s => s.estado_asistencia_id === 2).length;
  const completadas = allSolicitudes.filter(s => s.estado_asistencia_id === 3).length;
  const canceladas = allSolicitudes.filter(s => s.estado_asistencia_id === 4).length;

  // Préstamos activos vs devueltos
  const prestamosActivos = (prestamosLibros || []).filter(p => p.estado_prestamo_id !== 3).length;
  const prestamosDevueltos = (prestamosLibros || []).filter(p => p.estado_prestamo_id === 3).length;

  // Solicitudes por tipo
  const solicitudesPorTipo = {
    computadora: (solicitudesComp || []).length,
    restirador: (solicitudesRest || []).length,
    libro: (solicitudesLibros || []).length,
  };

  // Solicitudes por estado
  const solicitudesPorEstado = {
    pendientes,
    aprobadas,
    completadas,
    canceladas,
  };

  return {
    totales: {
      usuarios: totalUsuarios || 0,
      libros: totalLibros || 0,
      computadoras: totalComputadoras || 0,
      restiradores: totalRestiradores || 0,
      solicitudes: allSolicitudes.length,
      prestamosActivos,
      prestamosDevueltos,
    },
    disponibilidad: {
      computadoras: {
        disponibles: (compDisponibles || []).length,
        total: totalComputadoras || 0,
      },
      restiradores: {
        disponibles: (restDisponibles || []).length,
        total: totalRestiradores || 0,
      },
      libros: {
        disponibles: (librosDisponibles || []).length,
        total: totalLibros || 0,
      },
    },
    solicitudesPorTipo,
    solicitudesPorEstado,
  };
}

/**
 * Obtiene datos de tendencia (solicitudes por día en los últimos 30 días)
 */
async function obtenerTendencias() {
  const supabase = getClient();
  const hace30Dias = new Date();
  hace30Dias.setDate(hace30Dias.getDate() - 30);
  const desde = hace30Dias.toISOString();

  const [
    { data: solicComp },
    { data: solicRest },
    { data: solicLibros },
  ] = await Promise.all([
    supabase.from('solicitudes_computadora').select('fecha_solicitud').gte('fecha_solicitud', desde),
    supabase.from('solicitudes_restirador').select('fecha_solicitud').gte('fecha_solicitud', desde),
    supabase.from('solicitudes_libros').select('fecha_solicitud').gte('fecha_solicitud', desde),
  ]);

  // Agrupar por día
  const diasMap = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().slice(0, 10);
    diasMap[key] = { fecha: key, computadoras: 0, restiradores: 0, libros: 0, total: 0 };
  }

  (solicComp || []).forEach(s => {
    const key = (s.fecha_solicitud || '').slice(0, 10);
    if (diasMap[key]) { diasMap[key].computadoras++; diasMap[key].total++; }
  });
  (solicRest || []).forEach(s => {
    const key = (s.fecha_solicitud || '').slice(0, 10);
    if (diasMap[key]) { diasMap[key].restiradores++; diasMap[key].total++; }
  });
  (solicLibros || []).forEach(s => {
    const key = (s.fecha_solicitud || '').slice(0, 10);
    if (diasMap[key]) { diasMap[key].libros++; diasMap[key].total++; }
  });

  return Object.values(diasMap);
}

/**
 * Obtiene las últimas actividades del sistema
 */
async function obtenerActividadReciente(limite = 20) {
  const supabase = getClient();

  const [
    { data: solicComp },
    { data: solicRest },
    { data: solicLibros },
    { data: prestamos },
  ] = await Promise.all([
    supabase.from('solicitudes_computadora')
      .select('id, usuario_boleta, estado_asistencia_id, fecha_solicitud')
      .order('fecha_solicitud', { ascending: false })
      .limit(limite),
    supabase.from('solicitudes_restirador')
      .select('id, usuario_boleta, estado_asistencia_id, fecha_solicitud')
      .order('fecha_solicitud', { ascending: false })
      .limit(limite),
    supabase.from('solicitudes_libros')
      .select('id, usuario_boleta, estado_asistencia_id, fecha_solicitud')
      .order('fecha_solicitud', { ascending: false })
      .limit(limite),
    supabase.from('prestamos_libros')
      .select('id, estado_prestamo_id, fecha_inicio_prestamo, solicitudes_libros(usuario_boleta)')
      .order('fecha_inicio_prestamo', { ascending: false })
      .limit(limite),
  ]);

  const actividades = [];

  (solicComp || []).forEach(s => actividades.push({
    tipo: 'solicitud_computadora',
    id: s.id,
    boleta: s.usuario_boleta,
    estado: s.estado_asistencia_id,
    fecha: s.fecha_solicitud,
  }));
  (solicRest || []).forEach(s => actividades.push({
    tipo: 'solicitud_restirador',
    id: s.id,
    boleta: s.usuario_boleta,
    estado: s.estado_asistencia_id,
    fecha: s.fecha_solicitud,
  }));
  (solicLibros || []).forEach(s => actividades.push({
    tipo: 'solicitud_libro',
    id: s.id,
    boleta: s.usuario_boleta,
    estado: s.estado_asistencia_id,
    fecha: s.fecha_solicitud,
  }));
  (prestamos || []).forEach(p => actividades.push({
    tipo: 'prestamo_libro',
    id: p.id,
    boleta: p.solicitudes_libros?.usuario_boleta || null,
    estado: p.estado_prestamo_id === 3 ? 'devuelto' : 'activo',
    fecha: p.fecha_inicio_prestamo,
  }));

  // Ordenar por fecha descendente
  actividades.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return actividades.slice(0, limite);
}

module.exports = {
  obtenerEstadisticasGenerales,
  obtenerTendencias,
  obtenerActividadReciente,
};
