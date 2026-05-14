const { getClient } = require('../config/db');
const supabase = getClient();


// ==================== CREAR SOLICITUD ====================
async function CrearSolicitud(tipoSolicitud, boleta, idRecurso) {
    switch (tipoSolicitud) {
        case 'libro':
            return await CrearSolicitudlibro(boleta, idRecurso);
        default:
            return { success: false, error: 'Tipo de solicitud inválido' };
    }
}


//==================Funciones de los materiales para agregar los registros==================
async function CrearSolicitudlibro(boleta, idRecurso) {
    try {
        // Estado 1 = pendiente (ajusta si tu catálogo es diferente)
        // No se envían fechas, se usan los defaults de la tabla
        const { error } = await supabase
            .from('solicitudes_libros')
            .insert([{
                usuario_boleta: boleta,
                ejemplar_id: idRecurso
                // fechas y demás campos usan los defaults de la tabla
            }]);
        if (error) {
            console.error("Error creando solicitud de libro:", error);
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err) {
        console.error("Error en CrearSolicitudlibro:", err);
        return { success: false, error: 'Error interno del servidor' };
    }
}


//=====================Verificar disponibilidad de recursos middleware=====================
async function VerificarDisponibilidadRecurso(tipoSolicitud, idRecurso) {//Poner en creacion de solicitud
    //Funcion general para la verificacion de disponibilidad
    switch (tipoSolicitud) {
        case 'libro':
            return await VerificarDisponibilidadLibro(idRecurso);
        default:
            return { disponible: false, error: 'Tipo de recurso inválido' };
    }

    async function VerificarDisponibilidadLibro(n_recurso) {
        try {
            // Ahora n_recurso es el id del ejemplar
            const { data, error } = await supabase
                .from('ejemplares')
                .select('id,Disponible')
                .eq('id', n_recurso)
                .single();

            if (error) {
                console.error("Error verificando disponibilidad:", error);
                return { success: false, message: error.message };
            }
            if (!data) {
                return { success: false, message: 'Recurso no encontrado' };
            }
            if (data.Disponible === false) {
                return { message: 'El libro no está disponible actualmente', success: false };
            }
            return { success: true, message: null, idRecurso: data.id };//Indica que el libro está disponible
        } catch (error) {
            return { success: false, message: 'Error interno del servidor' };
        }

    }

}



// ==================== OBTENER SOLICITUDES ACTIVAS ====================
async function ObtenerSolicitudesActivasPorBoleta(tipo, boleta) {
    const numeroBoleta = Number(boleta);
    if (!tipo || !boleta) {
        return { success: false, error: 'Faltan datos obligatorios' };
    }

    if (tipo === 'libro') {
        //Contar solicitudes activas en la tabla de libros
        const libros = await contarPendientesPorTabla(supabase, 'solicitudes_libros', numeroBoleta);
        if (!libros.success) {
            return libros;
        }
        return {
            success: true,
            total: libros.count
        }
    }
    async function contarPendientesPorTabla(client, tabla, boleta) {
        try {
            const { data, count, error } = await client
                .from(tabla)
                .select('id', { count: 'exact' })
                .eq('usuario_boleta', String(boleta))
                .eq('estado_asistencia_id', 1);
            if (error) {
                console.error(`Error consultando ${tabla}:`, error);
                return { success: false, error: error.message, count: 0 };
            }

            return { success: true, count: count };
        } catch (err) {
            console.error(`Error inesperado consultando ${tabla}:`, err);
            return { success: false, error: 'Error interno', count: 0 };
        }
    }

}
async function getSolicitudes(boleta) {
  const supabase = getClient();
  try {
    const [libRes] = await Promise.all([
      supabase
        .from('solicitudes_libros')
        .select(`id, usuario_boleta, ejemplar_id, fecha_solicitud, fecha_limite_respuesta, fecha_aprobacion, fecha_limite_recoleccion, motivo_rechazo, fecha_rechazo, estado_asistencia_id,
          ejemplares ( id, numero_ejemplar, libros ( titulo, autor ) ),
          prestamos_libros ( fecha_inicio_prestamo, fecha_limite_devolucion, fecha_devolucion_real )`)
        .eq('usuario_boleta', boleta),
    ]);

    if (libRes.error) console.error("Error solicitudes_libros:", libRes.error);

    const libros = (libRes.data || []).map(s => {
      const prestamo = Array.isArray(s.prestamos_libros) ? s.prestamos_libros[0] : s.prestamos_libros;
      return {
        ...s,
        tipo_solicitud: 'libro',
        recurso_id: s.ejemplar_id,
        titulo: s.ejemplares?.libros?.titulo || null,
        autor: s.ejemplares?.libros?.autor || null,
        fecha_inicio_prestamo: prestamo?.fecha_inicio_prestamo || null,
        fecha_limite_devolucion: prestamo?.fecha_limite_devolucion || null,
        fecha_devolucion_real: prestamo?.fecha_devolucion_real || null,
      };
    });

    const solicitudes = [...libros]
      .sort((a, b) => new Date(b.fecha_solicitud) - new Date(a.fecha_solicitud));

    const solicitudesEnriquecidas = await anexarNumeroMaterialSolicitudes(supabase, solicitudes);

    return { success: true, data: solicitudesEnriquecidas };
  } catch (err) {
    console.error("Error en getSolicitudes:", err);
    return { success: false, error: 'Error interno' };
  }
}

function normalizarTipoSolicitud(solicitud) {
    const tipo = solicitud?.tipo ?? solicitud?.tipo_solicitud ?? '';
    return String(tipo).trim().toLowerCase();
}

function obtenerIdRecursoSolicitud(solicitud) {
    if (!solicitud || typeof solicitud !== 'object') return null;
    const id = (
        solicitud.recurso_id ??
        solicitud.id_recurso ??
        solicitud.ejemplar_id ??
        solicitud.recurso?.id ??
        solicitud.recurso ??
        null
    );
    const idNumero = Number(id);
    return Number.isFinite(idNumero) ? idNumero : null;
}

async function anexarNumeroMaterialSolicitudes(supabase, solicitudes) {
    if (!Array.isArray(solicitudes) || solicitudes.length === 0) return solicitudes;

    const idsLibros = new Set();

    solicitudes.forEach((solicitud) => {
        const tipo = normalizarTipoSolicitud(solicitud);
        const idRecurso = obtenerIdRecursoSolicitud(solicitud);
        if (!idRecurso) return;

        if (tipo === 'libro') idsLibros.add(idRecurso);
    });

    const [librosRes] = await Promise.all([
        idsLibros.size
            ? supabase.from('ejemplares').select('id,numero_ejemplar').in('id', Array.from(idsLibros))
            : Promise.resolve({ data: [], error: null })
    ]);

    if (librosRes.error) {
        console.error('Error obteniendo numero_ejemplar:', librosRes.error);
    }

    const mapaLibros = new Map((librosRes.data || []).map((item) => [String(item.id), item.numero_ejemplar]));

    return solicitudes.map((solicitud) => {
        const numeroMaterialExistente = (
            solicitud.numero_material ??
            solicitud.numero_ejemplar ??
            null
        );
        if (numeroMaterialExistente !== null && numeroMaterialExistente !== undefined) {
            return { ...solicitud, numero_material: numeroMaterialExistente };
        }

        const tipo = normalizarTipoSolicitud(solicitud);
        const idRecurso = obtenerIdRecursoSolicitud(solicitud);
        const idKey = idRecurso !== null ? String(idRecurso) : null;
        let numero_material = null;

        if (tipo === 'libro' && idKey && mapaLibros.has(idKey)) {
            numero_material = mapaLibros.get(idKey);
        }

        return { ...solicitud, numero_material: numero_material ?? solicitud.recurso_id ?? solicitud.id_recurso ?? null };
    });
}



// ==================== CANCELACION DE SOLICITUD ====================
async function CancelarSolicitud(tipoSolicitud, solicitudId, boleta) {
    const id = Number(solicitudId);
    if (!Number.isInteger(id)) {
        return { success: false, error: 'ID de solicitud inválido' };
    }
    let tabla = null;
    switch (tipoSolicitud) {
        case 'libro':
            tabla = 'solicitudes_libros';
            break;
        default:
            return { success: false, error: 'Tipo de solicitud inválido' };
    }

    try {
        const estadoCancelado = tipoSolicitud === 'libro' ? 4 : 3;

        let query = supabase
            .from(tabla)
            .update({ estado_asistencia_id: estadoCancelado })
            .eq('id', id)
            .eq('estado_asistencia_id', 1); // solo cancelar si está pendiente

        if (boleta) {
            query = query.eq('usuario_boleta', String(boleta));
        }

        const { error } = await query;

        if (error) {
            console.error('Error cancelando solicitud:', error);
            return { success: false, error: error.message };
        }

        return { success: true, error: null };
    } catch (err) {
        console.error('Error en CancelarSolicitud:', err);
        return { success: false, error: 'Error interno del servidor' };
    }
}

// ==================== EXPORTAR FUNCIONES ====================
module.exports = {
    CrearSolicitud,
    CrearSolicitudlibro,
    VerificarDisponibilidadRecurso,
    ObtenerSolicitudesActivasPorBoleta,
    CancelarSolicitud,
    getSolicitudes
};