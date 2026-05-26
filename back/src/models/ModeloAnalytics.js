const { getClient } = require('../config/db');

/**
 * Obtiene estadisticas generales del sistema
 */
async function obtenerEstadisticasGenerales() {
  const supabase = getClient();

  const [
    { count: totalUsuarios },
    { count: totalLibros },
    { count: totalSolicitudes },
    { count: pendientes },
    { count: aprobadas },
    { count: completadas },
    { count: canceladas },
    { count: prestamosActivos },
    { count: prestamosDevueltos },
    { count: librosDisponibles },
  ] = await Promise.all([
    supabase.from('usuarios_web_movil').select('*', { count: 'exact', head: true }).eq('rol', 'alumno'),
    supabase.from('ejemplares').select('*', { count: 'exact', head: true }),
    supabase.from('solicitudes_libros').select('*', { count: 'exact', head: true }),
    supabase.from('solicitudes_libros').select('*', { count: 'exact', head: true }).eq('estado_asistencia_id', 1),
    supabase.from('solicitudes_libros').select('*', { count: 'exact', head: true }).eq('estado_asistencia_id', 2),
    supabase.from('solicitudes_libros').select('*', { count: 'exact', head: true }).eq('estado_asistencia_id', 3),
    supabase.from('solicitudes_libros').select('*', { count: 'exact', head: true }).eq('estado_asistencia_id', 4),
    supabase.from('prestamos_libros').select('*', { count: 'exact', head: true }).neq('estado_prestamo_id', 3),
    supabase.from('prestamos_libros').select('*', { count: 'exact', head: true }).eq('estado_prestamo_id', 3),
    supabase.from('ejemplares').select('*', { count: 'exact', head: true }).eq('Disponible', true),
  ]);

  const solicitudesPorTipo = {
    libro: totalSolicitudes || 0,
  };

  const solicitudesPorEstado = {
    pendientes: pendientes || 0,
    aprobadas: aprobadas || 0,
    completadas: completadas || 0,
    canceladas: canceladas || 0,
  };

  return {
    totales: {
      usuarios: totalUsuarios || 0,
      libros: totalLibros || 0,
      solicitudes: totalSolicitudes || 0,
      prestamosActivos: prestamosActivos || 0,
      prestamosDevueltos: prestamosDevueltos || 0,
    },
    disponibilidad: {
      libros: {
        disponibles: librosDisponibles || 0,
        total: totalLibros || 0,
      },
    },
    solicitudesPorTipo,
    solicitudesPorEstado,
  };
}

/**
 * Obtiene datos de tendencia (solicitudes por dia en los ultimos 30 dias)
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

  const diasMap = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().slice(0, 10);
    diasMap[key] = { fecha: key, libros: 0, total: 0 };
  }

  (solicLibros || []).forEach((s) => {
    const key = (s.fecha_solicitud || '').slice(0, 10);
    if (diasMap[key]) {
      diasMap[key].libros++;
      diasMap[key].total++;
    }
  });

  return Object.values(diasMap);
}

/**
 * Obtiene las ultimas actividades del sistema
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

  (solicLibros || []).forEach((s) => actividades.push({
    tipo: 'solicitud_libro',
    id: s.id,
    boleta: s.usuario_boleta,
    estado: s.estado_asistencia_id,
    fecha: s.fecha_solicitud,
  }));

  (prestamos || []).forEach((p) => actividades.push({
    tipo: 'prestamo_libro',
    id: p.id,
    boleta: p.solicitudes_libros?.usuario_boleta || null,
    estado: p.estado_prestamo_id === 3 ? 'devuelto' : 'activo',
    fecha: p.fecha_inicio_prestamo,
  }));

  actividades.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return actividades.slice(0, limite);
}

module.exports = {
  obtenerEstadisticasGenerales,
  obtenerTendencias,
  obtenerActividadReciente,
};
