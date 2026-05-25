export const SOLICITUD_LIBRO_LABELS = {
  1: 'En espera de aceptacion',
  2: 'En espera de recoleccion',
  3: 'Rechazada',
  4: 'Cancelada',
  5: 'En espera de devolucion',
  6: 'Devuelto',
};

const SOLICITUD_LIBRO_SORT_ORDER = {
  5: 0,
  2: 1,
  1: 2,
  6: 3,
  4: 4,
  3: 5,
};

function buildDetalle(label, value, options = {}) {
  return {
    label,
    value,
    format: options.format || 'datetime',
    warn: Boolean(options.warn),
  };
}

export function getSolicitudLibroEstadoId(solicitud) {
  const estadoBase = Number(solicitud?.estado_solicitud_id ?? solicitud?.estado_asistencia_id ?? 0);
  if (estadoBase === 5 && solicitud?.fecha_devolucion_real) return 6;
  return estadoBase || null;
}

export function getSolicitudLibroStatusLabel(estadoOrSolicitud) {
  const estado = typeof estadoOrSolicitud === 'object'
    ? getSolicitudLibroEstadoId(estadoOrSolicitud)
    : Number(estadoOrSolicitud);
  return SOLICITUD_LIBRO_LABELS[estado] || `Estado ${estado}`;
}

export function getSolicitudLibroSortOrder(estadoOrSolicitud) {
  const estado = typeof estadoOrSolicitud === 'object'
    ? getSolicitudLibroEstadoId(estadoOrSolicitud)
    : Number(estadoOrSolicitud);
  return SOLICITUD_LIBRO_SORT_ORDER[estado] ?? 99;
}

export function isSolicitudLibroActiva(solicitud) {
  return [1, 2, 5].includes(getSolicitudLibroEstadoId(solicitud));
}

export function getSolicitudLibroVisibleDetails(solicitud) {
  const estado = getSolicitudLibroEstadoId(solicitud);

  switch (estado) {
    case 1:
      return [
        buildDetalle('Hora de la solicitud', solicitud?.fecha_solicitud),
        buildDetalle('Fecha limite para aceptacion de la solicitud de libros', solicitud?.fecha_limite_respuesta, { warn: true }),
      ].filter((row) => row.value);
    case 2:
      return [
        buildDetalle('Fecha y hora limite para recoger el libro', solicitud?.fecha_limite_recoleccion, { warn: true }),
      ].filter((row) => row.value);
    case 5:
      return [
        buildDetalle('Fecha maxima para devolver el libro', solicitud?.fecha_limite_devolucion, { warn: true }),
      ].filter((row) => row.value);
    case 6:
      return [
        buildDetalle('Fecha y hora de devolucion del libro', solicitud?.fecha_devolucion_real),
      ].filter((row) => row.value);
    case 3:
    case 4:
      return [
        buildDetalle('Hora de la solicitud', solicitud?.fecha_solicitud),
        buildDetalle('Fecha limite para aceptacion de la solicitud de libros', solicitud?.fecha_limite_respuesta),
      ].filter((row) => row.value);
    default:
      return [];
  }
}

export function getSolicitudLibroHistoryDetails(solicitud) {
  const estado = getSolicitudLibroEstadoId(solicitud);

  switch (estado) {
    case 1:
    case 3:
    case 4:
      return [];
    case 2:
      return [
        buildDetalle('Hora de la solicitud', solicitud?.fecha_solicitud),
        buildDetalle('Fecha limite para aceptacion de la solicitud de libros', solicitud?.fecha_limite_respuesta),
      ].filter((row) => row.value);
    case 5:
      return [
        buildDetalle('Hora de la solicitud', solicitud?.fecha_solicitud),
        buildDetalle('Fecha limite para aceptacion de la solicitud de libros', solicitud?.fecha_limite_respuesta),
        buildDetalle('Fecha y hora limite para recoger el libro', solicitud?.fecha_limite_recoleccion),
      ].filter((row) => row.value);
    case 6:
      return [
        buildDetalle('Hora de la solicitud', solicitud?.fecha_solicitud),
        buildDetalle('Fecha limite para aceptacion de la solicitud de libros', solicitud?.fecha_limite_respuesta),
        buildDetalle('Fecha y hora limite para recoger el libro', solicitud?.fecha_limite_recoleccion),
        buildDetalle('Fecha y hora de entrega del libro', solicitud?.fecha_inicio_prestamo),
        buildDetalle('Fecha maxima para devolver el libro', solicitud?.fecha_limite_devolucion),
      ].filter((row) => row.value);
    default:
      return [];
  }
}

export function getSolicitudLibroSeguimiento(solicitud) {
  return {
    visible: getSolicitudLibroVisibleDetails(solicitud),
    history: getSolicitudLibroHistoryDetails(solicitud),
  };
}
