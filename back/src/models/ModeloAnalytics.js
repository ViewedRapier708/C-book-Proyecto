const { getClient } = require('../config/db');

/**
 * Obtiene estadísticas generales del sistema
 */
async function obtenerEstadisticasGenerales() {
  const supabase = getClient();

  const [
    { count: totalUsuarios },
    { count: totalLibros },
    { data: solicitudesLibros },
    { data: prestamosLibros },
    { data: librosDisponibles },
  ] = await Promise.all([
    supabase.from('usuarios_web_movil').select('*', { count: 'exact', head: true }),
    supabase.from('ejemplares').select('*', { count: 'exact', head: true }),
    supabase.from('solicitudes_libros').select('id, estado_asistencia_id, fecha_solicitud'),
    supabase.from('prestamos_libros').select('id, estado_prestamo_id, fecha_inicio_prestamo'),
    supabase.from('ejemplares').select('id').eq('Disponible', true),
  ]);

  // Calcular solicitudes por estado
  const allSolicitudes = [
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
      solicitudes: allSolicitudes.length,
      prestamosActivos,
      prestamosDevueltos,
    },
    disponibilidad: {
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
    { data: solicLibros },
  ] = await Promise.all([
    supabase.from('solicitudes_libros').select('fecha_solicitud').gte('fecha_solicitud', desde),
  ]);

  // Agrupar por día
  const diasMap = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().slice(0, 10);
    diasMap[key] = { fecha: key, libros: 0, total: 0 };
  }

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
    { data: solicLibros },
    { data: prestamos },
  ] = await Promise.all([
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